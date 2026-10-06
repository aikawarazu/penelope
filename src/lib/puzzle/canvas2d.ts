/** Canvas 2D 常用绘制辅助 */

export type Ctx = CanvasRenderingContext2D

/** 圆角矩形（不依赖 ctx.roundRect，兼容老浏览器） */
export function roundRectPath(ctx: Ctx, x: number, y: number, w: number, h: number, r: number): void {
  const radius = Math.max(0, Math.min(r, Math.min(w, h) / 2))
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.lineTo(x + w - radius, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius)
  ctx.lineTo(x + w, y + h - radius)
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h)
  ctx.lineTo(x + radius, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius)
  ctx.lineTo(x, y + radius)
  ctx.quadraticCurveTo(x, y, x + radius, y)
  ctx.closePath()
}

/** emoji 字体栈：各平台字体名不同，缺一个不影响显示 */
export const EMOJI_FONT =
  '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji","Twemoji Mozilla","Segoe UI Symbol",system-ui,sans-serif'

export function emojiFont(px: number, weight = 400): string {
  return `${weight} ${Math.max(1, Math.round(px))}px ${EMOJI_FONT}`
}

export function textFont(px: number, weight = 400): string {
  return `${weight} ${Math.max(1, Math.round(px))}px system-ui,-apple-system,"PingFang SC","Microsoft YaHei",sans-serif`
}

/** 在矩形内画居中 emoji */
export function drawEmoji(ctx: Ctx, emoji: string, cx: number, cy: number, size: number): void {
  ctx.save()
  ctx.font = emojiFont(size)
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(emoji, cx, cy)
  ctx.restore()
}

/** 在矩形内画居中文字，超宽自动缩字 */
export function drawText(
  ctx: Ctx,
  text: string,
  cx: number,
  cy: number,
  maxWidth: number,
  size: number,
  color: string,
  weight = 400
): void {
  ctx.save()
  ctx.fillStyle = color
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  let px = size
  ctx.font = textFont(px, weight)
  const measured = ctx.measureText(text).width
  if (measured > maxWidth && measured > 0) {
    px = Math.max(6, px * (maxWidth / measured))
    ctx.font = textFont(px, weight)
  }
  ctx.fillText(text, cx, cy)
  ctx.restore()
}

/** #rrggbb + alpha → rgba() */
export function withAlpha(hex: string, alpha: number): string {
  const m = /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(hex.trim())
  if (!m) return hex
  const r = parseInt(m[1], 16)
  const g = parseInt(m[2], 16)
  const b = parseInt(m[3], 16)
  return `rgba(${r},${g},${b},${alpha})`
}

/** 简易线性插值两个十六进制颜色 */
export function mixHex(a: string, b: string, t: number): string {
  const pa = /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(a.trim())
  const pb = /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(b.trim())
  if (!pa || !pb) return a
  const ch = (s: RegExpExecArray, i: number) => parseInt(s[i], 16)
  const out = [1, 2, 3].map((i) => Math.round(ch(pa, i) + (ch(pb, i) - ch(pa, i)) * t))
  return `#${out.map((v) => v.toString(16).padStart(2, '0')).join('')}`
}

/** 秒 → mm:ss */
export function formatClock(ms: number): string {
  const total = Math.floor(ms / 1000)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${String(s).padStart(2, '0')}`
}