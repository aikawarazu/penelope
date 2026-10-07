import { DIRS, type Maze } from './types'

/**
 * BFS 求最短通路的格子序列（含起点与终点）。
 * 迷宫必然连通，理论上不会返回空数组；保险起见不可达时返回 []。
 */
export function solveMaze(maze: Maze): number[] {
  const { cols, rows, walls, start, end } = maze
  const total = cols * rows
  if (!total) return []

  const prev = new Int32Array(total).fill(-1)
  const seen = new Uint8Array(total)
  const queue = new Int32Array(total)
  let head = 0
  let tail = 0

  const s = start.r * cols + start.c
  const g = end.r * cols + end.c
  seen[s] = 1
  queue[tail++] = s

  while (head < tail) {
    const cur = queue[head++]
    if (cur === g) break
    const r = (cur / cols) | 0
    const c = cur % cols
    for (let di = 0; di < 4; di++) {
      const d = DIRS[di]
      if (walls[cur] & d.bit) continue
      const nr = r + d.dr
      const nc = c + d.dc
      if (nr < 0 || nc < 0 || nr >= rows || nc >= cols) continue
      const ni = nr * cols + nc
      if (seen[ni]) continue
      seen[ni] = 1
      prev[ni] = cur
      queue[tail++] = ni
    }
  }

  if (!seen[g]) return []
  const path: number[] = []
  for (let cur = g; cur !== -1; cur = prev[cur]) path.push(cur)
  return path.reverse()
}

/** 死角数量：只有一个通路出口的格子 */
export function countDeadEnds(maze: Maze): number {
  let n = 0
  for (let i = 0; i < maze.walls.length; i++) {
    let open = 0
    for (let di = 0; di < 4; di++) {
      if (!(maze.walls[i] & DIRS[di].bit)) open++
    }
    if (open === 1) n++
  }
  return n
}
