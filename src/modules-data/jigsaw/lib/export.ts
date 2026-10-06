import { canvasToBlob, createCanvas } from '@/lib/puzzle/download'
import { buildPdf } from '@/lib/puzzle/pdf'
import { getPaper, printablePx, type PaperId } from '@/lib/puzzle/paper'
import { drawJigsawTemplate, type AreaBox, type JigsawDrawOptions } from './render'
import type { JigsawSpec } from './generate'

function renderTemplate(
  spec: JigsawSpec,
  opts: JigsawDrawOptions,
  title: string,
  width: number,
  height: number
): HTMLCanvasElement {
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('无法创建画布上下文')
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, width, height)
  const titleH = title ? height * 0.06 : 0
  if (title) {
    ctx.save()
    ctx.fillStyle = opts.ink
    ctx.font = `700 ${Math.round(titleH * 0.42)}px system-ui,-apple-system,"PingFang SC",sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(title, width / 2, titleH / 2)
    ctx.restore()
  }
  const box: AreaBox = {
    x: width * 0.06,
    y: titleH + height * 0.03,
    w: width * 0.88,
    h: height - titleH - height * 0.06
  }
  drawJigsawTemplate(ctx, spec, box, opts)
  return canvas
}

export async function exportJigsawPng(
  spec: JigsawSpec,
  opts: JigsawDrawOptions,
  width = 1400
): Promise<Blob> {
  return canvasToBlob(renderTemplate(spec, opts, '', width, width), 'image/png')
}

/** 两页：第 1 页带图（照着拼），第 2 页只留刀线（可以自己涂） */
export async function exportJigsawPdf(
  spec: JigsawSpec,
  opts: JigsawDrawOptions,
  paper: PaperId,
  withBlankPage = true
): Promise<Blob> {
  const p = getPaper(paper)
  const portrait: [number, number] = [p.mm[0], p.mm[1]]
  const marginMm = 12
  const px = printablePx(portrait, marginMm)

  const pages: HTMLCanvasElement[] = [
    renderTemplate(spec, opts, `${spec.artLabel}拼图 · ${spec.pieces.length} 片`, px.width, px.height)
  ]
  if (withBlankPage) {
    pages.push(
      renderTemplate(
        spec,
        { ...opts, showArt: false },
        `${spec.artLabel}拼图 · 涂色版（只有刀路）`,
        px.width,
        px.height
      )
    )
  }

  const toPage = async (c: HTMLCanvasElement) => ({
    bytes: new Uint8Array(await (await canvasToBlob(c, 'image/jpeg', 0.92)).arrayBuffer()),
    width: c.width,
    height: c.height
  })

  return buildPdf(await Promise.all(pages.map(toPage)), portrait, marginMm)
}

/** 矢量切割模板：每块碎片一条独立闭合路径，可直接导入激光切割 / Cricut */
export function exportJigsawSvg(spec: JigsawSpec, opts: JigsawDrawOptions): Blob {
  const side = 1000
  const cell = side / Math.max(spec.rows, spec.cols)
  const offX = (side - spec.cols * cell) / 2
  const offY = (side - spec.rows * cell) / 2
  const n = (v: number) => String(Math.round(v * 100) / 100)

  const parts: string[] = []
  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${side}" height="${side}" viewBox="0 0 ${side} ${side}">`
  )
  if (opts.showArt) {
    parts.push(
      `<text x="${n(side / 2)}" y="${n(side / 2)}" font-size="${n(side * 0.74)}" text-anchor="middle" dominant-baseline="central">${spec.art}</text>`
    )
  }
  parts.push(
    `<g fill="none" stroke="${opts.ink}" stroke-width="${n(cell * opts.lineWidth)}" stroke-linejoin="round" stroke-linecap="round">`
  )
  for (const piece of spec.pieces) {
    const tx = n(offX + piece.c * cell)
    const ty = n(offY + piece.r * cell)
    const sc = n(cell)
    parts.push(`<path transform="translate(${tx},${ty}) scale(${sc})" d="${piece.path}"/>`)
  }
  parts.push('</g>')
  parts.push('</svg>')

  return new Blob([parts.join('\n')], { type: 'image/svg+xml;charset=utf-8' })
}