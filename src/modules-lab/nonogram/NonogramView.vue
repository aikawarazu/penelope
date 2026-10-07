<script setup lang="ts">
import { computed, onMounted, ref, shallowRef, watch } from 'vue'
import { randomSeed } from '@/lib/puzzle/rng'
import { PAPERS, type PaperId } from '@/lib/puzzle/paper'
import { downloadBlob } from '@/lib/puzzle/download'
import {
  buildPuzzle,
  emptyGrid,
  generateFromPattern,
  isSolved,
  progressOf,
  type NonogramPuzzle
} from './lib/generate'
import {
  drawNonogramPage,
  drawPlainGrid,
  hitNonogram,
  hitPlainGrid,
  type AreaBox,
  type NonogramDrawOptions
} from './lib/render'
import { PATTERNS } from './lib/patterns'
import { exportNonogramPdf, exportNonogramPng } from './lib/export'

type Mode = 'pattern' | 'custom'
type Tool = 'fill' | 'cross'

const accent = '#7c6cf0'

/* ----------------------------- 可调参数 ----------------------------- */

const title = ref('数织画')
const mode = ref<Mode>('pattern')
const patternId = ref(PATTERNS[0].id)
const customCols = ref(10)
const customRows = ref(10)
const tool = ref<Tool>('fill')
const paper = ref<PaperId>('A4')
const seed = ref(randomSeed())
const showTitle = ref(true)
const showSolution = ref(false)

const CUSTOM_SIZES = [10, 15, 20]

/* ------------------------------ 状态 ------------------------------ */

const puzzle = shallowRef<NonogramPuzzle | null>(null)
const customFilled = ref<boolean[]>(emptyGrid(10, 10))
const player = ref<boolean[]>([])
const crosses = ref<boolean[]>([])
const exporting = ref('')
const errorMessage = ref('')

const drawOptions = computed<NonogramDrawOptions>(() => ({
  title: title.value,
  showTitle: showTitle.value,
  showSolution: mode.value === 'custom' ? false : showSolution.value,
  player: player.value,
  crosses: crosses.value,
  accent,
  ink: '#2b3a33',
  muted: '#7a8a82'
}))

const progress = computed(() =>
  puzzle.value ? progressOf(puzzle.value, player.value) : { right: 0, total: 0 }
)
const won = computed(() => !!puzzle.value && isSolved(puzzle.value, player.value))

function regenerate() {
  seed.value = randomSeed()
}

function buildFromPattern() {
  const p = generateFromPattern(patternId.value, seed.value)
  puzzle.value = p
  player.value = new Array(p.filled.length).fill(false)
  crosses.value = new Array(p.filled.length).fill(false)
  errorMessage.value = ''
}

function buildFromCustom() {
  const p = buildPuzzle(
    customCols.value,
    customRows.value,
    customFilled.value,
    '手绘图案',
    'custom',
    seed.value
  )
  puzzle.value = p
  player.value = new Array(p.filled.length).fill(false)
  crosses.value = new Array(p.filled.length).fill(false)
  errorMessage.value = ''
}

function rebuild() {
  if (mode.value === 'pattern') buildFromPattern()
  else buildFromCustom()
}

watch([patternId, seed], () => {
  if (mode.value === 'pattern') buildFromPattern()
})

watch([customCols, customRows], () => {
  customFilled.value = emptyGrid(customCols.value, customRows.value)
  if (mode.value === 'custom') buildFromCustom()
})

watch(mode, rebuild)

/* ------------------------------ 画布 ------------------------------ */

const VIEW = 520
const box = computed<AreaBox>(() => ({ x: VIEW * 0.05, y: VIEW * 0.03, w: VIEW * 0.9, h: VIEW * 0.94 }))
const puzzleCanvas = ref<HTMLCanvasElement | null>(null)
const customCanvas = ref<HTMLCanvasElement | null>(null)

const dpr = () => Math.min(window.devicePixelRatio || 1, 2)

function paintPuzzle() {
  const canvas = puzzleCanvas.value
  const p = puzzle.value
  if (!canvas || !p) return
  const d = dpr()
  canvas.width = Math.round(VIEW * d)
  canvas.height = Math.round(VIEW * d)
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.setTransform(d, 0, 0, d, 0, 0)
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, VIEW, VIEW)
  drawNonogramPage(ctx, p, box.value, drawOptions.value)
}

function paintCustom() {
  const canvas = customCanvas.value
  if (!canvas) return
  const d = dpr()
  canvas.width = Math.round(VIEW * d)
  canvas.height = Math.round(VIEW * d)
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.setTransform(d, 0, 0, d, 0, 0)
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, VIEW, VIEW)
  drawPlainGrid(ctx, customCols.value, customRows.value, customFilled.value, box.value, '#2b3a33', '#c9d6cf', accent)
}

watch([puzzle, drawOptions], () => paintPuzzle(), { flush: 'post' })
watch([customFilled, customCols, customRows], () => paintCustom(), { flush: 'post' })

/* ------------------------------ 交互 ------------------------------ */

function localCoords(e: PointerEvent, canvas: HTMLCanvasElement) {
  const rect = canvas.getBoundingClientRect()
  const d = dpr()
  return {
    x: ((e.clientX - rect.left) * (canvas.width / rect.width)) / d,
    y: ((e.clientY - rect.top) * (canvas.height / rect.height)) / d
  }
}

function onPuzzlePick(e: PointerEvent) {
  const p = puzzle.value
  const canvas = puzzleCanvas.value
  if (!p || !canvas) return
  const { x, y } = localCoords(e, canvas)
  const idx = hitNonogram(p, box.value, showTitle.value, x, y)
  if (idx < 0) return

  if (tool.value === 'fill') {
    player.value = player.value.map((v, i) => (i === idx ? !v : v))
    crosses.value = crosses.value.map((v, i) => (i === idx ? false : v))
  } else {
    crosses.value = crosses.value.map((v, i) => (i === idx ? !v : v))
    player.value = player.value.map((v, i) => (i === idx ? false : v))
  }
}

function onCustomPaint(e: PointerEvent) {
  const canvas = customCanvas.value
  if (!canvas) return
  const { x, y } = localCoords(e, canvas)
  const idx = hitPlainGrid(customCols.value, customRows.value, box.value, x, y)
  if (idx < 0) return
  customFilled.value = customFilled.value.map((v, i) => (i === idx ? !v : v))
}

function clearPlayer() {
  const p = puzzle.value
  if (!p) return
  player.value = new Array(p.filled.length).fill(false)
  crosses.value = new Array(p.filled.length).fill(false)
}

function clearCustom() {
  customFilled.value = emptyGrid(customCols.value, customRows.value)
}

function setCustomSize(s: number) {
  customCols.value = s
  customRows.value = s
}

/* ------------------------------ 导出 ------------------------------ */

async function guard(ext: string, fn: () => Promise<Blob>) {
  const p = puzzle.value
  if (!p) return
  exporting.value = ext
  errorMessage.value = ''
  try {
    downloadBlob(await fn(), `nonogram-${p.cols}x${p.rows}-${p.seed}.${ext}`)
  } catch (e) {
    errorMessage.value = e instanceof Error ? e.message : '导出失败'
  } finally {
    exporting.value = ''
  }
}

function onPdf() {
  const p = puzzle.value
  if (!p) return
  void guard('pdf', () =>
    exportNonogramPdf(p, { ...drawOptions.value, showSolution: false }, paper.value)
  )
}

function onPng() {
  const p = puzzle.value
  if (!p) return
  void guard('png', () => exportNonogramPng(p, drawOptions.value))
}

onMounted(() => {
  rebuild()
  paintPuzzle()
  paintCustom()
})
</script>

<template>
  <div class="puzzle-layout">
    <section class="puzzle-panel">
      <div class="puzzle-field">
        <span class="puzzle-label">标题</span>
        <input v-model="title" class="puzzle-input" type="text" maxlength="18" />
      </div>

      <div class="puzzle-field">
        <span class="puzzle-label">出题方式</span>
        <div class="puzzle-seg">
          <button :class="{ on: mode === 'pattern' }" @click="mode = 'pattern'">内置图案</button>
          <button :class="{ on: mode === 'custom' }" @click="mode = 'custom'">自己画</button>
        </div>
      </div>

      <template v-if="mode === 'pattern'">
        <div class="puzzle-field">
          <span class="puzzle-label">图案</span>
          <select v-model="patternId" class="puzzle-select">
            <option v-for="p in PATTERNS" :key="p.id" :value="p.id">{{ p.label }}（{{ p.rows.length }}×{{ p.rows[0].length }}）</option>
          </select>
        </div>
        <div class="puzzle-field">
          <span class="puzzle-label">种子</span>
          <div class="puzzle-row">
            <input v-model.number="seed" type="number" min="1" />
            <button class="puzzle-mini" title="换一个随机种子" @click="regenerate">🎲</button>
          </div>
        </div>
      </template>

      <template v-else>
        <div class="puzzle-field">
          <span class="puzzle-label">网格大小</span>
          <div class="puzzle-seg">
            <button
              v-for="s in CUSTOM_SIZES"
              :key="s"
              :class="{ on: customCols === s && customRows === s }"
              @click="setCustomSize(s)"
            >
              {{ s }}×{{ s }}
            </button>
          </div>
        </div>
        <div class="puzzle-field">
          <div class="puzzle-row">
            <button class="puzzle-ghost" style="flex: 1" @click="clearCustom">清空画布</button>
          </div>
          <p class="puzzle-note">在右边网格上点格子涂黑，线索会自动算好。</p>
        </div>
      </template>

      <div class="puzzle-field">
        <span class="puzzle-label">画笔</span>
        <div class="puzzle-seg">
          <button :class="{ on: tool === 'fill' }" @click="tool = 'fill'">涂色</button>
          <button :class="{ on: tool === 'cross' }" @click="tool = 'cross'">打 ×</button>
        </div>
      </div>

      <label class="puzzle-check">
        <input v-model="showTitle" type="checkbox" />
        <span>显示标题</span>
      </label>

      <label class="puzzle-check" style="margin-top: 8px">
        <input v-model="showSolution" type="checkbox" />
        <span>预览显示答案</span>
      </label>

      <div class="puzzle-field" style="margin-top: 14px">
        <span class="puzzle-label">纸张</span>
        <div class="puzzle-row">
          <select v-model="paper">
            <option v-for="p in PAPERS" :key="p.id" :value="p.id">{{ p.label }}</option>
          </select>
        </div>
      </div>
    </section>

    <section class="puzzle-stage">
      <div class="puzzle-box">
        <canvas
          v-show="mode === 'pattern'"
          ref="puzzleCanvas"
          class="puzzle-canvas"
          style="border-radius: 16px; cursor: pointer"
          @pointerdown="onPuzzlePick"
        />
        <canvas
          v-show="mode === 'custom'"
          ref="customCanvas"
          class="puzzle-canvas"
          style="border-radius: 16px; cursor: pointer"
          @pointerdown="onCustomPaint"
        />
      </div>

      <p class="puzzle-note" style="text-align: center; margin-top: 10px">
        <template v-if="mode === 'pattern'">
          点格子涂色，涂满图案就完成啦；不确定的地方可以先打 ×
        </template>
        <template v-else>点格子把你想要的图案画出来，行列线索会自动生成</template>
      </p>

      <div v-if="mode === 'pattern'" class="puzzle-stats">
        <span>图案 <b>{{ puzzle?.patternLabel ?? '—' }}</b></span>
        <span>已涂对 <b>{{ progress.right }}</b> / {{ progress.total }} 格</span>
        <span>网格 <b>{{ puzzle?.cols ?? 0 }}×{{ puzzle?.rows ?? 0 }}</b></span>
      </div>
      <div v-else class="puzzle-stats">
        <span>手绘网格 <b>{{ customCols }}×{{ customRows }}</b></span>
        <span>已涂 <b>{{ customFilled.filter(Boolean).length }}</b> 格</span>
      </div>

      <p v-if="won" class="puzzle-win">图案完成啦 🎉</p>

      <div class="puzzle-actions">
        <template v-if="mode === 'pattern'">
          <button class="big-btn" @click="regenerate">换一题</button>
          <button class="puzzle-ghost" @click="clearPlayer">重来</button>
        </template>
        <button class="puzzle-ghost" :disabled="exporting === 'pdf'" @click="onPdf">
          {{ exporting === 'pdf' ? '导出中…' : 'PDF（含答案）' }}
        </button>
        <button class="puzzle-ghost" :disabled="exporting === 'png'" @click="onPng">
          {{ exporting === 'png' ? '导出中…' : 'PNG' }}
        </button>
      </div>

      <p v-if="errorMessage" class="puzzle-error">{{ errorMessage }}</p>
      <p class="puzzle-note">PDF 第 1 页是题目，第 2 页是涂好的答案。</p>
    </section>
  </div>
</template>