import { createCanvas } from '@/lib/puzzle/download'
import { withAlpha, type Ctx } from '@/lib/puzzle/canvas2d'
import { drawSpecArt } from './pictures'
import type { JigsawPiece, JigsawSpec } from './generate'

export interface AreaBox {
  x: number
  y: number
  w: number
  h: number
}

export interface GridMetrics {
  side: number
  cell: number
  offX: number
  offY: number
}

/** 碎片格子始终是正方形，整块拼图居中放在 side×side 的方框里 */
export function gridMetrics(spec: JigsawSpec, side: number): GridMetrics {
  const cell = side / Math.max(spec.rows, spec.cols)
  return {
    side,
    cell,
    offX: (side - spec.cols * cell) / 2,
    offY: (side - spec.rows * cell) / 2
  }
}

export interface JigsawDrawOptions {
  accent: string
  ink: string
  /** 归一化线宽（相对格边长） */
  lineWidth: number
  showArt: boolean
  showOutline: boolean
}

/** 把 0~1 的外形轮廓变换到实际方框 */
function shapePath(spec: JigsawSpec, x: number, y: number, side: number): Path2D {
  const out = new Path2D()
  out.addPath(
    new Path2D(spec.outline),
    new DOMMatrix().translate(x + side / 2, y + side / 2).scale(side, side).translate(-0.5, -0.5)
  )
  return out
}

/** 画「拼好的整幅图 + 刀路」的打印模板 */
export function drawJigsawTemplate(
  ctx: Ctx,
  spec: JigsawSpec,
  box: AreaBox,
  opts: JigsawDrawOptions
): void {
  const side = Math.min(box.w, box.h)
  const x = box.x + (box.w - side) / 2
  const y = box.y + (box.h - side) / 2
  const m = gridMetrics(spec, side)

  ctx.save()
  ctx.beginPath()
  ctx.rect(box.x, box.y, box.w, box.h)
  ctx.clip()

  // 图形裁进外形里
  ctx.save()
  ctx.clip(shapePath(spec, x, y, side))
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(x, y, side, side)
  if (opts.showArt) {
    drawSpecArt(ctx, spec.art, spec.artKind, x + side / 2, y + side / 2, side * 0.78)
  }
  ctx.restore()

  // 刀路
  ctx.strokeStyle = opts.ink
  ctx.lineWidth = Math.max(1, m.cell * opts.lineWidth)
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  for (const piece of spec.pieces) {
    ctx.stroke(piecePathInBox(m, piece, x, y))
  }

  if (opts.showOutline) {
    ctx.strokeStyle = opts.accent
    ctx.lineWidth = Math.max(2, m.cell * opts.lineWidth * 2.2)
    ctx.stroke(shapePath(spec, x, y, side))
  }

  ctx.restore()
}

/** 把碎片刀路（格子局部 0~1）变换到整幅拼图的坐标系里，可再整体平移 dx/dy */
function piecePathInBox(m: GridMetrics, piece: JigsawPiece, dx = 0, dy = 0): Path2D {
  const out = new Path2D()
  out.addPath(
    new Path2D(piece.path),
    new DOMMatrix()
      .translate(dx + m.offX + piece.c * m.cell, dy + m.offY + piece.r * m.cell)
      .scale(m.cell, m.cell)
  )
  return out
}

/**
 * 为每块碎片预渲染一张精灵图。
 * 图案按整幅拼图的比例绘制，所以拼回去时图案是连续的。
 */
export function buildPieceSprites(
  spec: JigsawSpec,
  side: number,
  opts: JigsawDrawOptions,
  dpr = 2
): HTMLCanvasElement[] {
  const m = gridMetrics(spec, side)
  const pad = m.cell * 0.22
  const sw = m.cell + pad * 2
  const sh = m.cell + pad * 2
  const shape = shapePath(spec, 0, 0, side)

  return spec.pieces.map((piece) => {
    const canvas = createCanvas(sw * dpr, sh * dpr)
    const ctx = canvas.getContext('2d')
    if (!ctx) return canvas
    ctx.scale(dpr, dpr)
    ctx.translate(pad, pad)
    // 关键：把「这块碎片所在的格子」平移到精灵图原点，
    // 否则整幅图会按绝对坐标绘制，除左上角外的碎片都会被画到画布外面去。
    ctx.translate(-(m.offX + piece.c * m.cell), -(m.offY + piece.r * m.cell))

    // 先把整幅图画上去，再用碎片路径裁剪
    ctx.save()
    ctx.clip(piecePathInBox(m, piece))

    ctx.save()
    ctx.clip(shape)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, side, side)
    if (opts.showArt) drawSpecArt(ctx, spec.art, spec.artKind, side / 2, side / 2, side * 0.78)
    ctx.restore()

    ctx.restore()

    // 描边
    const outline = piecePathInBox(m, piece)
    ctx.strokeStyle = opts.ink
    ctx.lineWidth = Math.max(1, m.cell * opts.lineWidth)
    ctx.lineJoin = 'round'
    ctx.stroke(outline)

    return canvas
  })
}

/** 精灵图在页面上的绘制尺寸 */
export function spriteBox(spec: JigsawSpec, side: number): { pad: number; w: number; h: number } {
  const m = gridMetrics(spec, side)
  const pad = m.cell * 0.22
  return { pad, w: m.cell + pad * 2, h: m.cell + pad * 2 }
}

/** 拼图目标区域（淡色轮廓提示） */
export function drawGhostOutline(
  ctx: Ctx,
  spec: JigsawSpec,
  x: number,
  y: number,
  side: number,
  color: string
): void {
  const path = shapePath(spec, x, y, side)
  ctx.save()
  ctx.fillStyle = withAlpha(color, 0.06)
  ctx.fill(path)
  ctx.strokeStyle = withAlpha(color, 0.5)
  ctx.lineWidth = 2
  ctx.setLineDash([6, 6])
  ctx.stroke(path)
  ctx.restore()
}