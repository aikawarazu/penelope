import { drawEmoji, drawText, withAlpha, type Ctx } from '@/lib/puzzle/canvas2d'
import { symbolsFor, type SymbolSet } from './sudoku'

export interface AreaBox {
  x: number
  y: number
  w: number
  h: number
}

export interface SudokuCellView {
  /** 1..n，0 表示空 */
  value: number
  given: boolean
  conflict: boolean
  selected: boolean
  hint: boolean
}

export interface SudokuBoard {
  n: number
  bh: number
  bw: number
  cells: SudokuCellView[]
  /** 顶部小标签，如「第 1 题」 */
  label: string | null
}

export interface SudokuPageOptions {
  accent: string
  ink: string
  muted: string
  /** 是否画宫分隔的粗线 */
  boldBoxes: boolean
  title: string | null
}

/** 单个盘面：正方形，居中在 box 内 */
function boardBox(box: AreaBox, n: number, labelH: number) {
  const areaH = box.h - labelH
  const side = Math.min(box.w, areaH)
  return { x: box.x + (box.w - side) / 2, y: box.y + labelH + (areaH - side) / 2, side }
}

export function drawSudokuBoard(
  ctx: Ctx,
  board: SudokuBoard,
  box: AreaBox,
  opts: SudokuPageOptions,
  symbols?: SymbolSet
): { x: number; y: number; cell: number } {
  const labelH = board.label ? Math.max(14, box.h * 0.06) : 0
  const B = boardBox(box, board.n, labelH)
  const cell = B.side / board.n
  const sym = symbols ?? symbolsFor(board.n)

  if (board.label) {
    drawText(ctx, board.label, box.x + box.w / 2, box.y + labelH / 2, box.w * 0.9, labelH * 0.55, opts.muted, 600)
  }

  // 底板
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(B.x, B.y, B.side, B.side)

  // 选中 / 提示底色
  for (let i = 0; i < board.cells.length; i++) {
    const cellView = board.cells[i]
    if (!cellView.selected && !cellView.hint) continue
    const r = (i / board.n) | 0
    const c = i % board.n
    ctx.fillStyle = withAlpha(opts.accent, cellView.selected ? 0.2 : 0.12)
    ctx.fillRect(B.x + c * cell, B.y + r * cell, cell, cell)
  }

  // 细网格
  ctx.strokeStyle = withAlpha(opts.ink, 0.45)
  ctx.lineWidth = Math.max(1, cell * 0.03)
  for (let k = 0; k <= board.n; k++) {
    ctx.beginPath()
    ctx.moveTo(B.x + k * cell, B.y)
    ctx.lineTo(B.x + k * cell, B.y + board.n * cell)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(B.x, B.y + k * cell)
    ctx.lineTo(B.x + board.n * cell, B.y + k * cell)
    ctx.stroke()
  }

  // 宫分隔粗线 + 外框
  ctx.strokeStyle = opts.ink
  ctx.lineWidth = Math.max(1.5, cell * 0.07)
  for (let k = 0; k <= board.n; k += board.bh) {
    ctx.beginPath()
    ctx.moveTo(B.x, B.y + k * cell)
    ctx.lineTo(B.x + board.n * cell, B.y + k * cell)
    ctx.stroke()
  }
  for (let k = 0; k <= board.n; k += board.bw) {
    ctx.beginPath()
    ctx.moveTo(B.x + k * cell, B.y)
    ctx.lineTo(B.x + k * cell, B.y + board.n * cell)
    ctx.stroke()
  }
  ctx.lineWidth = Math.max(2, cell * 0.1)
  ctx.strokeRect(B.x, B.y, board.n * cell, board.n * cell)

  // 图形
  for (let i = 0; i < board.cells.length; i++) {
    const cv = board.cells[i]
    if (!cv.value) continue
    const r = (i / board.n) | 0
    const c = i % board.n
    const cx = B.x + c * cell + cell / 2
    const cy = B.y + r * cell + cell / 2
    if (cv.conflict) {
      ctx.fillStyle = 'rgba(239,68,68,0.18)'
      ctx.fillRect(B.x + c * cell, B.y + r * cell, cell, cell)
      drawEmoji(ctx, sym.emoji[cv.value - 1], cx, cy, cell * 0.52)
      continue
    }
    if (cv.given) {
      // 给定数字加深框区分
      ctx.strokeStyle = withAlpha(opts.ink, 0.25)
      ctx.lineWidth = Math.max(1, cell * 0.04)
      ctx.strokeRect(B.x + c * cell + cell * 0.12, B.y + r * cell + cell * 0.12, cell * 0.76, cell * 0.76)
    }
    drawEmoji(ctx, sym.emoji[cv.value - 1], cx, cy, cell * (cv.given ? 0.6 : 0.54))
  }

  return { x: B.x, y: B.y, cell }
}

export interface SudokuPageLayout {
  cols: number
  rows: number
}

/** 多题排版：1 题 1 列，2~4 题 2 列，5~9 题 3 列 */
export function sudokuPageLayout(count: number): SudokuPageLayout {
  const cols = count <= 1 ? 1 : count <= 4 ? 2 : 3
  const rows = Math.ceil(count / cols)
  return { cols, rows }
}

export function drawSudokuPage(
  ctx: Ctx,
  boards: SudokuBoard[],
  box: AreaBox,
  opts: SudokuPageOptions,
  titleH = 0
): void {
  if (opts.title) {
    drawText(ctx, opts.title, box.x + box.w / 2, box.y + titleH / 2, box.w * 0.9, titleH * 0.5, opts.ink, 700)
  }
  const grid = sudokuPageLayout(boards.length)
  const areaY = box.y + titleH
  const areaH = box.h - titleH
  const gapX = box.w * 0.03
  const gapY = areaH * 0.03
  const cellW = (box.w - gapX * (grid.cols + 1)) / grid.cols
  const cellH = (areaH - gapY * (grid.rows + 1)) / grid.rows

  boards.forEach((board, i) => {
    const r = Math.floor(i / grid.cols)
    const c = i % grid.cols
    drawSudokuBoard(
      ctx,
      board,
      { x: box.x + gapX + c * (cellW + gapX), y: areaY + gapY + r * (cellH + gapY), w: cellW, h: cellH },
      opts
    )
  })
}

/** 画布坐标 → 格子下标，-1 表示没点中盘面 */
export function hitSudoku(
  board: SudokuBoard,
  box: AreaBox,
  px: number,
  py: number
): number {
  const labelH = board.label ? Math.max(14, box.h * 0.06) : 0
  const B = boardBox(box, board.n, labelH)
  const cell = B.side / board.n
  if (px < B.x || py < B.y) return -1
  const c = Math.floor((px - B.x) / cell)
  const r = Math.floor((py - B.y) / cell)
  if (c < 0 || c >= board.n || r < 0 || r >= board.n) return -1
  return r * board.n + c
}