<script setup lang="ts">
import { computed, onMounted, ref, shallowRef, watch } from 'vue'
import { randomSeed } from '@/lib/puzzle/rng'
import { PAPERS, type PaperId } from '@/lib/puzzle/paper'
import { downloadBlob } from '@/lib/puzzle/download'
import {
  DIFFICULTIES,
  SUDOKU_SIZES,
  conflictsOf,
  generateSudoku,
  isSolvedSudoku,
  symbolsFor,
  type DifficultyId,
  type GeneratedSudoku
} from './lib/sudoku'
import { drawSudokuBoard, hitSudoku, type AreaBox, type SudokuBoard, type SudokuPageOptions } from './lib/render'
import { exportSudokuPdf, exportSudokuPng } from './lib/export'

const accent = '#3fa7ff'

/* ----------------------------- 可调参数 ----------------------------- */

const sizeIndex = ref(0)
const difficulty = ref<DifficultyId>('easy')
const count = ref(1)
const paper = ref<PaperId>('A4')
const seed = ref(randomSeed())
const showSolution = ref(false)

const size = computed(() => SUDOKU_SIZES[sizeIndex.value])
const symbols = computed(() => symbolsFor(size.value.n))
const targetClues = computed(
  () => DIFFICULTIES.find((d) => d.id === difficulty.value)?.clues[size.value.n] ?? 30
)

/* ------------------------------ 状态 ------------------------------ */

const puzzles = shallowRef<GeneratedSudoku[]>([])
const current = ref(0)
const player = ref<Int8Array>(new Int8Array(0))
const selected = ref(-1)
const hintCell = ref(-1)
const exporting = ref('')
const errorMessage = ref('')

const currentPuzzle = computed(() => puzzles.value[current.value] ?? null)
const conflicts = computed(() =>
  currentPuzzle.value ? conflictsOf(player.value, size.value.n, size.value.bh, size.value.bw) : new Set<number>()
)
const filledCount = computed(() => player.value.reduce((acc, v) => acc + (v ? 1 : 0), 0))
const won = computed(
  () => !!currentPuzzle.value && isSolvedSudoku(player.value, currentPuzzle.value.solution)
)

function loadPlayer() {
  const p = currentPuzzle.value
  if (!p) return
  player.value = Int8Array.from(p.puzzle)
  selected.value = -1
  hintCell.value = -1
}

function build() {
  const n = Math.max(1, Math.min(9, Math.round(count.value)))
  const list: GeneratedSudoku[] = []
  for (let i = 0; i < n; i++) {
    list.push(generateSudoku(size.value.n, size.value.bh, size.value.bw, targetClues.value, seed.value + i * 977))
  }
  puzzles.value = list
  current.value = 0
  loadPlayer()
  errorMessage.value = ''
}

function regenerate() {
  seed.value = randomSeed()
}

watch([sizeIndex, difficulty, count, seed], () => build())
watch(current, () => loadPlayer())

/* ------------------------------ 渲染 ------------------------------ */

const VIEW = 520
const box = computed<AreaBox>(() => ({ x: VIEW * 0.05, y: VIEW * 0.03, w: VIEW * 0.9, h: VIEW * 0.94 }))
const canvasRef = ref<HTMLCanvasElement | null>(null)

const pageOptions = computed<SudokuPageOptions>(() => ({
  accent,
  ink: '#2b3a33',
  muted: '#7a8a82',
  boldBoxes: true,
  title: null
}))

const board = computed<SudokuBoard | null>(() => {
  const p = currentPuzzle.value
  if (!p) return null
  const n = size.value.n
  return {
    n,
    bh: size.value.bh,
    bw: size.value.bw,
    label: null,
    cells: Array.from({ length: n * n }, (_, i) => ({
      value: player.value[i] ?? 0,
      given: p.puzzle[i] !== 0,
      conflict: conflicts.value.has(i),
      selected: selected.value === i,
      hint: hintCell.value === i
    }))
  }
})

const dpr = () => Math.min(window.devicePixelRatio || 1, 2)

function paint() {
  const canvas = canvasRef.value
  const b = board.value
  if (!canvas || !b) return
  const d = dpr()
  canvas.width = Math.round(VIEW * d)
  canvas.height = Math.round(VIEW * d)
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.setTransform(d, 0, 0, d, 0, 0)
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, VIEW, VIEW)
  drawSudokuBoard(ctx, b, box.value, { ...pageOptions.value }, symbols.value)

  // 顶部图例
  const legendY = VIEW * 0.06
  const size2 = Math.min(VIEW * 0.07, (VIEW * 0.9) / symbols.value.n / 1.6)
  const gap = size2 * 1.4
  const startX = VIEW / 2 - ((symbols.value.n - 1) * gap) / 2
  symbols.value.emoji.forEach((emoji, i) => {
    ctx.save()
    ctx.font = `${Math.round(size2)}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",system-ui,sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(emoji, startX + i * gap, legendY)
    ctx.restore()
  })
}

watch([board, pageOptions], () => paint(), { flush: 'post' })

/* ------------------------------ 交互 ------------------------------ */

function onPick(e: PointerEvent) {
  const b = board.value
  const p = currentPuzzle.value
  const canvas = canvasRef.value
  if (!b || !p || !canvas) return
  const rect = canvas.getBoundingClientRect()
  const d = dpr()
  const x = ((e.clientX - rect.left) * (canvas.width / rect.width)) / d
  const y = ((e.clientY - rect.top) * (canvas.height / rect.height)) / d
  const idx = hitSudoku(b, box.value, x, y)
  if (idx < 0) return
  if (p.puzzle[idx] !== 0) {
    selected.value = -1
    return
  }
  selected.value = selected.value === idx ? -1 : idx
  hintCell.value = -1
}

function place(v: number) {
  const p = currentPuzzle.value
  if (!p || selected.value < 0) return
  const idx = selected.value
  if (p.puzzle[idx] !== 0) return
  player.value = Int8Array.from(player.value)
  player.value[idx] = v
  if (player.value[idx] === p.solution[idx]) selected.value = -1
  hintCell.value = -1
}

function eraseSelected() {
  const p = currentPuzzle.value
  if (!p || selected.value < 0) return
  const idx = selected.value
  if (p.puzzle[idx] !== 0) return
  player.value = Int8Array.from(player.value)
  player.value[idx] = 0
}

/** 提示：随机填一个还没填对的空格 */
function hint() {
  const p = currentPuzzle.value
  if (!p) return
  const empties: number[] = []
  for (let i = 0; i < player.value.length; i++) {
    if (player.value[i] !== p.solution[i]) empties.push(i)
  }
  if (!empties.length) return
  const pick = empties[Math.floor(Math.random() * empties.length)]
  player.value = Int8Array.from(player.value)
  player.value[pick] = p.solution[pick]
  hintCell.value = pick
  selected.value = -1
}

/* ------------------------------ 导出 ------------------------------ */

async function guard(ext: string, fn: () => Promise<Blob>) {
  if (!puzzles.value.length) return
  exporting.value = ext
  errorMessage.value = ''
  try {
    downloadBlob(await fn(), `sudoku-${size.value.n}x${size.value.n}-${seed.value}.${ext}`)
  } catch (e) {
    errorMessage.value = e instanceof Error ? e.message : '导出失败'
  } finally {
    exporting.value = ''
  }
}

function onPdf() {
  const list = puzzles.value
  if (!list.length) return
  void guard('pdf', () =>
    exportSudokuPdf(
      list.map((p) => ({ n: size.value.n, bh: size.value.bh, bw: size.value.bw, values: p.puzzle })),
      list.map((p) => p.solution),
      pageOptions.value,
      paper.value
    )
  )
}

function onPng() {
  const p = currentPuzzle.value
  if (!p) return
  void guard('png', () =>
    exportSudokuPng(
      {
        n: size.value.n,
        bh: size.value.bh,
        bw: size.value.bw,
        values: showSolution.value ? p.solution : p.puzzle
      },
      pageOptions.value
    )
  )
}

onMounted(() => {
  build()
  paint()
})
</script>

<template>
  <div class="puzzle-layout">
    <section class="puzzle-panel">
      <div class="puzzle-field">
        <span class="puzzle-label">尺寸</span>
        <div class="puzzle-seg">
          <button
            v-for="(s, i) in SUDOKU_SIZES"
            :key="s.n"
            :class="{ on: sizeIndex === i }"
            :title="s.hint"
            @click="sizeIndex = i"
          >
            {{ s.label }}
          </button>
        </div>
        <p class="puzzle-note">{{ size.hint }}</p>
      </div>

      <div class="puzzle-field">
        <span class="puzzle-label">难度</span>
        <div class="puzzle-seg">
          <button
            v-for="d in DIFFICULTIES"
            :key="d.id"
            :class="{ on: difficulty === d.id }"
            :title="d.hint"
            @click="difficulty = d.id"
          >
            {{ d.label }}
          </button>
        </div>
        <p class="puzzle-note">目标给定 {{ targetClues }} 个数字</p>
      </div>

      <div class="puzzle-field">
        <span class="puzzle-label">题目数量</span>
        <div class="puzzle-row">
          <input v-model.number="count" type="number" min="1" max="9" />
          <span class="puzzle-note">1~9 题</span>
        </div>
      </div>

      <div class="puzzle-field">
        <span class="puzzle-label">纸张</span>
        <div class="puzzle-row">
          <select v-model="paper">
            <option v-for="p in PAPERS" :key="p.id" :value="p.id">{{ p.label }}</option>
          </select>
        </div>
      </div>

      <label class="puzzle-check">
        <input v-model="showSolution" type="checkbox" />
        <span>PNG 导出答案</span>
      </label>

      <div class="puzzle-field" style="margin-top: 14px">
        <span class="puzzle-label">种子</span>
        <div class="puzzle-row">
          <input v-model.number="seed" type="number" min="1" />
          <button class="puzzle-mini" title="换一个随机种子" @click="regenerate">🎲</button>
        </div>
        <p class="puzzle-note">每道题的解都保证唯一</p>
      </div>
    </section>

    <section class="puzzle-stage">
      <div class="puzzle-box">
        <canvas
          ref="canvasRef"
          class="puzzle-canvas"
          style="border-radius: 16px; cursor: pointer"
          @pointerdown="onPick"
        />
      </div>

      <p class="puzzle-note" style="text-align: center; margin-top: 10px">
        先点一个空格，再点下面的图形放进去；每行、每列、每个宫里的图形都不重复
      </p>

      <div class="puzzle-row" style="justify-content: center; flex-wrap: wrap; margin-top: 8px">
        <button
          v-for="(emoji, i) in symbols.emoji"
          :key="emoji"
          class="puzzle-mini"
          style="width: 44px; height: 44px; font-size: 24px"
          :title="symbols.label[i]"
          :disabled="selected < 0"
          @click="place(i + 1)"
        >
          {{ emoji }}
        </button>
        <button class="puzzle-mini" style="width: 44px" :disabled="selected < 0" @click="eraseSelected">🧽</button>
        <button class="puzzle-mini" style="width: 44px" title="提示一格" @click="hint">💡</button>
      </div>

      <div v-if="puzzles.length > 1" class="puzzle-seg" style="justify-content: center; margin-top: 12px">
        <button :disabled="current === 0" @click="current--">← 上一题</button>
        <button disabled style="flex: 0 0 auto">第 {{ current + 1 }} / {{ puzzles.length }} 题</button>
        <button :disabled="current >= puzzles.length - 1" @click="current++">下一题 →</button>
      </div>

      <div class="puzzle-stats">
        <span>已填 <b>{{ filledCount }}</b> / {{ size.n * size.n }}</span>
        <span v-if="conflicts.size" style="color: #dc2626">冲突 <b>{{ conflicts.size }}</b> 处</span>
        <span v-else>当前没有冲突</span>
        <span>给定 <b>{{ currentPuzzle?.clues ?? 0 }}</b> 个</span>
      </div>

      <p v-if="won" class="puzzle-win">完成啦 🎉</p>

      <div class="puzzle-actions">
        <button class="big-btn" @click="regenerate">换一批</button>
        <button class="puzzle-ghost" @click="loadPlayer">重来</button>
        <button class="puzzle-ghost" :disabled="exporting === 'pdf'" @click="onPdf">
          {{ exporting === 'pdf' ? '导出中…' : 'PDF（含答案）' }}
        </button>
        <button class="puzzle-ghost" :disabled="exporting === 'png'" @click="onPng">
          {{ exporting === 'png' ? '导出中…' : 'PNG' }}
        </button>
      </div>

      <p v-if="errorMessage" class="puzzle-error">{{ errorMessage }}</p>
      <p class="puzzle-note">PDF 第 1 页题目、第 2 页答案，多题会自动排版。</p>
    </section>
  </div>
</template>