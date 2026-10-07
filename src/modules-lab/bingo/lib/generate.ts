import { getPictureSet } from '@/lib/puzzle/pictures'
import type { PictureItem } from '@/lib/puzzle/pictures'
import { mulberry32, randInt, shuffle } from '@/lib/puzzle/rng'
import { GRID_SIZES, type BingoCard, type BingoDeck, type BingoOptions, type GridSize } from './types'

export const MAX_CARDS = 30

export function normalizeSize(v: number): GridSize {
  return GRID_SIZES.includes(v as GridSize) ? (v as GridSize) : 5
}

function signature(cells: (string | null)[]): string {
  return cells.join('|')
}

/**
 * 生成一组互不相同的宾果卡。
 * 卡片数受图库容量限制时会自动去重重试，保证「每张都不同」。
 */
export function generateDeck(options: BingoOptions): BingoDeck {
  const size = normalizeSize(options.size)
  const freeSpace = options.freeSpace && size % 2 === 1
  const total = size * size
  const needed = total - (freeSpace ? 1 : 0)
  const target = Math.max(1, Math.min(MAX_CARDS, Math.round(options.count)))

  const set = getPictureSet(options.setId)
  const rng = mulberry32(options.seed || 1)

  const cards: BingoCard[] = []
  const seen = new Set<string>()
  const freeIndex = freeSpace ? Math.floor(total / 2) : null

  let guard = 0
  while (cards.length < target && guard < target * 60) {
    guard++
    const chosen = shuffle(set.items.slice(), rng).slice(0, needed)
    const cells: (PictureItem | null)[] = []
    let k = 0
    for (let i = 0; i < total; i++) {
      if (i === freeIndex) {
        cells.push(null)
        continue
      }
      // 图库不够时循环取用，保证格子填满
      cells.push(chosen[k % chosen.length])
      k++
    }
    const sig = signature(cells.map((c) => (c ? c.emoji : '★')))
    if (seen.has(sig)) continue
    seen.add(sig)
    cards.push({ index: cards.length + 1, size, cells, freeIndex })
  }

  const used = new Map<string, (typeof set.items)[number]>()
  for (const card of cards) {
    for (const cell of card.cells) {
      if (cell) used.set(cell.emoji, cell)
    }
  }
  const caller = shuffle(Array.from(used.values()), rng)

  return {
    title: options.title,
    setId: set.id,
    setLabel: set.label,
    size,
    freeSpace,
    cards,
    caller,
    seed: options.seed
  }
}

/** 随机抽一个图形（尽量避开刚抽过的） */
export function drawCaller(deck: BingoDeck, lastEmoji: string | null, rand: () => number): string | null {
  if (!deck.caller.length) return null
  const pool = deck.caller.filter((c) => c.emoji !== lastEmoji)
  const list = pool.length ? pool : deck.caller
  return list[randInt(rand, list.length)].emoji
}

/** 该图形在指定卡片里的格子下标 */
export function cellsWithEmoji(card: BingoCard, emoji: string): number[] {
  const out: number[] = []
  card.cells.forEach((c, i) => {
    if (c && c.emoji === emoji) out.push(i)
  })
  return out
}