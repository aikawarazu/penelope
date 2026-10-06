import type { PictureItem } from '@/lib/puzzle/pictures'

export type GridSize = 3 | 4 | 5

export const GRID_SIZES: readonly GridSize[] = [3, 4, 5]

export interface BingoCard {
  /** 卡片序号，从 1 开始 */
  index: number
  size: GridSize
  /** 长度 size*size，null 表示中心自由格 */
  cells: (PictureItem | null)[]
  freeIndex: number | null
}

export interface BingoDeck {
  title: string
  setId: string
  setLabel: string
  size: GridSize
  freeSpace: boolean
  cards: BingoCard[]
  /** 呼叫清单：所有出现过的图形打乱排序，供主持人抽读 */
  caller: PictureItem[]
  seed: number
}

export interface BingoOptions {
  title: string
  setId: string
  size: GridSize
  freeSpace: boolean
  /** 卡片张数，1 ~ 30 */
  count: number
  seed: number
}

export interface CardStyle {
  title: string
  showTitle: boolean
  accent: string
  ink: string
  muted: string
}

export interface CardState {
  /** 已被标记（找到）的格子下标 */
  marked: Set<number>
  /** 抽中的图形：命中的格子描高亮边 */
  highlightEmoji: string | null
}