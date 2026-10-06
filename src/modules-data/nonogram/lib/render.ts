import { drawText, textFont, withAlpha, type Ctx } from '@/lib/puzzle/canvas2d'
import type { NonogramPuzzle } from './generate'

export interface AreaBox {
  x: number
  y: number
  w: number
  h: number
}

export interface NonogramLayout {
  cell: number
  gx: number
  gy: number
  rowClueW: number
  colClueH: number
  clueLineH: number
  clueCharW: number
}

export interface NonogramDrawOptions {
  title: string
  showTitle: boolean
  /** 答案页：直接涂出正确图案 */
  showSolution: boolean
  /** 在线玩：玩家涂色，null 表示空白题面 */
  player: boolean[] | null
  /** 玩家标记的空格（画 ×） */
  crosses: boolean[] | null
  accent: string
  ink: string
  muted: string
}

export function nonogramLayout(box: AreaBox, puzzle: NonogramPuzzle, showTitle: boolean): NonogramLayout {
  const headerH = showTitle ? box.h * 0.07 : 0
  const bodyH = box.h - headerH
  const maxRowClues = Math.max(1, ...puzzle.rowClues.map((c) => c.length))
  const maxColClues = Math.max(1, ...puzzle.colClues.map((c) => c.length))

  // 两轮收敛：先按整块估一个格子大小，再用线索区占位反算
  let cell = Math.min(box.w, bodyH) / (Math.max(puzzle.cols, puzzle.rows) + 3)
  let rowClueW = 0
  let colClueH = 0
  let clueLineH = 0
  let clueCharW = 0
  for (let i = 0; i < 2; i++) {
    clueLineH = cell * 0.52
    clueCharW = cell * 0.44
    rowClueW = maxRowClues * clueCharW * 1.2
    colClueH = maxColClues * clueLineH * 1.2
    const availW = box.w - rowClueW - cell * 0.6
    const availH = bodyH - colClueH - cell * 0.6
    cell = Math.max(6, Math.min(availW / puzzle.cols, availH / puzzle.rows))
  }

  return {
    cell,
    rowClueW,
    colClueH,
    clueLineH,
    clueCharW,
    gx: box.x + rowClueW + cell * 0.3,
    gy: box.y + headerH + colClueH + cell * 0.3
  }
}

function stateOf(puzzle: NonogramPuzzle, opts: NonogramDrawOptions, i: number): 0 | 1 | 2 {
  if (opts.showSolution) return puzzle.filled[i] ? 1 : 0
  if (opts.player?.[i]) return 1
  if (opts.crosses?.[i]) return 2
  return 0
}

export function drawNonogramPage(
  ctx: Ctx,
  puzzle: NonogramPuzzle,
  box: AreaBox,
  opts: NonogramDrawOptions
): void {
  const L = nonogramLayout(box, puzzle, opts.showTitle)
  const headerH = opts.showTitle ? box.h * 0.07 : 0

  if (opts.showTitle) {
    drawText(
      ctx,
      opts.title,
      box.x + box.w / 2,
      box.y + headerH / 2,
      box.w * 0.9,
      box.h * 0.038,
      opts.ink,
      700
    )
  }

  // 网格线（含每 5 格加粗）
  const right = L.gx + puzzle.cols * L.cell
  const bottom = L.gy + puzzle.rows * L.cell
  ctx.strokeStyle = withAlpha(opts.ink, 0.75)
  ctx.lineWidth = Math.max(1, L.cell * 0.035)
  for (let c = 0; c <= puzzle.cols; c++) {
    ctx.beginPath()
    ctx.moveTo(L.gx + c * L.cell, L.gy)
    ctx.lineTo(L.gx + c * L.cell, bottom)
    ctx.stroke()
  }
  for (let r = 0; r <= puzzle.rows; r++) {
    ctx.beginPath()
    ctx.moveTo(L.gx, L.gy + r * L.cell)
    ctx.lineTo(right, L.gy + r * L.cell)
    ctx.stroke()
  }
  ctx.strokeStyle = opts.ink
  ctx.lineWidth = Math.max(1.5, L.cell * 0.07)
  for (let c = 0; c <= puzzle.cols; c += 5) {
    ctx.beginPath()
    ctx.moveTo(L.gx + c * L.cell, L.gy)
    ctx.lineTo(L.gx + c * L.cell, bottom)
    ctx.stroke()
  }
  for (let r = 0; r <= puzzle.rows; r += 5) {
    ctx.beginPath()
    ctx.moveTo(L.gx, L.gy + r * L.cell)
    ctx.lineTo(right, L.gy + r * L.cell)
    ctx.stroke()
  }

  // 玩家涂色 / 答案
  for (let i = 0; i < puzzle.filled.length; i++) {
    const st = stateOf(puzzle, opts, i)
    if (st === 0) continue
    const c = i % puzzle.cols
    const r = Math.floor(i / puzzle.cols)
    const x = L.gx + c * L.cell
    const y = L.gy + r * L.cell
    if (st === 1) {
      ctx.fillStyle = opts.ink
      ctx.fillRect(x, y, L.cell, L.cell)
    } else {
      ctx.strokeStyle = withAlpha(opts.muted, 0.85)
      ctx.lineWidth = Math.max(1, L.cell * 0.06)
      const p = L.cell * 0.3
      ctx.beginPath()
      ctx.moveTo(x + p, y + p)
      ctx.lineTo(x + L.cell - p, y + L.cell - p)
      ctx.moveTo(x + L.cell - p, y + p)
      ctx.lineTo(x + p, y + L.cell - p)
      ctx.stroke()
    }
  }

  // 列线索（顶部）
  ctx.fillStyle = opts.muted
  ctx.font = textFont(Math.max(7, L.clueCharW * 1.1), 600)
  ctx.textAlign = 'right'
  ctx.textBaseline = 'middle'
  for (let c = 0; c < puzzle.cols; c++) {
    const clues = puzzle.colClues[c]
    clues.forEach((v, i) => {
      const y = L.gy - L.cell * 0.22 - (clues.length - 1 - i) * L.clueLineH
      ctx.fillText(String(v), L.gx + (c + 1) * L.cell - L.cell * 0.18, y)
    })
  }

  // 行线索（左侧）
  ctx.textAlign = 'right'
  for (let r = 0; r < puzzle.rows; r++) {
    const clues = puzzle.rowClues[r]
    clues.forEach((v, i) => {
      const x = L.gx - L.cell * 0.22 - (clues.length - 1 - i) * L.clueCharW * 1.2
      ctx.fillText(String(v), x, L.gy + r * L.cell + L.cell / 2)
    })
  }

  // 图案名（答案页）
  if (opts.showSolution) {
    drawText(
      ctx,
      `答案：${puzzle.patternLabel}`,
      box.x + box.w / 2,
      bottom + (box.y + box.h - bottom) * 0.45,
      box.w * 0.8,
      box.h * 0.032,
      opts.accent,
      700
    )
  }
}

/** 画布坐标 → 格子下标，-1 表示点在网格外 */
export function hitNonogram(
  puzzle: NonogramPuzzle,
  box: AreaBox,
  showTitle: boolean,
  px: number,
  py: number
): number {
  const L = nonogramLayout(box, puzzle, showTitle)
  if (px < L.gx || py < L.gy) return -1
  const c = Math.floor((px - L.gx) / L.cell)
  const r = Math.floor((py - L.gy) / L.cell)
  if (c < 0 || c >= puzzle.cols || r < 0 || r >= puzzle.rows) return -1
  return r * puzzle.cols + c
}

/** 手绘模式用的纯网格（无线索） */
export function drawPlainGrid(
  ctx: Ctx,
  cols: number,
  rows: number,
  filled: boolean[],
  box: AreaBox,
  fillColor: string,
  gridColor: string,
  accentColor: string
): void {
  const cell = Math.min(box.w / cols, box.h / rows)
  const gx = box.x + (box.w - cell * cols) / 2
  const gy = box.y + (box.h - cell * rows) / 2

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(gx, gy, cell * cols, cell * rows)
  for (let i = 0; i < filled.length; i++) {
    if (!filled[i]) continue
    const c = i % cols
    const r = Math.floor(i / cols)
    ctx.fillStyle = fillColor
    ctx.fillRect(gx + c * cell, gy + r * cell, cell, cell)
  }

  ctx.strokeStyle = gridColor
  ctx.lineWidth = Math.max(1, cell * 0.03)
  for (let c = 0; c <= cols; c++) {
    ctx.beginPath()
    ctx.moveTo(gx + c * cell, gy)
    ctx.lineTo(gx + c * cell, gy + rows * cell)
    ctx.stroke()
  }
  for (let r = 0; r <= rows; r++) {
    ctx.beginPath()
    ctx.moveTo(gx, gy + r * cell)
    ctx.lineTo(gx + cols * cell, gy + r * cell)
    ctx.stroke()
  }

  ctx.strokeStyle = accentColor
  ctx.lineWidth = Math.max(1.5, cell * 0.06)
  for (let c = 0; c <= cols; c += 5) {
    ctx.beginPath()
    ctx.moveTo(gx + c * cell, gy)
    ctx.lineTo(gx + c * cell, gy + rows * cell)
    ctx.stroke()
  }
  for (let r = 0; r <= rows; r += 5) {
    ctx.beginPath()
    ctx.moveTo(gx, gy + r * cell)
    ctx.lineTo(gx + cols * cell, gy + r * cell)
    ctx.stroke()
  }
}

/** 纯网格的点击命中 */
export function hitPlainGrid(
  cols: number,
  rows: number,
  box: AreaBox,
  px: number,
  py: number
): number {
  const cell = Math.min(box.w / cols, box.h / rows)
  const gx = box.x + (box.w - cell * cols) / 2
  const gy = box.y + (box.h - cell * rows) / 2
  if (px < gx || py < gy) return -1
  const c = Math.floor((px - gx) / cell)
  const r = Math.floor((py - gy) / cell)
  if (c < 0 || c >= cols || r < 0 || r >= rows) return -1
  return r * cols + c
}