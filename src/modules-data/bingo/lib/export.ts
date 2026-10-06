import { canvasToBlob, createCanvas } from '@/lib/puzzle/download'
import { buildPdf } from '@/lib/puzzle/pdf'
import { getPaper, printablePx, type OrientationId, type PaperId } from '@/lib/puzzle/paper'
import { cardAspect, drawCallerList, drawCard } from './render'
import type { BingoCard, BingoDeck, CardState, CardStyle } from './types'

export interface BingoExportOptions {
  paper: PaperId
  orientation: OrientationId
  /** 每页放几张卡：1 或 4（2×2） */
  perPage: 1 | 4
  withCallerList: boolean
  marginMm?: number
}

function cardBoxFor(pageW: number, pageH: number, perPage: 1 | 4, showTitle: boolean) {
  const aspect = cardAspect(showTitle)
  if (perPage === 1) {
    const w = pageW * 0.86
    const h = Math.min(w * aspect, pageH * 0.86)
    return { x: (pageW - w) / 2, y: (pageH - h) / 2, w, h }
  }
  const gap = pageW * 0.06
  const w = (pageW - gap * 3) / 2
  const h = Math.min(w * aspect, (pageH - gap * 3) / 2)
  return { x: gap, y: gap, w, h }
}

export async function exportBingoPng(
  card: BingoCard,
  style: CardStyle,
  state: CardState,
  px = 900
): Promise<Blob> {
  const aspect = cardAspect(style.showTitle)
  const canvas = createCanvas(px, px * aspect)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('无法创建画布上下文')
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  drawCard(ctx, card, { x: 0, y: 0, w: canvas.width, h: canvas.height }, style, state)
  return canvasToBlob(canvas, 'image/png')
}

export async function exportBingoPdf(
  deck: BingoDeck,
  style: CardStyle,
  options: BingoExportOptions
): Promise<Blob> {
  const paper = getPaper(options.paper)
  const marginMm = options.marginMm ?? 12
  const contentW = deck.cards.length ? deck.size : 1
  const contentH = deck.cards.length ? deck.size : 1
  const landscape = options.orientation === 'landscape' || (options.orientation === 'auto' && contentW > contentH)
  const pageMm: [number, number] = landscape ? [paper.mm[1], paper.mm[0]] : [paper.mm[0], paper.mm[1]]

  const px = printablePx(pageMm, marginMm)
  const pageCanvas = () => {
    const c = createCanvas(px.width, px.height)
    const ctx = c.getContext('2d')
    if (!ctx) throw new Error('无法创建画布上下文')
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, px.width, px.height)
    return { canvas: c, ctx }
  }

  const canvases: HTMLCanvasElement[] = []
  const perPage = options.perPage

  for (let i = 0; i < deck.cards.length; i += perPage) {
    const { canvas, ctx } = pageCanvas()
    if (perPage === 1) {
      const box = cardBoxFor(px.width, px.height, 1, style.showTitle)
      drawCard(ctx, deck.cards[i], box, style)
    } else {
      const gap = px.width * 0.06
      const w = (px.width - gap * 3) / 2
      const h = Math.min(w * cardAspect(style.showTitle), (px.height - gap * 3) / 2)
      const slots = [
        { x: gap, y: gap },
        { x: gap * 2 + w, y: gap },
        { x: gap, y: gap * 2 + h },
        { x: gap * 2 + w, y: gap * 2 + h }
      ]
      for (let k = 0; k < 4; k++) {
        const card = deck.cards[i + k]
        if (!card) break
        drawCard(ctx, card, { x: slots[k].x, y: slots[k].y, w, h }, style)
      }
    }
    canvases.push(canvas)
  }

  if (options.withCallerList && deck.caller.length) {
    const { canvas, ctx } = pageCanvas()
    const labels = new Map<string, string>()
    for (const card of deck.cards) {
      for (const cell of card.cells) if (cell) labels.set(cell.emoji, cell.label)
    }
    drawCallerList(
      ctx,
      deck.caller.map((c) => c.emoji),
      labels,
      { x: px.width * 0.1, y: px.height * 0.06, w: px.width * 0.8, h: px.height * 0.88 },
      style
    )
    canvases.push(canvas)
  }

  return buildPdf(
    await Promise.all(
      canvases.map(async (c) => ({ bytes: await canvasToJpeg(c), width: c.width, height: c.height }))
    ),
    pageMm,
    marginMm
  )
}

async function canvasToJpeg(canvas: HTMLCanvasElement): Promise<Uint8Array> {
  const blob = await canvasToBlob(canvas, 'image/jpeg', 0.92)
  return new Uint8Array(await blob.arrayBuffer())
}