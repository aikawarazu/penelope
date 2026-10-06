<script setup lang="ts">
import { computed, onMounted, ref, shallowRef, watch } from 'vue'
import { PICTURE_SETS } from '@/lib/puzzle/pictures'
import { randomSeed } from '@/lib/puzzle/rng'
import { PAPERS, type PaperId } from '@/lib/puzzle/paper'
import { downloadBlob } from '@/lib/puzzle/download'
import { generateFindPuzzle, runAt } from './lib/generate'
import { drawFindPage, findLayout, hitFind, type AreaBox } from './lib/render'
import { exportFindPdf, exportFindPng } from './lib/export'
import { FIND_SIZES, type FindDrawOptions, type FindPuzzle, type FindSize } from './lib/types'

/* ----------------------------- 可调参数 ----------------------------- */

const title = ref('图形找找看')
const setId = ref(PICTURE_SETS[0].id)
const size = ref<FindSize>(8)
const runLength = ref(4)
const runCount = ref(3)
const allowDiagonal = ref(true)
const paper = ref<PaperId>('A4')
const seed = ref(randomSeed())
const showTitle = ref(true)
const showSolution = ref(false)

const accent = '#f5a524'

/* ------------------------------ 状态 ------------------------------ */

const puzzle = shallowRef<FindPuzzle | null>(null)
const foundRuns = ref<Set<number>>(new Set())
const missIndex = ref(-1)
const exporting = ref('')
const errorMessage = ref('')

const won = computed(() => !!puzzle.value && foundRuns.value.size >= puzzle.value.runs.length)

const drawOptions = computed<FindDrawOptions>(() => ({
  title: title.value,
  showTitle: showTitle.value,
  showSolution: showSolution.value,
  foundRuns: foundRuns.value,
  accent,
  ink: '#2b3a33',
  muted: '#7a8a82'
}))

function build() {
  puzzle.value = generateFindPuzzle({
    size: size.value,
    runLength: runLength.value,
    runCount: runCount.value,
    allowDiagonal: allowDiagonal.value,
    setId: setId.value,
    seed: seed.value
  })
  foundRuns.value = new Set()
  missIndex.value = -1
  errorMessage.value = ''
}

function regenerate() {
  seed.value = randomSeed()
}

watch([setId, size, runLength, runCount, allowDiagonal, seed], () => build())

/* ------------------------------ 交互 ------------------------------ */

function onPick(e: PointerEvent) {
  const p = puzzle.value
  const canvas = canvasRef.value
  if (!p || !canvas) return
  const rect = canvas.getBoundingClientRect()
  const scale = canvas.width / rect.width
  const px = (e.clientX - rect.left) * scale
  const py = (e.clientY - rect.top) * scale
  const box = currentBox.value
  const dpr = box.dpr
  const idx = hitFind(p, box.box, showTitle.value, px / dpr, py / dpr)
  if (idx < 0) return
  const run = runAt(p, idx, foundRuns.value)
  if (run < 0) {
    missIndex.value = idx
    setTimeout(() => (missIndex.value = -1), 320)
    return
  }
  const next = new Set(foundRuns.value)
  next.add(run)
  foundRuns.value = next
}

/* ------------------------------ 预览 ------------------------------ */

const canvasRef = ref<HTMLCanvasElement | null>(null)
const VIEW_W = 520
const VIEW_H = Math.round(VIEW_W * 1.18)

const currentBox = computed(() => {
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const box: AreaBox = { x: VIEW_W * 0.04, y: VIEW_H * 0.03, w: VIEW_W * 0.92, h: VIEW_H * 0.94 }
  return { box, dpr }
})

function paint() {
  const canvas = canvasRef.value
  const p = puzzle.value
  if (!canvas || !p) return
  const { dpr } = currentBox.value
  canvas.width = Math.round(VIEW_W * dpr)
  canvas.height = Math.round(VIEW_H * dpr)
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, VIEW_W, VIEW_H)
  drawFindPage(ctx, p, currentBox.value.box, drawOptions.value)

  // 点错的位置画一个红叉
  if (missIndex.value >= 0) {
    const L = findLayout(currentBox.value.box, p.size, showTitle.value)
    const c = missIndex.value % p.size
    const r = Math.floor(missIndex.value / p.size)
    const x = L.gx + (c + 0.5) * L.cell
    const y = L.gy + (r + 0.5) * L.cell
    ctx.strokeStyle = '#ef4444'
    ctx.lineWidth = Math.max(2, L.cell * 0.09)
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(x - L.cell * 0.22, y - L.cell * 0.22)
    ctx.lineTo(x + L.cell * 0.22, y + L.cell * 0.22)
    ctx.moveTo(x + L.cell * 0.22, y - L.cell * 0.22)
    ctx.lineTo(x - L.cell * 0.22, y + L.cell * 0.22)
    ctx.stroke()
  }
}

watch([puzzle, drawOptions, missIndex], () => paint(), { flush: 'post' })

/* ------------------------------ 导出 ------------------------------ */

async function guard(ext: string, fn: () => Promise<Blob>) {
  const p = puzzle.value
  if (!p) return
  exporting.value = ext
  errorMessage.value = ''
  try {
    downloadBlob(await fn(), `find-${p.size}x${p.size}-${p.seed}.${ext}`)
  } catch (e) {
    errorMessage.value = e instanceof Error ? e.message : '导出失败'
  } finally {
    exporting.value = ''
  }
}

function onPdf() {
  const p = puzzle.value
  if (!p) return
  void guard('pdf', () => exportFindPdf(p, drawOptions.value, paper.value))
}

function onPng() {
  const p = puzzle.value
  if (!p) return
  void guard('png', () => exportFindPng(p, drawOptions.value))
}

onMounted(build)
</script>

<template>
  <div class="puzzle-layout">
    <section class="puzzle-panel">
      <div class="puzzle-field">
        <span class="puzzle-label">标题</span>
        <input v-model="title" class="puzzle-input" type="text" maxlength="18" />
      </div>

      <div class="puzzle-field">
        <span class="puzzle-label">图库</span>
        <select v-model="setId" class="puzzle-select">
          <option v-for="s in PICTURE_SETS" :key="s.id" :value="s.id">{{ s.label }}</option>
        </select>
      </div>

      <div class="puzzle-field">
        <span class="puzzle-label">网格大小</span>
        <div class="puzzle-seg">
          <button
            v-for="s in FIND_SIZES"
            :key="s"
            :class="{ on: size === s }"
            @click="size = s"
          >
            {{ s }}×{{ s }}
          </button>
        </div>
      </div>

      <div class="puzzle-field">
        <span class="puzzle-label">每条连线长度</span>
        <div class="puzzle-seg">
          <button :class="{ on: runLength === 3 }" @click="runLength = 3">3 连</button>
          <button :class="{ on: runLength === 4 }" @click="runLength = 4">4 连</button>
          <button :class="{ on: runLength === 5 }" @click="runLength = 5">5 连</button>
        </div>
      </div>

      <div class="puzzle-field">
        <span class="puzzle-label">要找几条</span>
        <div class="puzzle-seg">
          <button :class="{ on: runCount === 2 }" @click="runCount = 2">2</button>
          <button :class="{ on: runCount === 3 }" @click="runCount = 3">3</button>
          <button :class="{ on: runCount === 4 }" @click="runCount = 4">4</button>
        </div>
      </div>

      <label class="puzzle-check">
        <input v-model="allowDiagonal" type="checkbox" />
        <span>允许斜向连线</span>
      </label>

      <label class="puzzle-check" style="margin-top: 8px">
        <input v-model="showTitle" type="checkbox" />
        <span>显示标题</span>
      </label>

      <label class="puzzle-check" style="margin-top: 8px">
        <input v-model="showSolution" type="checkbox" />
        <span>显示答案</span>
      </label>

      <div class="puzzle-field" style="margin-top: 14px">
        <span class="puzzle-label">纸张</span>
        <div class="puzzle-row">
          <select v-model="paper">
            <option v-for="p in PAPERS" :key="p.id" :value="p.id">{{ p.label }}</option>
          </select>
        </div>
      </div>

      <div class="puzzle-field">
        <span class="puzzle-label">种子</span>
        <div class="puzzle-row">
          <input v-model.number="seed" type="number" min="1" />
          <button class="puzzle-mini" title="换一个随机种子" @click="regenerate">🎲</button>
        </div>
        <p class="puzzle-note">相同设置 + 相同种子 = 同一张图</p>
      </div>
    </section>

    <section class="puzzle-stage">
      <div class="puzzle-box">
        <canvas
          ref="canvasRef"
          class="puzzle-canvas"
          :style="{ cursor: 'pointer', borderRadius: '16px' }"
          @pointerdown="onPick"
        />
      </div>

      <p class="puzzle-note" style="text-align: center; margin-top: 10px">
        点一下目标图形所在的任意一格，就能把整条连线找出来
      </p>

      <div class="puzzle-stats">
        <span>已找到 <b>{{ foundRuns.size }}</b> / {{ puzzle?.runs.length ?? 0 }} 条</span>
        <span>每条 <b>{{ puzzle?.runLength ?? 0 }}</b> 连</span>
        <span>网格 <b>{{ puzzle?.size ?? 0 }}×{{ puzzle?.size ?? 0 }}</b></span>
      </div>

      <p v-if="won" class="puzzle-win">全部找到啦 🎉</p>

      <div class="puzzle-actions">
        <button class="big-btn" @click="regenerate">换一张</button>
        <button class="puzzle-ghost" @click="foundRuns = new Set()">重新玩</button>
        <button class="puzzle-ghost" :disabled="exporting === 'pdf'" @click="onPdf">
          {{ exporting === 'pdf' ? '导出中…' : 'PDF（含答案）' }}
        </button>
        <button class="puzzle-ghost" :disabled="exporting === 'png'" @click="onPng">
          {{ exporting === 'png' ? '导出中…' : 'PNG' }}
        </button>
      </div>

      <p v-if="errorMessage" class="puzzle-error">{{ errorMessage }}</p>
      <p class="puzzle-note">PDF 第 1 页是题目，第 2 页是答案（高亮连线）。</p>
    </section>
  </div>
</template>