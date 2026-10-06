/** 拼图外形轮廓与刀路几何（全部在 0~1 归一化坐标里描述） */

export type ShapeId = 'rect' | 'circle' | 'hexagon' | 'heart' | 'star' | 'cloud'

export interface ShapeOption {
  id: ShapeId
  label: string
}

export const SHAPES: readonly ShapeOption[] = [
  { id: 'rect', label: '方形' },
  { id: 'circle', label: '圆形' },
  { id: 'hexagon', label: '六边形' },
  { id: 'heart', label: '爱心' },
  { id: 'star', label: '星形' },
  { id: 'cloud', label: '云朵' }
]

function f(v: number): string {
  return String(Math.round(v * 10000) / 10000)
}

/** 榫头半径（相对格边长） */
const TAB_R = 0.16
const TAB_K = 0.8660254

/** 拼图整体外形轮廓 */
export function outlinePath(shape: ShapeId): string {
  switch (shape) {
    case 'circle': {
      const cx = 0.5
      const cy = 0.5
      const r = 0.5
      const k = 0.5523 * r
      return (
        `M${f(cx)} ${f(cy - r)}` +
        `C${f(cx + k)} ${f(cy - r)} ${f(cx + r)} ${f(cy - k)} ${f(cx + r)} ${f(cy)}` +
        `C${f(cx + r)} ${f(cy + k)} ${f(cx + k)} ${f(cy + r)} ${f(cx)} ${f(cy + r)}` +
        `C${f(cx - k)} ${f(cy + r)} ${f(cx - r)} ${f(cy + k)} ${f(cx - r)} ${f(cy)}` +
        `C${f(cx - r)} ${f(cy - k)} ${f(cx - k)} ${f(cy - r)} ${f(cx)} ${f(cy - r)}Z`
      )
    }
    case 'hexagon':
      return (
        `M${f(0.5)} 0L1 0.25L1 0.75L${f(0.5)} 1L0 0.75L0 0.25Z`
      )
    case 'heart':
      return (
        `M${f(0.5)} 0.96` +
        `C0.1 0.66 0 0.38 0 0.23` +
        `C0 0.08 0.12 0 0.25 0` +
        `C0.37 0 0.46 0.09 0.5 0.19` +
        `C0.54 0.09 0.63 0 0.75 0` +
        `C0.88 0 1 0.08 1 0.23` +
        `C1 0.38 0.9 0.66 ${f(0.5)} 0.96Z`
      )
    case 'star': {
      const cx = 0.5
      const cy = 0.52
      const outer = 0.5
      const inner = 0.2
      const pts: string[] = []
      for (let i = 0; i < 10; i++) {
        const rad = i % 2 === 0 ? outer : inner
        const ang = -Math.PI / 2 + (i * Math.PI) / 5
        pts.push(`${f(cx + rad * Math.cos(ang))} ${f(cy + rad * Math.sin(ang))}`)
      }
      return `M${pts.join('L')}Z`
    }
    case 'cloud':
      return (
        `M0.2 0.8` +
        `A0.17 0.17 0 0 1 0.17 0.5` +
        `A0.22 0.22 0 0 1 0.58 0.42` +
        `A0.18 0.18 0 0 1 0.84 0.58` +
        `A0.16 0.16 0 0 1 0.82 0.8Z`
      )
    default:
      return 'M0 0L1 0L1 1L0 1Z'
  }
}

/** 外形是否在四个角上留白（决定边角碎片是否整块切掉） */
export function shapeCoversCorner(shape: ShapeId, u: number, v: number): boolean {
  switch (shape) {
    case 'circle':
      return (u - 0.5) ** 2 + (v - 0.5) ** 2 <= 0.25
    case 'hexagon':
      return Math.abs(u - 0.5) <= 0.5 - Math.abs(v - 0.5) / 2 + 1e-9
    case 'heart':
      return v >= heartTop(u) - 1e-9
    case 'star': {
      const cx = 0.5
      const cy = 0.52
      const ang = Math.atan2(v - cy, u - cx)
      const k = ((ang + Math.PI / 2 + Math.PI) % (Math.PI * 2)) - Math.PI
      const seg = Math.floor(((k + Math.PI / 2) / (Math.PI / 5)) | 0)
      const rad = seg % 2 === 0 ? 0.5 : 0.2
      return Math.hypot(u - cx, v - cy) <= rad + 1e-9
    }
    case 'cloud':
      return (
        Math.hypot(u - 0.2, v - 0.63) <= 0.17 ||
        Math.hypot(u - 0.5, v - 0.42) <= 0.22 ||
        Math.hypot(u - 0.76, v - 0.58) <= 0.18 ||
        (v >= 0.8 && u >= 0.2 && u <= 0.82)
      )
    default:
      return true
  }
}

/** 心形上边界 y（用于裁切） */
function heartTop(u: number): number {
  if (u <= 0.25) {
    const t = u / 0.25
    return 0.23 * (1 - t) * (1 - t)
  }
  if (u >= 0.75) {
    const t = (1 - u) / 0.25
    return 0.23 * (1 - t) * (1 - t)
  }
  if (u < 0.5) {
    const t = (u - 0.25) / 0.25
    return 0.19 - 0.19 * t
  }
  const t = (0.75 - u) / 0.25
  return 0.19 - 0.19 * t
}

/** 一条边：直线，或带半圆榫头的曲线（榫头朝行进方向左侧凸出） */
function edge(x0: number, y0: number, x1: number, y1: number, tab: boolean): string {
  if (!tab) return `L${f(x1)} ${f(y1)}`
  const dx = x1 - x0
  const dy = y1 - y0
  const len = Math.hypot(dx, dy) || 1
  const ux = dx / len
  const uy = dy / len
  const nx = -uy
  const ny = ux
  const r = Math.min(TAB_R, len * 0.3)
  const mx = x0 + (ux * len) / 2
  const my = y0 + (uy * len) / 2
  const p1x = x0 + ux * (len / 2 - r)
  const p1y = y0 + uy * (len / 2 - r)
  const p2x = x0 + ux * (len / 2 + r)
  const p2y = y0 + uy * (len / 2 + r)
  const k = TAB_K * r
  const c1x = mx + nx * k - (ux * r) / 2
  const c1y = my + ny * k - (uy * r) / 2
  const c2x = mx + nx * k + (ux * r) / 2
  const c2y = my + ny * k + (uy * r) / 2
  return (
    `L${f(p1x)} ${f(p1y)}` +
    `C${f(c1x)} ${f(c1y)} ${f(c2x)} ${f(c2y)} ${f(p2x)} ${f(p2y)}` +
    `L${f(x1)} ${f(y1)}`
  )
}

/**
 * 单块碎片的刀路，坐标是「该碎片所在格子」的局部 0~1。
 * 顺时针走四条边，榫头统一向左凸 —— 相邻两块的边界曲线天然互补。
 */
export function piecePath(tabs: {
  top: boolean
  right: boolean
  bottom: boolean
  left: boolean
}): string {
  return (
    `M0 0` +
    edge(0, 0, 1, 0, tabs.top) +
    edge(1, 0, 1, 1, tabs.right) +
    edge(1, 1, 0, 1, tabs.bottom) +
    edge(0, 1, 0, 0, tabs.left) +
    'Z'
  )
}