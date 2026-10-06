import { solutionPoints, wallSegments } from './geometry'
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
