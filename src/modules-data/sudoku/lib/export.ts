import { canvasToBlob, createCanvas } from '@/lib/puzzle/download'
import { buildPdf } from '@/lib/puzzle/pdf'
import { getPaper, printablePx, type PaperId } from '@/lib/puzzle/paper'
import { drawSudokuPage, type AreaBox, type SudokuBoard, type SudokuPageOptions } from './render'

export interface SudokuExportPuzzle {
  n: number
  bh: number
  bw: number
  /** 0 = 空，1..n = 图形编号 */
  values: Int8Array
}

function toBoard(p: SudokuExportPuzzle, index: number): SudokuBoard {
  return {
    n: p.n,
    bh: p.bh,
    bw: p.bw,
    label: `第 ${index + 1} 题`,
    cells: Array.from({ length: p.n * p.n }, (_, i) => ({
      value: p.values[i],
      given: true,
      conflict: false,
      selected: false,
      hint: false
    }))
  }
}

function renderPage(
  puzzles: SudokuExportPuzzle[],
  opts: SudokuPageOptions,
  title: string,
  width: number,
  height: number
): HTMLCanvasElement {
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('无法创建画布上下文')
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, width, height)
  const box: AreaBox = { x: width * 0.05, y: height * 0.035, w: width * 0.9, h: height * 0.93 }
  drawSudokuPage(ctx, puzzles.map(toBoard), box, { ...opts, title }, title ? box.h * 0.06 : 0)
  return canvas
}

export async function exportSudokuPng(
  puzzle: SudokuExportPuzzle,
  opts: SudokuPageOptions,
  width = 1200
): Promise<Blob> {
  return canvasToBlob(renderPage([puzzle], opts, '', width, width), 'image/png')
}

export async function exportSudokuPdf(
  puzzles: SudokuExportPuzzle[],
  solutions: Int8Array[],
  opts: SudokuPageOptions,
  paper: PaperId,
  title = '图形数独'
): Promise<Blob> {
  const p = getPaper(paper)
  const portrait: [number, number] = [p.mm[0], p.mm[1]]
  const marginMm = 12
  const px = printablePx(portrait, marginMm)

  const question = renderPage(puzzles, opts, title, px.width, px.height)
  const answer = renderPage(
    puzzles.map((q, i) => ({ ...q, values: solutions[i] })),
    opts,
    `${title} · 答案`,
    px.width,
    px.height
  )

  const toPage = async (c: HTMLCanvasElement) => ({
    bytes: new Uint8Array(await (await canvasToBlob(c, 'image/jpeg', 0.92)).arrayBuffer()),
    width: c.width,
    height: c.height
  })

  return buildPdf([await toPage(question), await toPage(answer)], portrait, marginMm)
}