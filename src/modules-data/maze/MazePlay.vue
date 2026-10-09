<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { drawMazePlay, hitCell, layoutFor, type MazeStyle } from './lib/render'
import { E, N, S, W, type Maze } from './lib/types'

const props = defineProps<{
  maze: Maze | null
  solution: number[]
  style: MazeStyle
}>()

/* ------------------------------ 状态 ------------------------------ */

const player = ref(0)
const trail = ref<Set<number>>(new Set())
const steps = ref(0)
const won = ref(false)
const showHint = ref(false)
const bumped = ref(false)

const goalIndex = computed(() => {
  const m = props.maze
  return m ? m.end.r * m.cols + m.end.c : -1
})

function reset() {
  const m = props.maze
  if (!m) return
  player.value = m.start.r * m.cols + m.start.c
  trail.value = new Set([player.value])
  steps.value = 0
  won.value = false
  showHint.value = false
}

watch(() => props.maze, reset, { immediate: true })

/* ------------------------------ 移动 ------------------------------ */

function canMove(from: number, dr: number, dc: number): number {
  const m = props.maze
  if (!m) return -1
  const r = (from / m.cols) | 0
  const c = from % m.cols
  const nr = r + dr
  const nc = c + dc
  if (nr < 0 || nc < 0 || nr >= m.rows || nc >= m.cols) return -1
  const bit = dr === -1 ? N : dr === 1 ? S : dc === -1 ? W : E
  if (m.walls[from] & bit) return -1
  return nr * m.cols + nc
}

function move(dr: number, dc: number) {
  const m = props.maze
  if (!m || won.value) return
  const next = canMove(player.value, dr, dc)
  if (next < 0) {
    bumped.value = true
    window.setTimeout(() => (bumped.value = false), 220)
    return
  }
  const set = new Set(trail.value)
  set.add(next)
  trail.value = set
  player.value = next
  steps.value += 1
  showHint.value = false
  if (next === goalIndex.value) won.value = true
}

/** 点相邻格子也能走一步（触屏更友好） */
function stepTowards(target: number) {
  const m = props.maze
  if (!m || won.value || target < 0) return
  const r = (player.value / m.cols) | 0
  const c = player.value % m.cols
  const tr = (target / m.cols) | 0
  const tc = target % m.cols
  const dr = Math.sign(tr - r)
  const dc = Math.sign(tc - c)
  if (Math.abs(tr - r) + Math.abs(tc - c) !== 1) return
  move(dr, dc)
}

function onKey(e: KeyboardEvent) {
  const map: Record<string, [number, number]> = {
    ArrowUp: [-1, 0],
    ArrowDown: [1, 0],
    ArrowLeft: [0, -1],
    ArrowRight: [0, 1],
    w: [-1, 0],
    s: [1, 0],
    a: [0, -1],
    d: [0, 1]
  }
  const delta = map[e.key]
  if (!delta) return
  e.preventDefault()
  move(delta[0], delta[1])
}

onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))

/* ------------------------------ 画布 ------------------------------ */

const canvasRef = ref<HTMLCanvasElement | null>(null)
const dpr = () => Math.min(window.devicePixelRatio || 1, 2)

function logicalSize() {
  const m = props.maze
  if (!m) return { width: 1, height: 1 }
  return layoutFor(m, props.style)
}

function paint() {
  const canvas = canvasRef.value
  const m = props.maze
  if (!canvas || !m) return
  const layout = logicalSize()
  const d = dpr()
  canvas.width = Math.round(layout.width * d)
  canvas.height = Math.round(layout.height * d)
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.setTransform(d, 0, 0, d, 0, 0)
  drawMazePlay(ctx, m, props.style, {
    cell: player.value,
    trail: trail.value,
    solution: props.solution,
    showHint: showHint.value
  })
}

watch(
  () => [props.maze, props.style, player.value, trail.value, props.solution, showHint.value],
  () => paint(),
  { flush: 'post' }
)

/* --------------------------- 触屏：滑动与点按 --------------------------- */

let anchor: { x: number; y: number } | null = null
let moved = false

function toLogical(e: PointerEvent) {
  const canvas = canvasRef.value
  if (!canvas) return { x: 0, y: 0 }
  const rect = canvas.getBoundingClientRect()
  const layout = logicalSize()
  return {
    x: ((e.clientX - rect.left) / rect.width) * layout.width,
    y: ((e.clientY - rect.top) / rect.height) * layout.height
  }
}

function onDown(e: PointerEvent) {
  anchor = { x: e.clientX, y: e.clientY }
  moved = false
}

function onMove(e: PointerEvent) {
  if (!anchor) return
  const dx = e.clientX - anchor.x
  const dy = e.clientY - anchor.y
  const TH = 22
  if (Math.abs(dx) < TH && Math.abs(dy) < TH) return
  moved = true
  if (Math.abs(dx) > Math.abs(dy)) move(0, dx > 0 ? 1 : -1)
  else move(dy > 0 ? 1 : -1, 0)
  anchor = { x: e.clientX, y: e.clientY }
}

function onUp(e: PointerEvent) {
  if (anchor && !moved) {
    const p = toLogical(e)
    const m = props.maze
    if (m) stepTowards(hitCell(m, props.style, p.x, p.y))
  }
  anchor = null
}
</script>

<template>
  <div class="play">
    <div class="canvas-box" :class="{ bumped }">
      <canvas
        ref="canvasRef"
        class="board"
        @pointerdown="onDown"
        @pointermove="onMove"
        @pointerup="onUp"
        @pointercancel="onUp"
      />
    </div>

    <p v-if="won" class="win">走到终点啦！一共 {{ steps }} 步 🎉</p>
    <p v-else class="tip">用方向键、下面按钮，或者直接在图上滑动 / 点旁边的格子</p>

    <div class="pad">
      <span />
      <button aria-label="向上" @click="move(-1, 0)">↑</button>
      <span />
      <button aria-label="向左" @click="move(0, -1)">←</button>
      <button class="down" aria-label="向下" @click="move(1, 0)">↓</button>
      <button aria-label="向右" @click="move(0, 1)">→</button>
    </div>

    <div class="stats">
      <span>已走 <b>{{ steps }}</b> 步</span>
      <span>最短 <b>{{ Math.max(0, solution.length - 1) }}</b> 步</span>
      <span>走过 <b>{{ trail.size }}</b> 格</span>
    </div>

    <div class="actions">
      <button class="big-btn" @click="reset">再走一次</button>
      <button class="ghost" @click="showHint = !showHint">
        {{ showHint ? '收起提示' : '看提示' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.play {
  text-align: center;
}

.canvas-box {
  position: relative;
  transition: transform 0.12s ease;
}

.canvas-box.bumped {
  transform: translateX(-3px);
}

.board {
  width: 100%;
  height: auto;
  display: block;
  border-radius: 16px;
  background: #fff;
  touch-action: none;
  cursor: pointer;
}

.win {
  margin: 12px 0 0;
  font-size: 16px;
  font-weight: 700;
  color: var(--accent);
}

.tip {
  margin: 10px 0 0;
  font-size: 12px;
  color: var(--muted);
}

.pad {
  display: grid;
  grid-template-columns: repeat(3, 58px);
  justify-content: center;
  gap: 8px;
  margin-top: 12px;
}

.pad button {
  height: 54px;
  border-radius: 16px;
  background: color-mix(in srgb, var(--accent) 14%, #fff);
  color: var(--accent);
  font-size: 22px;
  border: 2px solid color-mix(in srgb, var(--accent) 34%, transparent);
}

.pad button:active {
  transform: scale(0.94);
}

.stats {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 6px 14px;
  font-size: 12px;
  color: var(--muted);
  margin: 12px 0;
}

.stats b {
  color: var(--ink);
  font-size: 13px;
}

.actions {
  display: flex;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
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
</style>
