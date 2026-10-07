import { drawEmoji, type Ctx } from '@/lib/puzzle/canvas2d'

/**
 * 拼图图案。
 * 优先用「画出来的」图案（纯矢量，不依赖系统 emoji 字体，任何设备都一样），
 * 也保留几个 emoji 图案。新增图案在这里加一项即可。
 */
export type ArtKind = 'drawn' | 'emoji'

export interface ArtOption {
  id: string
  label: string
  kind: ArtKind
  /** drawn 时是绘制类型；emoji 时是字符 */
  value: string
}

export const ARTS: readonly ArtOption[] = [
  { id: 'rainbow', label: '彩虹', kind: 'drawn', value: 'rainbow' },
  { id: 'house', label: '小房子', kind: 'drawn', value: 'house' },
  { id: 'balloon', label: '热气球', kind: 'drawn', value: 'balloon' },
  { id: 'cat', label: '小猫', kind: 'emoji', value: '🐱' },
  { id: 'rocket', label: '火箭', kind: 'emoji', value: '🚀' },
  { id: 'sunflower', label: '向日葵', kind: 'emoji', value: '🌻' },
  { id: 'butterfly', label: '蝴蝶', kind: 'emoji', value: '🦋' },
  { id: 'watermelon', label: '西瓜', kind: 'emoji', value: '🍉' }
]

export function artById(id: string): ArtOption {
  return ARTS.find((a) => a.id === id) ?? ARTS[0]
}

/** 在 (cx, cy) 处画一幅 size×size 的图案 */
export function drawSpecArt(
  ctx: Ctx,
  art: string,
  kind: ArtKind,
  cx: number,
  cy: number,
  size: number
): void {
  if (kind === 'emoji') {
    drawEmoji(ctx, art, cx, cy, size)
    return
  }
  drawVectorArt(ctx, art, cx, cy, size)
}

function drawVectorArt(ctx: Ctx, kind: string, cx: number, cy: number, s: number): void {
  if (kind === 'rainbow') {
    const colors = ['#ef4444', '#f59e0b', '#facc15', '#22c55e', '#3b82f6', '#8b5cf6']
    ctx.lineCap = 'butt'
    ctx.lineWidth = s * 0.078
    colors.forEach((color, i) => {
      ctx.strokeStyle = color
      ctx.beginPath()
      ctx.arc(cx, cy + s * 0.2, s * 0.45 - i * s * 0.078, Math.PI, 0)
      ctx.stroke()
    })
    ctx.fillStyle = '#dbeafe'
    const clouds: [number, number, number][] = [
      [-0.33, 0.3, 0.13],
      [0, 0.24, 0.17],
      [0.31, 0.3, 0.13]
    ]
    for (const [dx, dy, r] of clouds) {
      ctx.beginPath()
      ctx.arc(cx + dx * s, cy + dy * s, r * s, 0, Math.PI * 2)
      ctx.fill()
    }
    return
  }

  if (kind === 'house') {
    ctx.fillStyle = '#8ed9ae'
    ctx.fillRect(cx - s * 0.5, cy + s * 0.26, s, s * 0.24)
    ctx.fillStyle = '#fff7ed'
    ctx.fillRect(cx - s * 0.26, cy - s * 0.06, s * 0.52, s * 0.32)
    ctx.fillStyle = '#ef4444'
    ctx.beginPath()
    ctx.moveTo(cx - s * 0.33, cy - s * 0.06)
    ctx.lineTo(cx, cy - s * 0.35)
    ctx.lineTo(cx + s * 0.33, cy - s * 0.06)
    ctx.closePath()
    ctx.fill()
    ctx.fillStyle = '#c98f5e'
    ctx.fillRect(cx - s * 0.07, cy + s * 0.1, s * 0.14, s * 0.16)
    ctx.fillStyle = '#5aa9e6'
    ctx.fillRect(cx - s * 0.22, cy + s * 0.02, s * 0.1, s * 0.1)
    ctx.fillRect(cx + s * 0.12, cy + s * 0.02, s * 0.1, s * 0.1)
    ctx.fillStyle = '#ffd166'
    ctx.beginPath()
    ctx.arc(cx + s * 0.33, cy - s * 0.3, s * 0.075, 0, Math.PI * 2)
    ctx.fill()
    return
  }

  if (kind === 'balloon') {
    ctx.fillStyle = '#7a5b1e'
    ctx.strokeStyle = '#7a5b1e'
    ctx.lineWidth = s * 0.018
    ctx.beginPath()
    ctx.moveTo(cx - s * 0.09, cy + s * 0.2)
    ctx.lineTo(cx - s * 0.06, cy + s * 0.32)
    ctx.moveTo(cx + s * 0.09, cy + s * 0.2)
    ctx.lineTo(cx + s * 0.06, cy + s * 0.32)
    ctx.stroke()
    ctx.fillStyle = '#c98f5e'
    ctx.fillRect(cx - s * 0.09, cy + s * 0.3, s * 0.18, s * 0.12)
    ctx.fillStyle = '#ef4444'
    ctx.beginPath()
    ctx.ellipse(cx, cy - s * 0.09, s * 0.27, s * 0.32, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#fbbf24'
    ctx.beginPath()
    ctx.ellipse(cx, cy - s * 0.09, s * 0.1, s * 0.32, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#fca5a5'
    ctx.beginPath()
    ctx.ellipse(cx - s * 0.185, cy - s * 0.09, s * 0.055, s * 0.315, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.ellipse(cx + s * 0.185, cy - s * 0.09, s * 0.055, s * 0.315, 0, 0, Math.PI * 2)
    ctx.fill()
  }
}
