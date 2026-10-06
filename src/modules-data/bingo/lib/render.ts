import { drawEmoji, drawText, roundRectPath, textFont, withAlpha, type Ctx } from '@/lib/puzzle/canvas2d'
import type { BingoCard, CardState, CardStyle } from './types'

export interface CardBox {
  x: number
  y: number
  w: number
  h: number
}

/** 卡片外框（含标题区）的宽高比，用于排版时预留空间 */
export function cardAspect(showTitle: boolean): number {
  return showTitle ? 1.12 : 1
}

export interface CardLayout {
  gx: number
  gy: number
  cell: number
  side: number
  headerH: number
}

/** 卡片内部网格的排版，绘制与点击命中共用同一份计算 */
export function cardLayout(box: CardBox, size: number, showTitle: boolean): CardLayout {
  const headerH = showTitle ? box.h * 0.12 : 0
  const areaTop = box.y + headerH
  const areaH = box.h - headerH
  const side = Math.min(box.w * 0.94, areaH * 0.94)
  return {
    gx: box.x + (box.w - side) / 2,
    gy: areaTop + (areaH - side) / 2,
    cell: side / size,
    side,
    headerH
  }
}

/** 画布坐标 → 格子下标，-1 表示点在网格外 */
export function hitCard(box: CardBox, size: number, showTitle: boolean, px: number, py: number): number {
  const L = cardLayout(box, size, showTitle)
  if (px < L.gx || px >= L.gx + L.side || py < L.gy || py >= L.gy + L.side) return -1
  const c = Math.floor((px - L.gx) / L.cell)
  const r = Math.floor((py - L.gy) / L.cell)
  return r * size + c
}

/**
 * 画一张宾果卡。
 * 坐标系是绝对像素，box 为卡片外框范围，内部自行居中排版。
 */
export function drawCard(
  ctx: Ctx,
  card: BingoCard,
  box: CardBox,
  style: CardStyle,
  state?: CardState
): void {
  const { x, y, w, h } = box
  const radius = Math.min(w, h) * 0.05
  const headerH = style.showTitle ? h * 0.12 : 0

  // 底板
  roundRectPath(ctx, x, y, w, h, radius)
  ctx.fillStyle = '#ffffff'
  ctx.fill()
  ctx.strokeStyle = style.accent
  ctx.lineWidth = Math.max(2, w * 0.009)
  ctx.stroke()

  // 标题
  if (style.showTitle) {
    drawText(ctx, style.title, x + w / 2, y + headerH / 2, w * 0.88, h * 0.055, style.ink, 700)
    ctx.strokeStyle = withAlpha(style.accent, 0.35)
    ctx.lineWidth = Math.max(1, w * 0.004)
    ctx.beginPath()
    ctx.moveTo(x + w * 0.08, y + headerH * 0.92)
    ctx.lineTo(x + w * 0.92, y + headerH * 0.92)
    ctx.stroke()
  }

  // 网格
  const L = cardLayout(box, card.size, style.showTitle)
  const { gx, gy, cell } = L
  const line = Math.max(1.5, cell * 0.035)
  const markAlpha = 0.22

  for (let i = 0; i < card.cells.length; i++) {
    const r = Math.floor(i / card.size)
    const c = i % card.size
    const cx = gx + c * cell
    const cy = gy + r * cell
    const item = card.cells[i]

    ctx.fillStyle = (r + c) % 2 === 0 ? '#ffffff' : '#f7faf8'
    ctx.fillRect(cx, cy, cell, cell)
    ctx.strokeStyle = withAlpha(style.accent, 0.55)
    ctx.lineWidth = line
    ctx.strokeRect(cx, cy, cell, cell)

    // 已标记：铺一层主题色
    if (state?.marked.has(i)) {
      ctx.fillStyle = withAlpha(style.accent, markAlpha)
      ctx.fillRect(cx, cy, cell, cell)
    }

    // 抽中的图形：加一圈高亮描边
    if (state?.highlightEmoji && item?.emoji === state.highlightEmoji) {
      ctx.strokeStyle = style.accent
      ctx.lineWidth = Math.max(2, cell * 0.09)
      ctx.strokeRect(cx + line * 2, cy + line * 2, cell - line * 4, cell - line * 4)
    }

    if (!item) {
      drawEmoji(ctx, '⭐️', cx + cell / 2, cy + cell * 0.44, cell * 0.46)
      drawText(ctx, '自由格', cx + cell / 2, cy + cell * 0.78, cell * 0.9, cell * 0.14, style.muted)
      continue
    }

    drawEmoji(ctx, item.emoji, cx + cell / 2, cy + cell * 0.44, cell * 0.46)
    drawText(ctx, item.label, cx + cell / 2, cy + cell * 0.79, cell * 0.92, cell * 0.145, style.muted)
  }
}

/** 呼叫清单：一页里分列打印所有图形 */
export function drawCallerList(
  ctx: Ctx,
  emojis: string[],
  labels: Map<string, string>,
  box: CardBox,
  style: CardStyle
): void {
  const { x, y, w, h } = box
  const headerH = h * 0.08
  drawText(ctx, '呼叫清单 · 主持人读', x + w / 2, y + headerH / 2, w * 0.9, h * 0.032, style.ink, 700)
  ctx.strokeStyle = withAlpha(style.accent, 0.4)
  ctx.lineWidth = Math.max(1, w * 0.0015)
  ctx.beginPath()
  ctx.moveTo(x, y + headerH * 1.5)
  ctx.lineTo(x + w, y + headerH * 1.5)
  ctx.stroke()

  const cols = 4
  const rows = Math.ceil(emojis.length / cols)
  const top = y + headerH * 2
  const areaH = h - (top - y)
  const cellW = w / cols
  const cellH = areaH / Math.max(1, rows)
  const font = textFont(cellH * 0.2)

  emojis.forEach((emoji, i) => {
    const r = Math.floor(i / cols)
    const c = i % cols
    const cx = x + c * cellW + cellW / 2
    const cy = top + r * cellH + cellH / 2
    drawEmoji(ctx, emoji, cx, cy - cellH * 0.08, cellH * 0.38)
    ctx.save()
    ctx.font = font
    ctx.fillStyle = style.ink
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(`${i + 1}. ${labels.get(emoji) ?? ''}`, cx, cy + cellH * 0.3, cellW * 0.9)
    ctx.restore()
  })
}