import { canvasToBlob, createCanvas } from '@/lib/puzzle/download'
import { buildPdf } from '@/lib/puzzle/pdf'
import { getPaper, printablePx, type PaperId } from '@/lib/puzzle/paper'
import { drawFindAnswerKey, drawFindPage, type AreaBox } from './render'
import type { FindDrawOptions, FindPuzzle } from './types'

function renderPage(
  puzzle: FindPuzzle,
  opts: FindDrawOptions,
  width: number,
  height: number
): HTMLCanvasElement {
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('无法创建画布上下文')
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, width, height)
  const box: AreaBox = { x: width * 0.04, y: height * 0.03, w: width * 0.92, h: height * 0.94 }
  drawFindPage(ctx, puzzle, box, opts)
  return canvas
}

export async function exportFindPng(
  puzzle: FindPuzzle,
  opts: FindDrawOptions,
  width = 1400
): Promise<Blob> {
  const height = Math.round(width * 1.18)
  return canvasToBlob(renderPage(puzzle, opts, width, height), 'image/png')
}

export async function exportFindPdf(
  puzzle: FindPuzzle,
  opts: FindDrawOptions,
  paper: PaperId
): Promise<Blob> {
  const p = getPaper(paper)
  const portrait: [number, number] = [p.mm[0], p.mm[1]]
  const marginMm = 12
  const px = printablePx(portrait, marginMm)

  const question = renderPage(puzzle, { ...opts, showSolution: false }, px.width, px.height)

  const answer = createCanvas(px.width, px.height)
  const actx = answer.getContext('2d')
  if (!actx) throw new Error('无法创建画布上下文')
  actx.fillStyle = '#ffffff'
  actx.fillRect(0, 0, px.width, px.height)
  drawFindPage(
    actx,
    puzzle,
    { x: px.width * 0.04, y: px.height * 0.03, w: px.width * 0.92, h: px.height * 0.72 },
    { ...opts, showSolution: true }
  )
  drawFindAnswerKey(
    actx,
    puzzle,
    { x: px.width * 0.08, y: px.height * 0.72, w: px.width * 0.84, h: px.height * 0.26 },
    { ...opts, showSolution: true }
  )

  const toPage = async (c: HTMLCanvasElement) => ({
    bytes: new Uint8Array(await (await canvasToBlob(c, 'image/jpeg', 0.92)).arrayBuffer()),
    width: c.width,
    height: c.height
  })

  return buildPdf([await toPage(question), await toPage(answer)], portrait, marginMm)
}