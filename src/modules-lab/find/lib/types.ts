export type FindSize = 6 | 8 | 10 | 12

export const FIND_SIZES: readonly FindSize[] = [6, 8, 10, 12]

/** 横 / 竖 / 斜（↘ 与 ↗ 都算斜） */
export type FindDirection = 'h' | 'v' | 'd'

export interface FindRun {
  emoji: string
  label: string
  /** 连线经过的格子下标（按方向顺序） */
  cells: number[]
  dir: FindDirection
}

export interface FindPuzzle {
  size: FindSize
  /** 每格的图形（emoji） */
  cells: string[]
  runs: FindRun[]
  runLength: number
  setId: string
  setLabel: string
  seed: number
}

export interface FindOptions {
  size: FindSize
  runLength: number
  /** 连线数量 */
  runCount: number
  /** 是否允许斜向连线 */
  allowDiagonal: boolean
  setId: string
  seed: number
}

export interface FindDrawOptions {
  title: string
  showTitle: boolean
  showSolution: boolean
  /** 在线玩：已找到的连线序号 */
  foundRuns: Set<number>
  accent: string
  ink: string
  muted: string
}