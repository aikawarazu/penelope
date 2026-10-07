import { ALL_CATEGORY_ID, CATEGORIES, getCategory } from './categories'
import type { Album, Card, Category } from './types'

/**
 * 自动发现所有专辑：扫描 src/content/albums/*.ts。
 * 新增 / 删除专辑只需增删文件，这里与页面都不用改。
 */
const discovered = import.meta.glob<{ default: Album }>('./albums/*.ts', { eager: true })

function isValid(album: Album | undefined): album is Album {
  return Boolean(album && album.id && album.cards?.length && album.category)
}

export const albums: Album[] = Object.values(discovered)
  .map((mod) => mod?.default)
  .filter(isValid)
  .sort((a, b) => (a.order ?? 999) - (b.order ?? 999) || a.id.localeCompare(b.id))

/** 专辑里出现过的分类（按分类表顺序），便于只展示有内容的分类 */
export const usedCategories: Category[] = CATEGORIES.filter((c) =>
  albums.some((a) => a.category === c.id)
)

export function albumsOf(categoryId: string): Album[] {
  if (!categoryId || categoryId === ALL_CATEGORY_ID) return albums
  return albums.filter((a) => a.category === categoryId)
}

export function getAlbum(id: string): Album | undefined {
  return albums.find((a) => a.id === id)
}

export function albumCategory(album: Album): Category | undefined {
  return getCategory(album.category)
}

export function cardsOf(album: Album): Card[] {
  return album.cards
}

export function cardCount(album: Album): number {
  return album.cards.length
}

export const totalAlbums = albums.length
export const totalCards = albums.reduce((sum, a) => sum + a.cards.length, 0)
