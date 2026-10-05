<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'

/** 迷宫布局：S 起点，G 终点，# 墙，. 通路（改布局即可换关卡） */
const layout = ['S.#...', '..#.#.', '#...#.', '###.#.', '......', '.####G']

const rows = layout.length
const cols = layout[0].length
const CELL = 54
const PAD = 8

function find(ch: string) {
  for (let r = 0; r < rows; r++) {
    const c = layout[r].indexOf(ch)
    if (c >= 0) return { r, c }
  }
  return { r: 0, c: 0 }
}

const start = find('S')
const goal = find('G')

const player = ref({ ...start })
const moves = ref(0)
const won = ref(false)

function isWall(r: number, c: number) {
  if (r < 0 || c < 0 || r >= rows || c >= cols) return true
  return layout[r][c] === '#'
}

function move(dr: number, dc: number) {
  if (won.value) return
  const nr = player.value.r + dr
  const nc = player.value.c + dc
  if (isWall(nr, nc)) return
  player.value = { r: nr, c: nc }
  moves.value += 1
  if (nr === goal.r && nc === goal.c) won.value = true
}

function reset() {
  player.value = { ...start }
  moves.value = 0
  won.value = false
}

function onKey(e: KeyboardEvent) {
  const map: Record<string, [number, number]> = {
    ArrowUp: [-1, 0],
    ArrowDown: [1, 0],
    ArrowLeft: [0, -1],
    ArrowRight: [0, 1]
  }
  const delta = map[e.key]
  if (delta) {
    e.preventDefault()
    move(delta[0], delta[1])
  }
}

onMounted(() => window.addEventListener('keydown', onKey))
onUnmounted(() => window.removeEventListener('keydown', onKey))

const cells = computed(() =>
  layout.map((row) => row.split('').map((ch) => (ch === '#' ? 'wall' : 'open')))
)

const size = computed(() => ({
  w: cols * CELL + PAD * 2,
  h: rows * CELL + PAD * 2
}))
</script>

<template>
  <div class="maze-wrap">
    <svg :viewBox="`0 0 ${size.w} ${size.h}`" class="maze">
      <g :transform="`translate(${PAD},${PAD})`">
        <template v-for="(row, r) in cells" :key="r">
          <rect
            v-for="(kind, c) in row"
            :key="`${r}-${c}`"
            :x="c * CELL"
            :y="r * CELL"
            :width="CELL"
            :height="CELL"
            :fill="kind === 'wall' ? '#dbe9e2' : '#ffffff'"
            :stroke="kind === 'wall' ? '#cfe0d7' : '#eef4f1'"
            stroke-width="1"
            rx="8"
          />
        </template>

        <circle
          :cx="goal.c * CELL + CELL / 2"
          :cy="goal.r * CELL + CELL / 2"
          :r="CELL * 0.3"
          fill="#ffd166"
        />
        <circle
          class="ball"
          :cx="player.c * CELL + CELL / 2"
          :cy="player.r * CELL + CELL / 2"
          :r="CELL * 0.28"
          fill="var(--accent)"
        />
      </g>
    </svg>

    <p v-if="won" class="win">到终点啦！用了 {{ moves }} 步 🎉</p>
    <p v-else class="hint">已走 {{ moves }} 步 · 用方向键或下面的按钮</p>

    <div class="pad">
      <span />
      <button @click="move(-1, 0)">↑</button>
      <span />
      <button @click="move(0, -1)">←</button>
      <button @click="move(1, 0)">↓</button>
      <button @click="move(0, 1)">→</button>
    </div>

    <button class="big-btn reset" @click="reset">重新开始</button>
  </div>
</template>

<style scoped>
.maze-wrap {
  background: #fff;
  border-radius: 22px;
  padding: 18px;
  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.06);
  text-align: center;
}

.maze {
  width: 100%;
  max-width: 420px;
  height: auto;
}

.ball {
  transition: cx 0.12s ease, cy 0.12s ease;
}

.hint,
.win {
  font-size: 14px;
  color: var(--muted);
  margin: 12px 0;
}

.win {
  color: var(--accent);
  font-weight: 700;
}

.pad {
  display: grid;
  grid-template-columns: repeat(3, 56px);
  justify-content: center;
  gap: 8px;
}

.pad button {
  height: 56px;
  border-radius: 16px;
  background: color-mix(in srgb, var(--accent) 15%, #fff);
  color: var(--accent);
  font-size: 22px;
  border: 2px solid color-mix(in srgb, var(--accent) 35%, transparent);
}

.reset {
  margin-top: 16px;
}
</style>
