import { getPictureSet } from '@/lib/puzzle/pictures'
import { mulberry32, pick, randInt, shuffle } from '@/lib/puzzle/rng'
import type { FindOptions, FindPuzzle, FindRun, FindSize } from './types'

/** 连线方向向量（行、列增量） */
const DIR_VECTORS = {
  h: { dr: 0, dc: 1 },
  v: { dr: 1, dc: 0 },
  d: { dr: 1, dc: 1 }
} as const

function placeRun(
  size: number,
  len: number,
  allowDiagonal: boolean,
  used: Set<number>,
  rand: () => number
): { cells: number[]; dir: FindRun['dir'] } | null {
  const kinds: FindRun['dir'][] = allowDiagonal ? ['h', 'v', 'd'] : ['h', 'v']
  // 先随机顺序，避免总是横排优先
  for (let attempt = 0; attempt < 40; attempt++) {
    const dir = kinds[randInt(rand, kinds.length)]
    const { dr, dc } = DIR_VECTORS[dir]
    const spanR = dr * (len - 1)
    const spanC = dc * (len - 1)
    const maxR = size - 1 - spanR
    const maxC = size - 1 - spanC
    if (maxR < 0 || maxC < 0) continue
    const r0 = randInt(rand, maxR + 1)
    const c0 = randInt(rand, maxC + 1)
    const cells: number[] = []
    let ok = true
    for (let i = 0; i < len; i++) {
      const idx = (r0 + dr * i) * size + (c0 + dc * i)
      if (used.has(idx)) {
        ok = false
        break
      }
      used.add(idx)
      cells.push(idx)
    }
    if (ok) return { cells, dir }
    // 回滚已占用的格子
    for (const idx of cells) used.delete(idx)
  }
  return null
}

/**
 * 生成「图形找找看」：把若干个目标图形藏进一整片干扰图形里，
 * 每个目标横向 / 竖向 / 斜向连成一串，玩家把它们整条找出来。
 */
export function generateFindPuzzle(options: FindOptions): FindPuzzle {
  const size = options.size as number
  const len = Math.max(2, Math.min(size, Math.round(options.runLength)))
  const set = getPictureSet(options.setId)
  const rng = mulberry32(options.seed || 1)

  const targetCount = Math.max(1, Math.min(set.items.length, Math.round(options.runCount)))
  const targets = pick(set.items, targetCount, rng)
  const targetEmojis = new Set(targets.map((t) => t.emoji))
  // 干扰项里排除目标图形，保证「找到的就是唯一的那一串」
  const distractors = set.items.filter((i) => !targetEmojis.has(i.emoji))

  const used = new Set<number>()
  const runs: FindRun[] = []
  for (const target of targets) {
    const placed = placeRun(size, len, options.allowDiagonal, used, rng)
    if (!placed) continue
    runs.push({ emoji: target.emoji, label: target.label, cells: placed.cells, dir: placed.dir })
  }

  const cells: string[] = new Array(size * size)
  for (const run of runs) for (const idx of run.cells) cells[idx] = run.emoji
  for (let i = 0; i < cells.length; i++) {
    if (cells[i] === undefined) cells[i] = distractors[randInt(rng, distractors.length)].emoji
  }

  return {
    size: options.size as FindSize,
    cells,
    runs,
    runLength: len,
    setId: set.id,
    setLabel: set.label,
    seed: options.seed
  }
}

/** 点击命中判定：返回一个尚未找到的连线序号 */
export function runAt(puzzle: FindPuzzle, index: number, found: Set<number>): number {
  for (let i = 0; i < puzzle.runs.length; i++) {
    if (found.has(i)) continue
    if (puzzle.runs[i].cells.includes(index)) return i
  }
  return -1
}

export function targetsOf(puzzle: FindPuzzle): { emoji: string; label: string }[] {
  return shuffle(puzzle.runs.map((r) => ({ emoji: r.emoji, label: r.label })), mulberry32(puzzle.seed + 7))
}