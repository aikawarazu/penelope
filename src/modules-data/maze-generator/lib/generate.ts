import { mulberry32, randInt, shuffle } from './rng'
import {
  DIRS,
  clampSize,
  type AlgorithmId,
  type Cell,
  type Maze,
  type PlacementId
} from './types'

export interface MazeOptions {
  cols: number
  rows: number
  algorithm: AlgorithmId
  /** 0~1，去除死角的比例（越高越"通畅"，越低越"绕"） */
  braid: number
  placement: PlacementId
  seed: number
}

export interface MazeResult {
  maze: Maze
  elapsedMs: number
}

function popcount(v: number): number {
  let n = 0
  while (v) {
    v &= v - 1
    n++
  }
  return n
}

function now(): number {
  return typeof performance !== 'undefined' && typeof performance.now === 'function'
    ? performance.now()
    : Date.now()
}

/* --------------------------- 三种生成算法 --------------------------- */

/** 递归回溯（DFS）：生成最长最曲折的走廊 */
function recursiveBacktracker(walls: Uint8Array, cols: number, rows: number, rng: () => number): void {
  const total = cols * rows
  const visited = new Uint8Array(total)
  const stack: number[] = []

  let cur = randInt(rng, total)
  visited[cur] = 1
  stack.push(cur)

  const candIdx: number[] = []
  const candDir: number[] = []

  while (stack.length) {
    cur = stack[stack.length - 1]
    const r = (cur / cols) | 0
    const c = cur % cols

    candIdx.length = 0
    candDir.length = 0
    for (let di = 0; di < 4; di++) {
      const d = DIRS[di]
      const nr = r + d.dr
      const nc = c + d.dc
      if (nr < 0 || nc < 0 || nr >= rows || nc >= cols) continue
      const ni = nr * cols + nc
      if (visited[ni]) continue
      candIdx.push(ni)
      candDir.push(di)
    }

    if (!candIdx.length) {
      stack.pop()
      continue
    }

    const k = randInt(rng, candIdx.length)
    const ni = candIdx[k]
    const d = DIRS[candDir[k]]
    walls[cur] &= ~d.bit
    walls[ni] &= ~d.opp
    visited[ni] = 1
    stack.push(ni)
  }
}

/** 随机化 Prim：从"前沿"随机挑格子，产生大量短死角 */
function randomizedPrim(walls: Uint8Array, cols: number, rows: number, rng: () => number): void {
  const total = cols * rows
  const inMaze = new Uint8Array(total)
  // frontier 以 [cellIdx, fromIdx] 成对存放
  const frontier: number[] = []

  const pushFrontier = (idx: number) => {
    const r = (idx / cols) | 0
    const c = idx % cols
    for (let di = 0; di < 4; di++) {
      const d = DIRS[di]
      const nr = r + d.dr
      const nc = c + d.dc
      if (nr < 0 || nc < 0 || nr >= rows || nc >= cols) continue
      const ni = nr * cols + nc
      if (inMaze[ni]) continue
      frontier.push(ni, idx)
    }
  }

  const start = randInt(rng, total)
  inMaze[start] = 1
  pushFrontier(start)

  while (frontier.length) {
    const pairCount = frontier.length >> 1
    const k = randInt(rng, pairCount) << 1
    const cell = frontier[k]
    const from = frontier[k + 1]

    // 与末尾一对交换后弹出，O(1) 移除
    const last = frontier.length - 2
    frontier[k] = frontier[last]
    frontier[k + 1] = frontier[last + 1]
    frontier.length = last

    if (inMaze[cell]) continue

    const fr = (from / cols) | 0
    const fc = from % cols
    for (let di = 0; di < 4; di++) {
      const d = DIRS[di]
      if (fr + d.dr === ((cell / cols) | 0) && fc + d.dc === cell % cols) {
        walls[from] &= ~d.bit
        walls[cell] &= ~d.opp
        break
      }
    }

    inMaze[cell] = 1
    pushFrontier(cell)
  }
}

/** 随机化 Kruskal：并查集 + 打乱边集，分支分布最均匀 */
function randomizedKruskal(walls: Uint8Array, cols: number, rows: number, rng: () => number): void {
  const total = cols * rows
  const parent = new Int32Array(total)
  for (let i = 0; i < total; i++) parent[i] = i

  const find = (x: number): number => {
    while (parent[x] !== x) {
      parent[x] = parent[parent[x]]
      x = parent[x]
    }
    return x
  }

  // 只收集内墙：每个格子的 S 与 E 方向
  const edges: number[] = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const idx = r * cols + c
      if (r + 1 < rows) edges.push(idx, idx + cols, 2)
      if (c + 1 < cols) edges.push(idx, idx + 1, 1)
    }
  }

  const m = edges.length / 3
  const order = new Int32Array(m)
  for (let i = 0; i < m; i++) order[i] = i
  for (let i = m - 1; i > 0; i--) {
    const j = randInt(rng, i + 1)
    const t = order[i]
    order[i] = order[j]
    order[j] = t
  }

  for (let i = 0; i < m; i++) {
    const o = order[i] * 3
    const a = edges[o]
    const b = edges[o + 1]
    const d = DIRS[edges[o + 2]]
    const ra = find(a)
    const rb = find(b)
    if (ra === rb) continue
    parent[ra] = rb
    walls[a] &= ~d.bit
    walls[b] &= ~d.opp
  }
}

/* ------------------------------ 编织 ------------------------------ */

/**
 * 按 amount 比例打通死角，让迷宫从"纯树结构"变成"带环路"。
 * 只打通内墙，外墙（边界）永远保留。
 */
export function braidMaze(
  walls: Uint8Array,
  cols: number,
  rows: number,
  amount: number,
  rng: () => number
): number {
  if (amount <= 0) return 0

  const dead: number[] = []
  for (let i = 0; i < walls.length; i++) {
    if (popcount(walls[i]) === 3) dead.push(i)
  }
  if (!dead.length) return 0

  shuffle(dead, rng)
  const target = Math.floor(dead.length * amount)
  let removed = 0

  for (let k = 0; k < dead.length && removed < target; k++) {
    const idx = dead[k]
    if (popcount(walls[idx]) !== 3) continue
    const r = (idx / cols) | 0
    const c = idx % cols

    const options: number[] = []
    for (let di = 0; di < 4; di++) {
      const d = DIRS[di]
      if (!(walls[idx] & d.bit)) continue
      const nr = r + d.dr
      const nc = c + d.dc
      if (nr < 0 || nc < 0 || nr >= rows || nc >= cols) continue
      options.push(di)
    }
    if (!options.length) continue

    const d = DIRS[options[randInt(rng, options.length)]]
    const ni = (r + d.dr) * cols + (c + d.dc)
    walls[idx] &= ~d.bit
    walls[ni] &= ~d.opp
    removed++
  }

  return removed
}

/* ---------------------------- 起终点布位 ---------------------------- */

function borderIndices(cols: number, rows: number): number[] {
  const out: number[] = []
  for (let c = 0; c < cols; c++) {
    out.push(c)
    out.push((rows - 1) * cols + c)
  }
  for (let r = 1; r < rows - 1; r++) {
    out.push(r * cols)
    out.push(r * cols + cols - 1)
  }
  return out
}

function pickStart(placement: PlacementId, cols: number, rows: number, rng: () => number): Cell {
  if (placement === 'edges') {
    const border = borderIndices(cols, rows)
    const idx = border[randInt(rng, border.length)]
    return { r: (idx / cols) | 0, c: idx % cols }
  }
  if (placement === 'random') {
    return { r: randInt(rng, rows), c: randInt(rng, cols) }
  }
  // corners / center：统一从左上角出发
  return { r: 0, c: 0 }
}

/** 从 from 出发的 BFS 距离场，-1 表示不可达 */
function distanceField(walls: Uint8Array, cols: number, rows: number, from: number): Int32Array {
  const dist = new Int32Array(cols * rows).fill(-1)
  const queue = new Int32Array(cols * rows)
  let head = 0
  let tail = 0
  dist[from] = 0
  queue[tail++] = from

  while (head < tail) {
    const cur = queue[head++]
    const r = (cur / cols) | 0
    const c = cur % cols
    for (let di = 0; di < 4; di++) {
      const d = DIRS[di]
      if (walls[cur] & d.bit) continue
      const nr = r + d.dr
      const nc = c + d.dc
      if (nr < 0 || nc < 0 || nr >= rows || nc >= cols) continue
      const ni = nr * cols + nc
      if (dist[ni] >= 0) continue
      dist[ni] = dist[cur] + 1
      queue[tail++] = ni
    }
  }
  return dist
}

function pickEnd(
  placement: PlacementId,
  cols: number,
  rows: number,
  startIdx: number,
  walls: Uint8Array
): Cell {
  if (placement === 'corners') return { r: rows - 1, c: cols - 1 }
  if (placement === 'center') return { r: rows >> 1, c: cols >> 1 }

  const dist = distanceField(walls, cols, rows, startIdx)
  const candidates = placement === 'edges' ? borderIndices(cols, rows) : null

  let best = startIdx
  let bestDist = -1
  if (candidates) {
    for (const idx of candidates) {
      if (dist[idx] > bestDist) {
        bestDist = dist[idx]
        best = idx
      }
    }
  } else {
    for (let i = 0; i < dist.length; i++) {
      if (dist[i] > bestDist) {
        bestDist = dist[i]
        best = i
      }
    }
  }
  return { r: (best / cols) | 0, c: best % cols }
}

/* ------------------------------ 入口 ------------------------------ */

export function generateMaze(options: MazeOptions): MazeResult {
  const t0 = now()
  const cols = clampSize(options.cols)
  const rows = clampSize(options.rows)
  const rng = mulberry32(options.seed || 1)

  const walls = new Uint8Array(cols * rows)
  walls.fill(15)

  switch (options.algorithm) {
    case 'prim':
      randomizedPrim(walls, cols, rows, rng)
      break
    case 'kruskal':
      randomizedKruskal(walls, cols, rows, rng)
      break
    default:
      recursiveBacktracker(walls, cols, rows, rng)
      break
  }

  braidMaze(walls, cols, rows, options.braid, rng)

  const start = pickStart(options.placement, cols, rows, rng)
  const startIdx = start.r * cols + start.c
  const end = pickEnd(options.placement, cols, rows, startIdx, walls)

  return {
    maze: { cols, rows, walls, start, end },
    elapsedMs: now() - t0
  }
}
