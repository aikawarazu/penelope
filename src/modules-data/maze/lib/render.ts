import { solutionPoints, wallSegments } from './geometry'
import { withAlpha } from '@/lib/puzzle/canvas2d'
import { PALETTES, type Maze, type PaletteId } from './types'

export interface MazeStyle {
  /** 每格边长（px） */
  cell: number
  /** 画布留白（px） */
  margin: number
  /** 墙线宽（px） */
  wallWidth: number
  wallColor: string
  bgColor: string
  solutionColor: string
  solutionWidth: number
  startColor: string
  endColor: string
  /** 在线玩的小球配色 */
  ballColor: string
  /** true = 圆角接头；false = 直角 */
  round: boolean
  /** 是否画起终点圆点 */
  markers: boolean
  showSolution: boolean
}

export interface StyleInput {
  palette: PaletteId
  /** 墙线粗细档位 1~10 */
  stroke: number
  round: boolean
  markers: boolean
  showSolution: boolean
  cell: number
}

const MIN_STROKE = 1
const MAX_STROKE = 10

/** 档位 → 墙线宽占格边长的比例（0.06 ~ 0.35） */
export function strokeFraction(stroke: number): number {
  const s = Math.min(MAX_STROKE, Math.max(MIN_STROKE, stroke))
  return 0.06 + (s - 1) * 0.032
}

export function makeStyle(input: StyleInput): MazeStyle {
  const palette = PALETTES.find((p) => p.id === input.palette) ?? PALETTES[0]
  const cell = Math.max(2, input.cell)
  const wallWidth = Math.max(1, cell * strokeFraction(input.stroke))
  return {
    cell,
    margin: Math.max(wallWidth, cell * 0.5),
    wallWidth,
    wallColor: palette.wall,
    bgColor: palette.bg,
    solutionColor: palette.solution,
    solutionWidth: Math.max(1, cell * 0.22),
    startColor: palette.start,
    endColor: palette.end,
    ballColor: palette.ball,
    round: input.round,
    markers: input.markers,
    showSolution: input.showSolution
  }
}

export interface MazeLayout {
  width: number
  height: number
  cell: number
  margin: number
}

export function layoutFor(maze: Maze, style: MazeStyle): MazeLayout {
  return {
    width: Math.ceil(maze.cols * style.cell + style.margin * 2),
    height: Math.ceil(maze.rows * style.cell + style.margin * 2),
    cell: style.cell,
    margin: style.margin
  }
}

/** 把迷宫画进 2D 上下文（预览 / PNG / PDF 共用同一套几何） */
export function drawMaze(
  ctx: CanvasRenderingContext2D,
  maze: Maze,
  path: number[],
  style: MazeStyle
): void {
  const { width, height, margin, cell } = layoutFor(maze, style)

  ctx.save()
  ctx.fillStyle = style.bgColor
  ctx.fillRect(0, 0, width, height)
  ctx.translate(margin, margin)

  // 墙体：所有线段合成一条 path 一次性描边
  ctx.lineCap = style.round ? 'round' : 'square'
  ctx.lineJoin = style.round ? 'round' : 'miter'
  ctx.strokeStyle = style.wallColor
  ctx.lineWidth = style.wallWidth
  ctx.beginPath()
  for (const s of wallSegments(maze)) {
    ctx.moveTo(s.x1 * cell, s.y1 * cell)
    ctx.lineTo(s.x2 * cell, s.y2 * cell)
  }
  ctx.stroke()

  // 答案路径
  if (style.showSolution && path.length) {
    const pts = solutionPoints(maze, path)
    ctx.strokeStyle = style.solutionColor
    ctx.lineWidth = style.solutionWidth
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    for (let i = 0; i < pts.length; i++) {
      const x = pts[i].x * cell
      const y = pts[i].y * cell
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()
  }

  // 起终点标记
  if (style.markers) {
    const dot = (cx: number, cy: number, color: string) => {
      ctx.beginPath()
      ctx.arc(cx * cell, cy * cell, cell * 0.26, 0, Math.PI * 2)
      ctx.fillStyle = color
      ctx.fill()
    }
    dot(maze.start.c + 0.5, maze.start.r + 0.5, style.startColor)
    dot(maze.end.c + 0.5, maze.end.r + 0.5, style.endColor)
  }

  ctx.restore()
}

export interface MazePlayState {
  /** 小球当前所在格子下标 */
  cell: number
  /** 已经走过的格子 */
  trail: Set<number>
  solution: number[]
  /** 是否把答案路径淡淡地画出来（提示） */
  showHint: boolean
}

/** 在线玩：在迷宫上画出走过的痕迹和那颗小球 */
export function drawMazePlay(
  ctx: CanvasRenderingContext2D,
  maze: Maze,
  style: MazeStyle,
  state: MazePlayState
): void {
  drawMaze(ctx, maze, state.solution, { ...style, showSolution: state.showHint })

  const { margin, cell } = layoutFor(maze, style)
  ctx.save()
  ctx.translate(margin, margin)

  // 走过的痕迹
  if (state.trail.size) {
    ctx.fillStyle = withAlpha(style.ballColor, 0.22)
    for (const idx of state.trail) {
      const c = idx % maze.cols
      const r = (idx / maze.cols) | 0
      ctx.fillRect(c * cell + cell * 0.2, r * cell + cell * 0.2, cell * 0.6, cell * 0.6)
    }
  }

  // 小球
  const px = ((state.cell % maze.cols) + 0.5) * cell
  const py = (((state.cell / maze.cols) | 0) + 0.5) * cell
  const rad = cell * 0.32
  ctx.beginPath()
  ctx.arc(px, py, rad, 0, Math.PI * 2)
  ctx.fillStyle = style.ballColor
  ctx.fill()
  ctx.lineWidth = Math.max(1.5, cell * 0.06)
  ctx.strokeStyle = '#ffffff'
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(px - rad * 0.3, py - rad * 0.32, rad * 0.28, 0, Math.PI * 2)
  ctx.fillStyle = withAlpha('#ffffff', 0.75)
  ctx.fill()

  ctx.restore()
}

/** 画布逻辑坐标 → 格子下标，-1 表示点在网格外 */
export function hitCell(maze: Maze, style: MazeStyle, x: number, y: number): number {
  const { margin, cell } = layoutFor(maze, style)
  const c = Math.floor((x - margin) / cell)
  const r = Math.floor((y - margin) / cell)
  if (c < 0 || c >= maze.cols || r < 0 || r >= maze.rows) return -1
  return r * maze.cols + c
}
