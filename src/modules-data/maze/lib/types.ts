/** 墙位掩码：每个格子用 4 个 bit 记录四面墙是否存在 */
export const N = 1
export const E = 2
export const S = 4
export const W = 8

export interface Dir {
  /** 当前格子这面墙对应的 bit */
  bit: number
  /** 相邻格子对应方向（反向）的 bit */
  opp: number
  dr: number
  dc: number
}

/** 顺序固定：0=N 1=E 2=S 3=W，generate/geometry 均依赖此顺序 */
export const DIRS: readonly Dir[] = [
  { bit: N, opp: S, dr: -1, dc: 0 },
  { bit: E, opp: W, dr: 0, dc: 1 },
  { bit: S, opp: N, dr: 1, dc: 0 },
  { bit: W, opp: E, dr: 0, dc: -1 }
]

export interface Cell {
  r: number
  c: number
}

export interface Maze {
  cols: number
  rows: number
  /** 长度 cols*rows，每个元素为四面墙的 bit 掩码，默认 15（四面全封） */
  walls: Uint8Array
  start: Cell
  end: Cell
}

/* ------------------------------ 算法 ------------------------------ */

export type AlgorithmId = 'backtracker' | 'prim' | 'kruskal'

export interface AlgorithmOption {
  id: AlgorithmId
  label: string
  hint: string
}

export const ALGORITHMS: readonly AlgorithmOption[] = [
  { id: 'backtracker', label: '回溯法', hint: '走廊长而曲折' },
  { id: 'prim', label: 'Prim', hint: '大量短小死角' },
  { id: 'kruskal', label: 'Kruskal', hint: '分支均匀平衡' }
]

/* ------------------------------ 难度 ------------------------------ */

export type DifficultyId = 'kids' | 'easy' | 'medium' | 'hard' | 'impossible'

export interface DifficultyPreset {
  id: DifficultyId
  label: string
  hint: string
  cols: number
  rows: number
  /** 编织率：0 = 保留全部死角，1 = 死角全部打通成环路 */
  braid: number
  /** 墙线粗细档位 1~10 */
  stroke: number
  algorithm: AlgorithmId
}

export const DIFFICULTIES: readonly DifficultyPreset[] = [
  { id: 'kids', label: '幼儿', hint: '10×10 · 宽敞少死角', cols: 10, rows: 10, braid: 0.9, stroke: 8, algorithm: 'backtracker' },
  { id: 'easy', label: '简单', hint: '15×15 · 岔路不多', cols: 15, rows: 15, braid: 0.6, stroke: 7, algorithm: 'backtracker' },
  { id: 'medium', label: '中等', hint: '20×20 · 标准难度', cols: 20, rows: 20, braid: 0.3, stroke: 5, algorithm: 'backtracker' },
  { id: 'hard', label: '困难', hint: '30×30 · 长路绕弯', cols: 30, rows: 30, braid: 0.12, stroke: 4, algorithm: 'backtracker' },
  { id: 'impossible', label: '极难', hint: '40×40 · 死角密集', cols: 40, rows: 40, braid: 0, stroke: 3, algorithm: 'prim' }
]

/* ---------------------------- 起终点布位 ---------------------------- */

export type PlacementId = 'corners' | 'edges' | 'center' | 'random'

export interface PlacementOption {
  id: PlacementId
  label: string
  hint: string
}

export const PLACEMENTS: readonly PlacementOption[] = [
  { id: 'corners', label: '对角', hint: '左上进 · 右下出' },
  { id: 'edges', label: '边缘', hint: '随机边进 · 最远边出' },
  { id: 'center', label: '中心', hint: '左上角进 · 正中心出' },
  { id: 'random', label: '随机', hint: '随机进 · 最远处出' }
]

/* ------------------------------ 配色 ------------------------------ */

export type PaletteId = string

export interface Palette {
  id: PaletteId
  label: string
  wall: string
  bg: string
  solution: string
  start: string
  end: string
  /** 在线玩时那颗小球的配色 */
  ball: string
}

export const PALETTES: readonly Palette[] = [
  { id: 'classic', label: '经典黑白', wall: '#111111', bg: '#ffffff', solution: '#e11d48', start: '#16a34a', end: '#dc2626', ball: '#3b82f6' },
  { id: 'ocean', label: '海洋', wall: '#1d4ed8', bg: '#eff6ff', solution: '#f97316', start: '#0ea5e9', end: '#1d4ed8', ball: '#f97316' },
  { id: 'forest', label: '森林', wall: '#166534', bg: '#f0fdf4', solution: '#f59e0b', start: '#22c55e', end: '#15803d', ball: '#f59e0b' },
  { id: 'sunset', label: '暖阳', wall: '#b45309', bg: '#fffbeb', solution: '#2563eb', start: '#f59e0b', end: '#b45309', ball: '#2563eb' },
  { id: 'violet', label: '紫罗兰', wall: '#6d28d9', bg: '#f5f3ff', solution: '#f43f5e', start: '#8b5cf6', end: '#6d28d9', ball: '#f43f5e' },
  { id: 'slate', label: '石板', wall: '#334155', bg: '#f8fafc', solution: '#0ea5e9', start: '#64748b', end: '#0f172a', ball: '#0ea5e9' }
]

/* ------------------------------ 纸张 ------------------------------ */

// 纸张与方向枚举已抽到公共库，这里转出以保持模块内引用路径不变
export {
  PAPERS,
  getPaper,
  type PaperId,
  type OrientationId
} from '@/lib/puzzle/paper'

/* ------------------------------ 尺寸 ------------------------------ */

export const MIN_SIZE = 5
export const MAX_SIZE = 200

export function clampSize(v: number): number {
  if (!Number.isFinite(v)) return MIN_SIZE
  return Math.min(MAX_SIZE, Math.max(MIN_SIZE, Math.round(v)))
}
