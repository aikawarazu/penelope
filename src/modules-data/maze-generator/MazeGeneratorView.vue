<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import {
  ALGORITHMS,
  DIFFICULTIES,
  MAX_SIZE,
  MIN_SIZE,
  PALETTES,
  PAPERS,
  PLACEMENTS,
  clampSize,
  type AlgorithmId,
  type DifficultyId,
  type Maze,
  type OrientationId,
  type PaperId,
  type PlacementId
} from './lib/types'
import { generateMaze, type MazeOptions, type MazeResult } from './lib/generate'
import { countDeadEnds, solveMaze } from './lib/solve'
import { drawMaze, layoutFor, makeStyle, type StyleInput } from './lib/render'
import {
  downloadBlob,
  exportPdf,
  exportPng,
  exportSvg,
  mazeFileName
} from './lib/export'
import { randomSeed } from './lib/rng'

/* ----------------------------- 可调参数 ----------------------------- */

const difficulty = ref<DifficultyId>('medium')
const algorithm = ref<AlgorithmId>('backtracker')
const cols = ref(20)
const rows = ref(20)
const placement = ref<PlacementId>('corners')
const palette = ref(PALETTES[0].id)
const stroke = ref(5)
const corner = ref<'round' | 'square'>('round')
const markers = ref(true)
const paper = ref<PaperId>('A4')
const orientation = ref<OrientationId>('auto')
const seed = ref(randomSeed())
const showSolution = ref(false)

const braid = computed(
  () => DIFFICULTIES.find((d) => d.id === difficulty.value)?.braid ?? 0.3
)

function applyDifficulty(id: DifficultyId) {
  const preset = DIFFICULTIES.find((d) => d.id === id)
  if (!preset) return
  difficulty.value = id
  cols.value = preset.cols
  rows.value = preset.rows
  stroke.value = preset.stroke
  algorithm.value = preset.algorithm
}

function swapSize() {
  const t = cols.value
  cols.value = rows.value
  rows.value = t
}

function commitSize() {
  cols.value = clampSize(cols.value)
  rows.value = clampSize(rows.value)
}

/* ------------------------------ 生成 ------------------------------ */

const maze = shallowRef<Maze | null>(null)
const solution = shallowRef<number[]>([])
const deadEnds = ref(0)
const elapsed = ref(0)
const busy = ref(false)
const errorMessage = ref('')

/** 超过这个格数就丢进 Web Worker，避免大迷宫卡住界面 */
const WORKER_THRESHOLD = 4000

let worker: Worker | null = null

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL('./lib/worker.ts', import.meta.url), { type: 'module' })
  }
  return worker
}

function generateInWorker(options: MazeOptions): Promise<MazeResult> {
  const w = getWorker()
  return new Promise<MazeResult>((resolve, reject) => {
    const cleanup = () => {
      window.clearTimeout(timer)
      w.removeEventListener('message', onMessage)
      w.removeEventListener('error', onError)
    }
    const onMessage = (event: MessageEvent) => {
      cleanup()
      resolve(event.data as MazeResult)
    }
    const onError = (event: ErrorEvent) => {
      cleanup()
      reject(new Error(event.message || '后台生成失败'))
    }
    const timer = window.setTimeout(() => {
      cleanup()
      reject(new Error('后台生成超时'))
    }, 30000)

    w.addEventListener('message', onMessage)
    w.addEventListener('error', onError)
    w.postMessage(options)
  })
}

async function runGenerate(options: MazeOptions): Promise<MazeResult> {
  busy.value = true
  try {
    if (options.cols * options.rows > WORKER_THRESHOLD && typeof Worker !== 'undefined') {
      try {
        return await generateInWorker(options)
      } catch {
        // Worker 不可用时静默回退主线程
      }
    }
    return generateMaze(options)
  } finally {
    busy.value = false
  }
}

async function generate() {
  const options: MazeOptions = {
    cols: clampSize(cols.value),
    rows: clampSize(rows.value),
    algorithm: algorithm.value,
    braid: braid.value,
    placement: placement.value,
    seed: seed.value
  }
  const result = await runGenerate(options)
  maze.value = result.maze
  solution.value = solveMaze(result.maze)
  deadEnds.value = countDeadEnds(result.maze)
  elapsed.value = result.elapsedMs
  errorMessage.value = ''
}

function regenerate() {
  seed.value = randomSeed()
}

/* ------------------------------ 预览 ------------------------------ */

const canvasRef = ref<HTMLCanvasElement | null>(null)

const previewStyle = computed(() => {
  const m = maze.value
  const longest = m ? Math.max(m.cols, m.rows) : 20
  const cell = Math.max(4, Math.min(26, Math.floor(1300 / (longest + 1))))
  return makeStyle({
    palette: palette.value,
    stroke: stroke.value,
    round: corner.value === 'round',
    markers: markers.value,
    showSolution: showSolution.value,
    cell
  })
})

const styleInput = computed<StyleInput>(() => ({
  palette: palette.value,
  stroke: stroke.value,
  round: corner.value === 'round',
  markers: markers.value,
  showSolution: showSolution.value,
  cell: previewStyle.value.cell
}))

function paint() {
  const canvas = canvasRef.value
  const m = maze.value
  if (!canvas || !m) return
  const layout = layoutFor(m, previewStyle.value)
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  canvas.width = Math.round(layout.width * dpr)
  canvas.height = Math.round(layout.height * dpr)
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  drawMaze(ctx, m, solution.value, previewStyle.value)
}

watch([maze, solution, previewStyle], () => paint(), { flush: 'post' })

// 结构性参数一变就重新生成；配色/线宽这类只影响外观的参数走上面的重绘
watch([cols, rows, algorithm, braid, placement, seed], () => {
  void generate()
})

/* ------------------------------ 导出 ------------------------------ */

const exporting = ref('')

async function guard(ext: string, fn: () => Promise<Blob>) {
  const m = maze.value
  if (!m) return
  const filename = mazeFileName(m, seed.value, ext)
  exporting.value = ext
  errorMessage.value = ''
  try {
    const blob = await fn()
    downloadBlob(blob, filename)
  } catch (e) {
    errorMessage.value = e instanceof Error ? e.message : '导出失败'
  } finally {
    exporting.value = ''
  }
}

function onSvg() {
  const m = maze.value
  if (!m) return
  try {
    downloadBlob(exportSvg(m, solution.value, styleInput.value), mazeFileName(m, seed.value, 'svg'))
    errorMessage.value = ''
  } catch (e) {
    errorMessage.value = e instanceof Error ? e.message : '导出失败'
  }
}

function onPng() {
  const m = maze.value
  if (!m) return
  void guard('png', () => exportPng(m, solution.value, styleInput.value))
}

function onPdf() {
  const m = maze.value
  if (!m) return
  void guard('pdf', () =>
    exportPdf(m, solution.value, styleInput.value, {
      paper: paper.value,
      orientation: orientation.value
    })
  )
}

/* ------------------------------ 生命周期 ------------------------------ */

onMounted(() => {
  void generate()
})

onBeforeUnmount(() => {
  worker?.terminate()
  worker = null
})

const totalCells = computed(() => (maze.value ? maze.value.cols * maze.value.rows : 0))
const solutionSteps = computed(() => Math.max(0, solution.value.length - 1))
</script>

<template>
  <div class="mz">
    <section class="panel">
      <div class="field">
        <span class="label">难度</span>
        <div class="seg">
          <button
            v-for="d in DIFFICULTIES"
            :key="d.id"
            :class="{ on: difficulty === d.id }"
            :title="d.hint"
            @click="applyDifficulty(d.id)"
          >
            {{ d.label }}
          </button>
        </div>
      </div>

      <div class="field">
        <span class="label">算法</span>
        <div class="seg">
          <button
            v-for="a in ALGORITHMS"
            :key="a.id"
            :class="{ on: algorithm === a.id }"
            :title="a.hint"
            @click="algorithm = a.id"
          >
            {{ a.label }}
          </button>
        </div>
      </div>

      <div class="field">
        <span class="label">尺寸</span>
        <div class="size">
          <input v-model.number="cols" type="number" :min="MIN_SIZE" :max="MAX_SIZE" @change="commitSize" />
          <span class="x">×</span>
          <input v-model.number="rows" type="number" :min="MIN_SIZE" :max="MAX_SIZE" @change="commitSize" />
          <button class="mini" title="横竖交换" @click="swapSize">⇄</button>
        </div>
        <p class="note">{{ MIN_SIZE }} ~ {{ MAX_SIZE }} 格 · 当前 {{ totalCells }} 格</p>
      </div>

      <div class="field">
        <span class="label">出入口</span>
        <div class="seg">
          <button
            v-for="p in PLACEMENTS"
            :key="p.id"
            :class="{ on: placement === p.id }"
            :title="p.hint"
            @click="placement = p.id"
          >
            {{ p.label }}
          </button>
        </div>
      </div>

      <div class="field">
        <span class="label">配色</span>
        <div class="swatches">
          <button
            v-for="p in PALETTES"
            :key="p.id"
            class="swatch"
            :class="{ on: palette === p.id }"
            :title="p.label"
            :style="{ background: p.wall, borderColor: p.solution }"
            @click="palette = p.id"
          />
        </div>
      </div>

      <div class="field">
        <span class="label">墙线粗细</span>
        <input v-model.number="stroke" class="range" type="range" min="1" max="10" step="1" />
      </div>

      <div class="field">
        <span class="label">拐角</span>
        <div class="seg">
          <button :class="{ on: corner === 'round' }" @click="corner = 'round'">圆角</button>
          <button :class="{ on: corner === 'square' }" @click="corner = 'square'">直角</button>
        </div>
      </div>

      <div class="field">
        <span class="label">纸张</span>
        <div class="size">
          <select v-model="paper">
            <option v-for="p in PAPERS" :key="p.id" :value="p.id">{{ p.label }}</option>
          </select>
          <select v-model="orientation">
            <option value="auto">自适应</option>
            <option value="portrait">纵向</option>
            <option value="landscape">横向</option>
          </select>
        </div>
      </div>

      <div class="field">
        <span class="label">种子</span>
        <div class="size">
          <input v-model.number="seed" type="number" min="1" />
          <button class="mini" title="换一个随机种子" @click="regenerate">🎲</button>
        </div>
        <p class="note">相同设置 + 相同种子 = 完全相同的迷宫</p>
      </div>

      <label class="check">
        <input v-model="markers" type="checkbox" />
        <span>显示起终点标记</span>
      </label>
    </section>

    <section class="stage">
      <div class="canvas-box">
        <canvas ref="canvasRef" class="preview" />
        <div v-if="busy" class="mask">生成中…</div>
      </div>

      <label class="check solution">
        <input v-model="showSolution" type="checkbox" />
        <span>显示答案路径</span>
      </label>

      <div class="stats">
        <span><b>{{ maze ? maze.cols : 0 }}×{{ maze ? maze.rows : 0 }}</b>格</span>
        <span><b>{{ deadEnds }}</b> 死角</span>
        <span>最短 <b>{{ solutionSteps }}</b> 步</span>
        <span>生成 <b>{{ elapsed.toFixed(1) }}</b> ms</span>
      </div>

      <div class="actions">
        <button class="big-btn" :disabled="busy" @click="regenerate">换一张</button>
        <button class="ghost" :disabled="busy || exporting === 'pdf'" @click="onPdf">
          {{ exporting === 'pdf' ? '导出中…' : 'PDF（含答案页）' }}
        </button>
        <button class="ghost" :disabled="busy || exporting === 'png'" @click="onPng">
          {{ exporting === 'png' ? '导出中…' : 'PNG' }}
        </button>
        <button class="ghost" :disabled="busy" @click="onSvg">SVG</button>
      </div>

      <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
      <p class="note">PDF 第 1 页是题目，第 2 页是答案；PNG / SVG 按上方「显示答案路径」开关导出。</p>
    </section>
  </div>
</template>

<style scoped>
.mz {
  display: grid;
  grid-template-columns: minmax(0, 260px) minmax(0, 1fr);
  gap: 18px;
  align-items: start;
}

.panel,
.stage {
  background: #fff;
  border-radius: 22px;
  padding: 16px;
  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.06);
}

.stage {
  text-align: center;
}

/* ---------- 控制面板 ---------- */
.field {
  margin-bottom: 14px;
}

.label {
  display: block;
  font-size: 12px;
  color: var(--muted);
  margin-bottom: 6px;
}

.seg {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.seg button {
  flex: 1 1 auto;
  min-width: 56px;
  padding: 7px 8px;
  border-radius: 12px;
  font-size: 13px;
  background: #f4f7f5;
  color: var(--ink);
  border: 2px solid transparent;
}

.seg button.on {
  background: color-mix(in srgb, var(--accent) 14%, #fff);
  border-color: var(--accent);
  color: var(--accent);
  font-weight: 600;
}

.size {
  display: flex;
  align-items: center;
  gap: 6px;
}

.size input,
.size select {
  width: 100%;
  min-width: 0;
  padding: 7px 8px;
  border: 2px solid #e6efea;
  border-radius: 12px;
  font-size: 14px;
  font-family: inherit;
  color: inherit;
  background: #fff;
}

.size select {
  flex: 1;
}

.x {
  color: var(--muted);
}

.mini {
  flex: 0 0 auto;
  width: 36px;
  height: 34px;
  border-radius: 12px;
  background: #f4f7f5;
  font-size: 15px;
}

.range {
  width: 100%;
  accent-color: var(--accent);
}

.swatches {
  display: flex;
  gap: 8px;
}

.swatch {
  width: 30px;
  height: 30px;
  border-radius: 10px;
  border: 3px solid transparent;
}

.swatch.on {
  box-shadow: 0 0 0 2px #fff inset;
  outline: 2px solid var(--accent);
  outline-offset: 1px;
}

.note {
  margin: 6px 0 0;
  font-size: 12px;
  color: var(--muted);
  line-height: 1.5;
}

.check {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--ink);
  cursor: pointer;
}

.check input {
  accent-color: var(--accent);
}

/* ---------- 预览区 ---------- */
.canvas-box {
  position: relative;
}

.preview {
  width: 100%;
  height: auto;
  display: block;
  border-radius: 16px;
  background: #fff;
}

.mask {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  background: rgba(255, 255, 255, 0.72);
  border-radius: 16px;
  font-size: 14px;
  color: var(--accent);
  font-weight: 600;
}

.solution {
  justify-content: center;
  margin: 12px 0 6px;
}

.stats {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 6px 14px;
  font-size: 12px;
  color: var(--muted);
  margin-bottom: 14px;
}

.stats b {
  color: var(--ink);
  font-size: 13px;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
}

.ghost {
  padding: 12px 14px;
  border-radius: 16px;
  font-size: 14px;
  font-weight: 600;
  color: var(--accent);
  background: color-mix(in srgb, var(--accent) 10%, #fff);
  border: 2px solid color-mix(in srgb, var(--accent) 30%, transparent);
}

.ghost:disabled,
.big-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.error {
  color: #dc2626;
  font-size: 13px;
}

@media (max-width: 720px) {
  .mz {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
