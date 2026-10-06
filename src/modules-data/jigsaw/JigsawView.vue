<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import { randomSeed, shuffle, mulberry32 } from '@/lib/puzzle/rng'
import { PAPERS, type PaperId } from '@/lib/puzzle/paper'
import { downloadBlob } from '@/lib/puzzle/download'
import { ARTS, PIECE_COUNTS, buildSpec, type JigsawSpec } from './lib/generate'
import { SHAPES, type ShapeId } from './lib/paths'
import {
  buildPieceSprites,
  drawGhostOutline,
  drawJigsawTemplate,
  gridMetrics,
  spriteBox,
  type JigsawDrawOptions
} from './lib/render'
import { exportJigsawPdf, exportJigsawPng, exportJigsawSvg } from './lib/export'

const accent = '#22b8a6'

/* ----------------------------- 可调参数 ----------------------------- */

const mode = ref<'play' | 'template'>('play')
const shape = ref<ShapeId>('heart')
const pieceIndex = ref(2)
const art = ref(ARTS[0].emoji)
const lineWidth = ref(0.09)
const showOutline = ref(true)
const withBlankPage = ref(true)
const paper = ref<PaperId>('A4')
const seed = ref(randomSeed())

const countOption = computed(() => PIECE_COUNTS[pieceIndex.value])

/* ------------------------------ 生成 ------------------------------ */

const spec = shallowRef<JigsawSpec | null>(null)
const sprites = shallowRef<HTMLCanvasElement[]>([])
const sprite = ref({ pad: 0, w: 0, h: 0 })

const drawOptions = computed<JigsawDrawOptions>(() => ({
  accent,
  ink: '#2b3a33',
  lineWidth: lineWidth.value,
  showArt: true,
  showOutline: showOutline.value
}))

const BOARD = 520

const metrics = computed(() =>
  spec.value ? gridMetrics(spec.value, BOARD) : { side: BOARD, cell: BOARD, offX: 0, offY: 0 }
)

function regenerate() {
  seed.value = randomSeed()
}

function rebuild() {
  const opt = countOption.value
  const s = buildSpec({
    rows: opt.rows,
    cols: opt.cols,
    shape: shape.value,
    art: art.value,
    seed: seed.value
  })
  spec.value = s
  sprites.value = buildPieceSprites(s, BOARD, drawOptions.value)
  sprite.value = spriteBox(s, BOARD)
  resetPlay()
}

watch([shape, pieceIndex, art, seed], () => rebuild())
watch(lineWidth, () => rebuild())
watch([spec, sprite], () => {
  paintPlay()
  paintTemplate()
})
watch(drawOptions, () => {
  paintPlay()
  paintTemplate()
})

/* ------------------------------ 玩法 ------------------------------ */

interface Placed {
  index: number
  x: number
  y: number
  placed: boolean
}

const pieces = ref<Placed[]>([])
const dragging = ref(-1)
const dragDX = ref(0)
const dragDY = ref(0)
const elapsed = ref(0)
const running = ref(false)
let timer: number | undefined

function targetOf(index: number) {
  const s = spec.value
  const m = metrics.value
  if (!s) return { x: 0, y: 0 }
  const p = s.pieces[index]
  return { x: m.offX + p.c * m.cell, y: m.offY + p.r * m.cell }
}

function resetPlay() {
  const s = spec.value
  if (!s) return
  const rng = mulberry32(seed.value + 13)
  const order = shuffle(
    s.pieces.map((p) => p.index),
    rng
  )
  const maxX = Math.max(4, BOARD - sprite.value.w)
  const maxY = Math.max(4, BOARD - sprite.value.h)
  pieces.value = order.map((index) => ({
    index,
    x: rng() * maxX,
    y: rng() * maxY,
    placed: false
  }))
  dragging.value = -1
  elapsed.value = 0
  stopTimer()
}

function startTimer() {
  if (running.value) return
  running.value = true
  timer = window.setInterval(() => {
    elapsed.value += 1000
  }, 1000)
}

function stopTimer() {
  running.value = false
  if (timer !== undefined) {
    window.clearInterval(timer)
    timer = undefined
  }
}

const placedCount = computed(() => pieces.value.filter((p) => p.placed).length)
const solved = computed(() => !!spec.value && placedCount.value === spec.value.pieces.length)

watch(solved, (v) => {
  if (v) stopTimer()
})

function boardPoint(e: PointerEvent) {
  const canvas = playCanvas.value
  if (!canvas) return { x: 0, y: 0 }
  const rect = canvas.getBoundingClientRect()
  const scale = BOARD / rect.width
  return { x: (e.clientX - rect.left) * scale, y: (e.clientY - rect.top) * scale }
}

function onDown(e: PointerEvent) {
  const { x, y } = boardPoint(e)
  const { pad, w, h } = sprite.value
  for (let i = pieces.value.length - 1; i >= 0; i--) {
    const p = pieces.value[i]
    if (p.placed) continue
    const left = p.x - pad
    const top = p.y - pad
    if (x >= left && x <= left + w && y >= top && y <= top + h) {
      dragging.value = i
      dragDX.value = x - p.x
      dragDY.value = y - p.y
      startTimer()
      try {
        ;(e.target as Element).setPointerCapture?.(e.pointerId)
      } catch {
        // 某些环境下拿不到 pointer capture，忽略即可
      }
      return
    }
  }
}

function onMove(e: PointerEvent) {
  if (dragging.value < 0) return
  const { x, y } = boardPoint(e)
  const maxX = Math.max(0, BOARD - sprite.value.w + sprite.value.pad * 2)
  const maxY = Math.max(0, BOARD - sprite.value.h + sprite.value.pad * 2)
  const p = pieces.value[dragging.value]
  p.x = Math.min(maxX, Math.max(0, x - dragDX.value))
  p.y = Math.min(maxY, Math.max(0, y - dragDY.value))
}

function onUp() {
  if (dragging.value < 0) return
  const p = pieces.value[dragging.value]
  const t = targetOf(p.index)
  const tol = metrics.value.cell * 0.34
  if (Math.abs(p.x - t.x) < tol && Math.abs(p.y - t.y) < tol) {
    p.x = t.x
    p.y = t.y
    p.placed = true
  }
  dragging.value = -1
}

/* ------------------------------ 绘制 ------------------------------ */

const playCanvas = ref<HTMLCanvasElement | null>(null)
const tplCanvas = ref<HTMLCanvasElement | null>(null)

function paintPlay() {
  const canvas = playCanvas.value
  const s = spec.value
  if (!canvas || !s) return
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  canvas.width = Math.round(BOARD * dpr)
  canvas.height = Math.round(BOARD * dpr)
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, BOARD, BOARD)
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, BOARD, BOARD)

  drawGhostOutline(ctx, s, 0, 0, BOARD, accent)

  const draw = (p: Placed) => {
    const img = sprites.value[p.index]
    if (!img) return
    ctx.drawImage(img, p.x - sprite.value.pad, p.y - sprite.value.pad, sprite.value.w, sprite.value.h)
  }
  pieces.value.filter((p) => p.placed).forEach(draw)
  pieces.value.filter((p) => !p.placed).forEach(draw)
}

function paintTemplate() {
  const canvas = tplCanvas.value
  const s = spec.value
  if (!canvas || !s) return
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  canvas.width = Math.round(BOARD * dpr)
  canvas.height = Math.round(BOARD * dpr)
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, BOARD, BOARD)
  drawJigsawTemplate(ctx, s, { x: 0, y: 0, w: BOARD, h: BOARD }, drawOptions.value)
}

watch(pieces, () => paintPlay(), { deep: true })

/* ------------------------------ 导出 ------------------------------ */

const exporting = ref('')
const errorMessage = ref('')

async function guard(ext: string, fn: () => Promise<Blob>) {
  const s = spec.value
  if (!s) return
  exporting.value = ext
  errorMessage.value = ''
  try {
    downloadBlob(await fn(), `jigsaw-${s.shape}-${s.pieces.length}-${s.seed}.${ext}`)
  } catch (e) {
    errorMessage.value = e instanceof Error ? e.message : '导出失败'
  } finally {
    exporting.value = ''
  }
}

function onPdf() {
  const s = spec.value
  if (!s) return
  void guard('pdf', () => exportJigsawPdf(s, drawOptions.value, paper.value, withBlankPage.value))
}

function onPng() {
  const s = spec.value
  if (!s) return
  void guard('png', () => exportJigsawPng(s, drawOptions.value))
}

function onSvg() {
  const s = spec.value
  if (!s) return
  try {
    downloadBlob(exportJigsawSvg(s, drawOptions.value), `jigsaw-${s.shape}-${s.pieces.length}-${s.seed}.svg`)
    errorMessage.value = ''
  } catch (e) {
    errorMessage.value = e instanceof Error ? e.message : '导出失败'
  }
}

const clock = computed(() => {
  const total = Math.floor(elapsed.value / 1000)
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`
})

onMounted(() => {
  rebuild()
  paintPlay()
  paintTemplate()
})

onBeforeUnmount(stopTimer)
</script>

<template>
  <div class="puzzle-layout">
    <section class="puzzle-panel">
      <div class="puzzle-field">
        <span class="puzzle-label">模式</span>
        <div class="puzzle-seg">
          <button :class="{ on: mode === 'play' }" @click="mode = 'play'">在线拼</button>
          <button :class="{ on: mode === 'template' }" @click="mode = 'template'">打印模板</button>
        </div>
      </div>

      <div class="puzzle-field">
        <span class="puzzle-label">图案</span>
        <div class="puzzle-swatches">
          <button
            v-for="a in ARTS"
            :key="a.emoji"
            class="puzzle-swatch"
            style="font-size: 20px; background: #f6faf8"
            :class="{ on: art === a.emoji }"
            :title="a.label"
            @click="art = a.emoji"
          >
            {{ a.emoji }}
          </button>
        </div>
      </div>

      <div class="puzzle-field">
        <span class="puzzle-label">外形</span>
        <div class="puzzle-seg">
          <button
            v-for="s in SHAPES"
            :key="s.id"
            :class="{ on: shape === s.id }"
            @click="shape = s.id"
          >
            {{ s.label }}
          </button>
        </div>
      </div>

      <div class="puzzle-field">
        <span class="puzzle-label">片数</span>
        <div class="puzzle-seg">
          <button
            v-for="(p, i) in PIECE_COUNTS"
            :key="p.label"
            :class="{ on: pieceIndex === i }"
            @click="pieceIndex = i"
          >
            {{ p.label }}
          </button>
        </div>
      </div>

      <div class="puzzle-field">
        <span class="puzzle-label">刀线粗细</span>
        <input v-model.number="lineWidth" class="puzzle-range" type="range" min="0.04" max="0.18" step="0.01" />
        <p class="puzzle-note">幼儿建议调粗一点，好剪</p>
      </div>

      <label class="puzzle-check">
        <input v-model="showOutline" type="checkbox" />
        <span>显示外形轮廓线</span>
      </label>

      <label class="puzzle-check" style="margin-top: 8px">
        <input v-model="withBlankPage" type="checkbox" />
        <span>PDF 附「涂色版」页</span>
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
        <p class="puzzle-note">种子决定碎片怎么打乱</p>
      </div>
    </section>

    <section class="puzzle-stage">
      <div class="puzzle-box">
        <canvas
          v-show="mode === 'play'"
          ref="playCanvas"
          class="puzzle-canvas"
          style="border-radius: 16px; touch-action: none; cursor: grab"
          @pointerdown="onDown"
          @pointermove="onMove"
          @pointerup="onUp"
          @pointercancel="onUp"
        />
        <canvas v-show="mode === 'template'" ref="tplCanvas" class="puzzle-canvas" style="border-radius: 16px" />
      </div>

      <p class="puzzle-note" style="text-align: center; margin-top: 10px">
        <template v-if="mode === 'play'">按住碎片拖到虚线框里，靠近就会自动吸住</template>
        <template v-else>这是打印用的刀路图：第 1 页带图，第 2 页只留线可以涂色</template>
      </p>

      <div class="puzzle-stats">
        <span>已拼好 <b>{{ placedCount }}</b> / {{ spec?.pieces.length ?? 0 }} 片</span>
        <span>用时 <b>{{ clock }}</b></span>
        <span>外形 <b>{{ SHAPES.find((s) => s.id === shape)?.label }}</b></span>
      </div>

      <p v-if="solved" class="puzzle-win">拼好啦 🎉 用时 {{ clock }}</p>

      <div class="puzzle-actions">
        <button class="big-btn" @click="regenerate">重新打乱</button>
        <button class="puzzle-ghost" :disabled="exporting === 'pdf'" @click="onPdf">
          {{ exporting === 'pdf' ? '导出中…' : 'PDF' }}
        </button>
        <button class="puzzle-ghost" :disabled="exporting === 'png'" @click="onPng">
          {{ exporting === 'png' ? '导出中…' : 'PNG' }}
        </button>
        <button class="puzzle-ghost" @click="onSvg">SVG 刀路</button>
      </div>

      <p v-if="errorMessage" class="puzzle-error">{{ errorMessage }}</p>
      <p class="puzzle-note">SVG 导出每块碎片一条闭合路径，可直接导入激光切割机。</p>
    </section>
  </div>
</template>