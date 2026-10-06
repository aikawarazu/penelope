<script setup lang="ts">
import { computed, onMounted, ref, shallowRef, watch } from 'vue'
import { PICTURE_SETS, getPictureSet } from '@/lib/puzzle/pictures'
import { randomSeed } from '@/lib/puzzle/rng'
import { PAPERS, type OrientationId, type PaperId } from '@/lib/puzzle/paper'
import { downloadBlob } from '@/lib/puzzle/download'
import { MAX_CARDS, cellsWithEmoji, drawCaller, generateDeck, normalizeSize } from './lib/generate'
import { exportBingoPdf, exportBingoPng } from './lib/export'
import { cardAspect, drawCard, hitCard } from './lib/render'
import { GRID_SIZES, type BingoDeck, type CardState, type CardStyle, type GridSize } from './lib/types'

/* ----------------------------- 可调参数 ----------------------------- */

const title = ref('找一找 · 宝宝')
const setId = ref(PICTURE_SETS[0].id)
const size = ref<GridSize>(4)
const freeSpace = ref(true)
const count = ref(6)
const paper = ref<PaperId>('A4')
const perPage = ref<1 | 4>(4)
const withCallerList = ref(true)
const showTitle = ref(true)
const seed = ref(randomSeed())

const accent = '#ff8f6b'

/* ------------------------------ 生成 ------------------------------ */

const deck = shallowRef<BingoDeck | null>(null)
const cardIndex = ref(0)
const marked = ref<Set<number>>(new Set())
const highlight = ref<string | null>(null)
const lastDrawn = ref<string | null>(null)
const exporting = ref('')
const errorMessage = ref('')

const cardStyle = computed<CardStyle>(() => ({
  title: title.value,
  showTitle: showTitle.value,
  accent,
  ink: '#2b3a33',
  muted: '#7a8a82'
}))

const card = computed(() => deck.value?.cards[cardIndex.value] ?? null)
const markTotal = computed(() =>
  card.value ? card.value.cells.filter((c) => c !== null).length : 0
)
const won = computed(() => markTotal.value > 0 && marked.value.size >= markTotal.value)
const drawnLabel = computed(() => {
  if (!highlight.value) return ''
  const set = getPictureSet(setId.value)
  return set.items.find((i) => i.emoji === highlight.value)?.label ?? ''
})

function resetMarks() {
  const c = card.value
  marked.value = new Set(c && c.freeIndex !== null ? [c.freeIndex] : [])
  highlight.value = null
}

function build() {
  const d = generateDeck({
    title: title.value,
    setId: setId.value,
    size: size.value,
    freeSpace: freeSpace.value,
    count: count.value,
    seed: seed.value
  })
  deck.value = d
  cardIndex.value = 0
  resetMarks()
  errorMessage.value = ''
}

function regenerate() {
  seed.value = randomSeed()
}

function onPickSize(v: number) {
  size.value = normalizeSize(v)
}

watch([title, setId, size, freeSpace, count, seed], () => build())
watch(cardIndex, () => resetMarks())

/* ------------------------------ 玩法 ------------------------------ */

function toggleMark(i: number) {
  if (!card.value || card.value.cells[i] === null) return
  const next = new Set(marked.value)
  if (next.has(i)) next.delete(i)
  else next.add(i)
  marked.value = next
}

function drawOne() {
  if (!deck.value) return
  const emoji = drawCaller(deck.value, lastDrawn.value, Math.random)
  if (!emoji) return
  lastDrawn.value = emoji
  highlight.value = emoji
}

/* ------------------------------ 预览 ------------------------------ */

const canvasRef = ref<HTMLCanvasElement | null>(null)
const PREVIEW_W = 520

const previewBox = computed(() => ({
  x: 0,
  y: 0,
  w: PREVIEW_W,
  h: PREVIEW_W * cardAspect(cardStyle.value.showTitle)
}))

function onPick(e: PointerEvent) {
  const c = card.value
  const canvas = canvasRef.value
  if (!c || !canvas) return
  const rect = canvas.getBoundingClientRect()
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const scale = canvas.width / rect.width / dpr
  const idx = hitCard(previewBox.value, c.size, cardStyle.value.showTitle, (e.clientX - rect.left) * scale, (e.clientY - rect.top) * scale)
  if (idx >= 0) toggleMark(idx)
}

const cardState = computed<CardState>(() => ({
  marked: marked.value,
  highlightEmoji: highlight.value
}))

function paint() {
  const canvas = canvasRef.value
  const c = card.value
  if (!canvas || !c) return
  const aspect = cardAspect(cardStyle.value.showTitle)
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const baseW = PREVIEW_W
  canvas.width = Math.round(baseW * dpr)
  canvas.height = Math.round(baseW * aspect * dpr)
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, baseW, baseW * aspect)
  // 复用导出用的绘制函数，预览与打印完全一致
  drawCard(ctx, c, { x: 0, y: 0, w: baseW, h: baseW * aspect }, cardStyle.value, cardState.value)
}

watch([deck, cardIndex, marked, highlight, cardStyle], () => paint(), { flush: 'post' })

/* ------------------------------ 导出 ------------------------------ */

async function guard(ext: string, fn: () => Promise<Blob>) {
  const d = deck.value
  if (!d) return
  exporting.value = ext
  errorMessage.value = ''
  try {
    downloadBlob(await fn(), `bingo-${d.size}x${d.size}-${d.seed}.${ext}`)
  } catch (e) {
    errorMessage.value = e instanceof Error ? e.message : '导出失败'
  } finally {
    exporting.value = ''
  }
}

function onPdf() {
  const d = deck.value
  if (!d) return
  void guard('pdf', () =>
    exportBingoPdf(d, cardStyle.value, {
      paper: paper.value,
      orientation: 'auto' as OrientationId,
      perPage: perPage.value,
      withCallerList: withCallerList.value
    })
  )
}

function onPng() {
  const c = card.value
  if (!c) return
  void guard('png', () => exportBingoPng(c, cardStyle.value, cardState.value))
}

onMounted(build)
</script>

<template>
  <div class="puzzle-layout">
    <section class="puzzle-panel">
      <div class="puzzle-field">
        <span class="puzzle-label">卡片标题</span>
        <input v-model="title" class="puzzle-input" type="text" maxlength="18" />
      </div>

      <div class="puzzle-field">
        <span class="puzzle-label">图库</span>
        <select v-model="setId" class="puzzle-select">
          <option v-for="s in PICTURE_SETS" :key="s.id" :value="s.id">{{ s.label }}（{{ s.items.length }}）</option>
        </select>
      </div>

      <div class="puzzle-field">
        <span class="puzzle-label">格子数</span>
        <div class="puzzle-seg">
          <button
            v-for="g in GRID_SIZES"
            :key="g"
            :class="{ on: size === g }"
            @click="onPickSize(g)"
          >
            {{ g }}×{{ g }}
          </button>
        </div>
        <p class="puzzle-note">3×3 最适合幼儿；5×5 是经典宾果。</p>
      </div>

      <label class="puzzle-check">
        <input v-model="freeSpace" type="checkbox" />
        <span>中心自由格</span>
      </label>

      <div class="puzzle-field" style="margin-top: 14px">
        <span class="puzzle-label">卡片张数（互不相同）</span>
        <div class="puzzle-row">
          <input v-model.number="count" type="number" min="1" :max="MAX_CARDS" />
          <span class="puzzle-note">/ {{ MAX_CARDS }}</span>
        </div>
      </div>

      <div class="puzzle-field">
        <span class="puzzle-label">打印</span>
        <div class="puzzle-row">
          <select v-model="paper">
            <option v-for="p in PAPERS" :key="p.id" :value="p.id">{{ p.label }}</option>
          </select>
        </div>
      </div>

      <div class="puzzle-field">
        <span class="puzzle-label">每页张数</span>
        <div class="puzzle-seg">
          <button :class="{ on: perPage === 1 }" @click="perPage = 1">1 张</button>
          <button :class="{ on: perPage === 4 }" @click="perPage = 4">4 张</button>
        </div>
      </div>

      <label class="puzzle-check">
        <input v-model="withCallerList" type="checkbox" />
        <span>附呼叫清单页</span>
      </label>

      <label class="puzzle-check" style="margin-top: 8px">
        <input v-model="showTitle" type="checkbox" />
        <span>卡片上显示标题</span>
      </label>

      <div class="puzzle-field" style="margin-top: 14px">
        <span class="puzzle-label">种子</span>
        <div class="puzzle-row">
          <input v-model.number="seed" type="number" min="1" />
          <button class="puzzle-mini" title="换一个随机种子" @click="regenerate">🎲</button>
        </div>
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

      <div class="puzzle-seg" style="justify-content: center; margin-top: 12px">
        <button :disabled="cardIndex === 0" @click="cardIndex--">← 上一张</button>
        <button disabled style="flex: 0 0 auto">
          第 {{ cardIndex + 1 }} / {{ deck?.cards.length ?? 0 }} 张
        </button>
        <button :disabled="!deck || cardIndex >= deck.cards.length - 1" @click="cardIndex++">下一张 →</button>
      </div>

      <p class="puzzle-note" style="text-align: center; margin-top: 10px">
        点格子标记找到的图形 · 已找到 {{ marked.size }} / {{ markTotal }}
      </p>

      <div class="puzzle-row" style="justify-content: center; margin-top: 10px">
        <button class="puzzle-ghost" @click="drawOne">抽一个图形</button>
        <button class="puzzle-ghost" @click="resetMarks">清空标记</button>
      </div>

      <div v-if="highlight" style="margin-top: 12px">
        <span style="font-size: 40px; vertical-align: middle">{{ highlight }}</span>
        <span style="margin-left: 8px; color: var(--muted)">找一找：{{ drawnLabel }}</span>
      </div>

      <p v-if="won" class="puzzle-win">全部找到啦 🎉</p>

      <div class="puzzle-stats">
        <span>图库 <b>{{ deck?.setLabel ?? '—' }}</b></span>
        <span>图形 <b>{{ deck?.caller.length ?? 0 }}</b> 种</span>
        <span>种子 <b>{{ seed }}</b></span>
      </div>

      <div class="puzzle-actions">
        <button class="big-btn" @click="regenerate">换一批</button>
        <button class="puzzle-ghost" :disabled="exporting === 'pdf'" @click="onPdf">
          {{ exporting === 'pdf' ? '导出中…' : 'PDF' }}
        </button>
        <button class="puzzle-ghost" :disabled="exporting === 'png'" @click="onPng">
          {{ exporting === 'png' ? '导出中…' : 'PNG' }}
        </button>
      </div>

      <p v-if="errorMessage" class="puzzle-error">{{ errorMessage }}</p>
      <p class="puzzle-note">PDF 每页 {{ perPage }} 张，末页为呼叫清单。</p>
    </section>
  </div>
</template>