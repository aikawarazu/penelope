import { DIRS, E, N, S, W, type Cell, type Maze } from './types'

export interface Point {
  x: number
  y: number
}

export interface Segment {
  x1: number
  y1: number
  x2: number
  y2: number
}

/** 开口优先顺序：先上、再下、再右、最后左 */
const OPENING_PREFERENCE = [0, 2, 1, 3]

/**
 * 该格子位于迷宫边界时，返回用于"开口"的方向索引（DIRS 下标），否则 null。
 * 用于起点入口 / 终点出口。
 */
export function openingDir(maze: Maze, cell: Cell): number | null {
  for (const di of OPENING_PREFERENCE) {
    const d = DIRS[di]
    const nr = cell.r + d.dr
    const nc = cell.c + d.dc
    if (nr < 0 || nc < 0 || nr >= maze.rows || nr >= maze.cols) return di
  }
  return null
}

function skipKey(dirIndex: number, r: number, c: number): string {
  return `${dirIndex}:${r}:${c}`
}

/**
 * 抽出所有需要绘制的墙线段（单位为"格"）。
 * 每格只取 N 与 W，最后一行补 S、最后一列补 E，天然去重不重画。
 * 起点/终点的外墙会被跳过，形成入口与出口。
 */
export function wallSegments(maze: Maze): Segment[] {
  const { cols, rows, walls } = maze
  const skip = new Set<string>()

  const sdi = openingDir(maze, maze.start)
  if (sdi !== null) skip.add(skipKey(sdi, maze.start.r, maze.start.c))
  const edi = openingDir(maze, maze.end)
  if (edi !== null) skip.add(skipKey(edi, maze.end.r, maze.end.c))

  const segs: Segment[] = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const w = walls[r * cols + c]
      if (w & N && !skip.has(skipKey(0, r, c))) segs.push({ x1: c, y1: r, x2: c + 1, y2: r })
      if (w & W && !skip.has(skipKey(3, r, c))) segs.push({ x1: c, y1: r, x2: c, y2: r + 1 })
      if (r === rows - 1 && w & S && !skip.has(skipKey(2, r, c))) {
        segs.push({ x1: c, y1: rows, x2: c + 1, y2: rows })
      }
      if (c === cols - 1 && w & E && !skip.has(skipKey(1, r, c))) {
        segs.push({ x1: cols, y1: r, x2: cols, y2: r + 1 })
      }
    }
  }
  return segs
}

/** 解法折线：经过每个通路格中心，并从入口/出口向外延伸半格 */
export function solutionPoints(maze: Maze, path: number[]): Point[] {
  const pts: Point[] = []
  if (!path.length) return pts

  const center = (idx: number): Point => ({
    x: (idx % maze.cols) + 0.5,
    y: ((idx / maze.cols) | 0) + 0.5
  })

  const sdi = openingDir(maze, maze.start)
  if (sdi !== null) {
    const d = DIRS[sdi]
    const p = center(path[0])
    pts.push({ x: p.x + d.dc * 0.5, y: p.y + d.dr * 0.5 })
  }
  for (const idx of path) pts.push(center(idx))

  const edi = openingDir(maze, maze.end)
  if (edi !== null) {
    const d = DIRS[edi]
    const p = center(path[path.length - 1])
    pts.push({ x: p.x + d.dc * 0.5, y: p.y + d.dr * 0.5 })
  }

  return pts
}
