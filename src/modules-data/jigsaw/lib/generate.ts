import { mulberry32, randInt, shuffle } from '@/lib/puzzle/rng'
import { outlinePath, piecePath, shapeCoversCorner, type ShapeId } from './paths'

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
  art: string
  artLabel: string
  pieces: JigsawPiece[]
  outline: string
  seed: number
}

export interface ArtOption {
  emoji: string
  label: string
}

export const ARTS: readonly ArtOption[] = [
  { emoji: '🐱', label: '小猫' },
  { emoji: '🚀', label: '火箭' },
  { emoji: '🌈', label: '彩虹' },
  { emoji: '🎈', label: '气球' },
  { emoji: '🌻', label: '向日葵' },
  { emoji: '🦋', label: '蝴蝶' },
  { emoji: '🐟', label: '小鱼' },
  { emoji: '🍉', label: '西瓜' }
]

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

/** 判断碎片中心是否落在外形内（外形外的碎片不生成） */
export function pieceInside(shape: ShapeId, cx: number, cy: number): boolean {
  return shapeCoversCorner(shape, cx, cy)
}

export function buildSpec(options: JigsawOptions): JigsawSpec {
  const { rows, cols, shape } = options
  const pieces: JigsawPiece[] = []

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cx = (c + 0.5) / cols
      const cy = (r + 0.5) / rows
      if (!pieceInside(shape, cx, cy)) continue
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

  const art = ARTS.find((a) => a.emoji === options.art) ?? ARTS[0]
  return {
    rows,
    cols,
    shape,
    art: art.emoji,
    artLabel: art.label,
    pieces,
    outline: outlinePath(shape),
    seed: options.seed
  }
}

/** 打乱碎片初始摆放位置，返回每块的左上角（拼图归一化坐标，允许超出 0~1） */
export function scatterPieces(
  spec: JigsawSpec,
  seed: number
): { index: number; x: number; y: number }[] {
  const rng = mulberry32(seed + 13)
  return shuffle(
    spec.pieces.map((p) => ({
      index: p.index,
      x: randInt(rng, 40) / 100,
      y: randInt(rng, 40) / 100
    })),
    rng
  )
}