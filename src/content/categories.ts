import type { Category } from './types'

/**
 * 分类表。新增分类只需在这里加一项，
 * 然后把专辑的 category 指向它的 id 即可。
 */
export const CATEGORIES: readonly Category[] = [
  { id: 'food', label: '食物', emoji: '🥛', accent: '#22b8a6' },
  { id: 'nature', label: '自然', emoji: '🌿', accent: '#4caf7d' },
  { id: 'weather', label: '天气', emoji: '☁️', accent: '#3fa7ff' },
  { id: 'animals', label: '动物', emoji: '🐾', accent: '#ff8f6b' },
  { id: 'body', label: '身体', emoji: '🦷', accent: '#f5a524' }
]

export const ALL_CATEGORY_ID = 'all'

export function getCategory(id: string): Category | undefined {
  return CATEGORIES.find((c) => c.id === id)
}

export function categoryLabel(id: string): string {
  return getCategory(id)?.label ?? '未分类'
}
