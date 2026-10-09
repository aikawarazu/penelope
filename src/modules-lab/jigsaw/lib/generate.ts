import { mulberry32, shuffle } from '@/lib/puzzle/rng'
import { outlinePath, piecePath, shapeCoversCorner, type ShapeId } from './paths'
import { artById, type ArtKind } from './pictures'

export interface JigsawPiece {
  index: number
  r: number
  c: number
  /** 碎片中心在归一化拼图坐标里的位置 */
  cx: number
  cy: number
  path: string
}

export interface JigsawSpec {
  rows: number
  cols: number
  shape: ShapeId
  /** 图案内容：drawn 时是绘制类型，emoji 时是字符 */
  art: string
  artKind: ArtKind
  artLabel: string
  pieces: JigsawPiece[]
  outline: string
  seed: number
}

export interface PieceCountOption {
  label: string
  rows: number
  cols: number
}

export const PIECE_COUNTS: readonly PieceCountOption[] = [
  { label: '4 片', rows: 2, cols: 2 },
  { label: '6 片', rows: 2, cols: 3 },
  { label: '9 片', rows: 3, cols: 3 },
  { label: '12 片', rows: 3, cols: 4 },
  { label: '16 片', rows: 4, cols: 4 },
  { label: '20 片', rows: 4, cols: 5 },
  { label: '25 片', rows: 5, cols: 5 }
]

export interface JigsawOptions {
  rows: number
  cols: number
  shape: ShapeId
  art: string
  seed: number
}

/**
 * 判断某格是否要保留：在格子里取 3×3 共 9 个采样点，
 * 只要有一点落在外形内就保留 —— 否则异形拼图会在边缘留下缺口。
 */
export function pieceInside(shape: ShapeId, cols: number, rows: number, r: number, c: number): boolean {
  const cw = 1 / cols
  const ch = 1 / rows
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      const u = (c + (i + 0.5) / 3) * cw
      const v = (r + (j + 0.5) / 3) * ch
      if (shapeCoversCorner(shape, u, v)) return true
    }
  }
  return false
}

export function buildSpec(options: JigsawOptions): JigsawSpec {
  const { rows, cols, shape } = options
  const pieces: JigsawPiece[] = []

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cx = (c + 0.5) / cols
      const cy = (r + 0.5) / rows
      if (!pieceInside(shape, cols, rows, r, c)) continue
      pieces.push({
        index: pieces.length,
        r,
        c,
        cx,
        cy,
        path: piecePath({
          top: r > 0,
          right: c < cols - 1,
          bottom: r < rows - 1,
          left: c > 0
        })
      })
    }
  }

  const art = artById(options.art)
  return {
    rows,
    cols,
    shape,
    art: art.value,
    artKind: art.kind,
    artLabel: art.label,
    pieces,
    outline: outlinePath(shape),
    seed: options.seed
  }
}

/**
 * 碎片初始摆放：在台面上按网格均匀摊开 + 轻微抖动。
 * 用种子驱动，所以同一个种子每次摆法一致（也方便自动化测试）。
 * 返回每块碎片左上角在台面上的像素坐标。
 */
export function scatterPieces(
  spec: JigsawSpec,
  board: number,
  pieceSize: number,
  seed: number
): { index: number; x: number; y: number }[] {
  const count = spec.pieces.length
  if (!count) return []
  const rng = mulberry32(seed + 13)
  const order = shuffle(
    spec.pieces.map((p) => p.index),
    rng
  )

  const cols = Math.max(1, Math.round(Math.sqrt(count)))
  const rows = Math.ceil(count / cols)
  const spanX = Math.max(0, board - pieceSize)
  const spanY = Math.max(0, board - pieceSize)
  const stepX = cols > 1 ? spanX / (cols - 1) : 0
  const stepY = rows > 1 ? spanY / (rows - 1) : 0
  const jitter = Math.min(stepX, stepY) * 0.18

  return order.map((index, slot) => {
    const c = slot % cols
    const r = Math.floor(slot / cols)
    const x = Math.min(spanX, Math.max(0, c * stepX + (rng() - 0.5) * jitter))
    const y = Math.min(spanY, Math.max(0, r * stepY + (rng() - 0.5) * jitter))
    return { index, x, y }
  })
}