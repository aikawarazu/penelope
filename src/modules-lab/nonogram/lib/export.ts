import { canvasToBlob, createCanvas } from '@/lib/puzzle/download'
import { buildPdf } from '@/lib/puzzle/pdf'
import { getPaper, printablePx, type PaperId } from '@/lib/puzzle/paper'
import { drawNonogramPage, type AreaBox } from './render'
import type { NonogramPuzzle } from './generate'
import type { NonogramDrawOptions } from './render'

function renderPage(
  puzzle: NonogramPuzzle,
  opts: NonogramDrawOptions,
  width: number,
  height: number
): HTMLCanvasElement {
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('无法创建画布上下文')
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, width, height)
  const box: AreaBox = { x: width * 0.05, y: height * 0.03, w: width * 0.9, h: height * 0.94 }
  drawNonogramPage(ctx, puzzle, box, opts)
  return canvas
}

export async function exportNonogramPng(
  puzzle: NonogramPuzzle,
  opts: NonogramDrawOptions,
  width = 1500
): Promise<Blob> {
  return canvasToBlob(renderPage(puzzle, opts, width, Math.round(width)), 'image/png')
}

export async function exportNonogramPdf(
  puzzle: NonogramPuzzle,
  opts: NonogramDrawOptions,
  paper: PaperId
): Promise<Blob> {
  const p = getPaper(paper)
  const portrait: [number, number] = [p.mm[0], p.mm[1]]
  const marginMm = 12
  const px = printablePx(portrait, marginMm)

  const question = renderPage(puzzle, { ...opts, showSolution: false }, px.width, px.height)
  const answer = renderPage(puzzle, { ...opts, showSolution: true }, px.width, px.height)

  const toPage = async (c: HTMLCanvasElement) => ({
    bytes: new Uint8Array(await (await canvasToBlob(c, 'image/jpeg', 0.92)).arrayBuffer()),
    width: c.width,
    height: c.height
  })

  return buildPdf([await toPage(question), await toPage(answer)], portrait, marginMm)
}