import { mulberry32, randInt, shuffle, type Rng } from '@/lib/puzzle/rng'

export type DifficultyId = 'easy' | 'medium' | 'hard' | 'expert'

export interface SudokuSize {
  n: number
  /** 每宫的行数 */
  bh: number
  /** 每宫的列数 */
  bw: number
  label: string
  hint: string
}

export const SUDOKU_SIZES: readonly SudokuSize[] = [
  { n: 4, bh: 2, bw: 2, label: '4×4', hint: '2×2 小宫 · 幼儿首选' },
  { n: 6, bh: 2, bw: 3, label: '6×6', hint: '2 行 3 列的宫' },
  { n: 9, bh: 3, bw: 3, label: '9×9', hint: '标准数独' }
]

export interface DifficultyOption {
  id: DifficultyId
  label: string
  hint: string
  /** 各尺寸下的目标给定数 */
  clues: Record<number, number>
}

export const DIFFICULTIES: readonly DifficultyOption[] = [
  { id: 'easy', label: '简单', hint: '给的数字多', clues: { 4: 12, 6: 26, 9: 42 } },
  { id: 'medium', label: '中等', hint: '标准练习', clues: { 4: 10, 6: 22, 9: 34 } },
  { id: 'hard', label: '困难', hint: '要试几步', clues: { 4: 9, 6: 18, 9: 30 } },
  { id: 'expert', label: '专家', hint: ' Given 最少', clues: { 4: 8, 6: 16, 9: 26 } }
]

/* ------------------------------ 符号 ------------------------------ */

export interface SymbolSet {
  n: number
  emoji: string[]
  label: string[]
}

export const SYMBOL_SETS: readonly SymbolSet[] = [
  {
    n: 4,
    emoji: ['🍎', '🍌', '🍇', '🍓'],
    label: ['苹果', '香蕉', '葡萄', '草莓']
  },
  {
    n: 6,
    emoji: ['🍎', '🍌', '🍇', '🍓', '🍊', '🍐'],
    label: ['苹果', '香蕉', '葡萄', '草莓', '橘子', '梨']
  },
  {
    n: 9,
    emoji: ['🍎', '🍌', '🍇', '🍓', '🍊', '🍐', '🍑', '🥝', '🍍'],
    label: ['苹果', '香蕉', '葡萄', '草莓', '橘子', '梨', '桃子', '猕猴桃', '菠萝']
  }
]

export function symbolsFor(n: number): SymbolSet {
  return SYMBOL_SETS.find((s) => s.n === n) ?? SYMBOL_SETS[0]
}

/* ------------------------------ 求解 ------------------------------ */

function popcount(v: number): number {
  let c = 0
  while (v) {
    v &= v - 1
    c++
  }
  return c
}

function boxIndex(r: number, c: number, bh: number, bw: number, n: number): number {
  return Math.floor(r / bh) * (n / bw) + Math.floor(c / bw)
}

/**
 * 数解的个数（最多数到 limit 个就停）。
 * 位运算 + 最少候选数优先（MRV），9×9 也就毫秒级。
 * 传入的 grid 不会被修改。
 */
export function countSolutions(
  input: Int8Array,
  n: number,
  bh: number,
  bw: number,
  limit = 2
): number {
  const grid = Int8Array.from(input)
  const full = (1 << n) - 1
  const rowMask = new Int32Array(n)
  const colMask = new Int32Array(n)
  const boxMask = new Int32Array(n)

  for (let i = 0; i < n * n; i++) {
    const v = grid[i]
    if (!v) continue
    const r = (i / n) | 0
    const c = i % n
    const b = boxIndex(r, c, bh, bw, n)
    const bit = 1 << (v - 1)
    if ((rowMask[r] & bit) !== 0 || (colMask[c] & bit) !== 0 || (boxMask[b] & bit) !== 0) return 0
    rowMask[r] |= bit
    colMask[c] |= bit
    boxMask[b] |= bit
  }

  let count = 0

  const step = (): boolean => {
    let best = -1
    let bestMask = 0
    let bestCount = n + 1
    for (let i = 0; i < n * n; i++) {
      if (grid[i]) continue
      const r = (i / n) | 0
      const c = i % n
      const b = boxIndex(r, c, bh, bw, n)
      const avail = (~(rowMask[r] | colMask[c] | boxMask[b])) & full
      const cnt = popcount(avail)
      if (cnt === 0) return false
      if (cnt < bestCount) {
        bestCount = cnt
        best = i
        bestMask = avail
        if (cnt === 1) break
      }
    }
    if (best < 0) {
      count++
      return count >= limit
    }

    const r = (best / n) | 0
    const c = best % n
    const b = boxIndex(r, c, bh, bw, n)
    let m = bestMask
    while (m) {
      const bit = m & -m
      m ^= bit
      rowMask[r] |= bit
      colMask[c] |= bit
      boxMask[b] |= bit
      grid[best] = 31 - Math.clz32(bit) + 1
      if (step()) return true
      grid[best] = 0
      rowMask[r] ^= bit
      colMask[c] ^= bit
      boxMask[b] ^= bit
    }
    return false
  }

  step()
  return count
}

/** 求一个解，无解返回 null */
export function solveSudoku(
  input: Int8Array,
  n: number,
  bh: number,
  bw: number
): Int8Array | null {
  const grid = Int8Array.from(input)
  const full = (1 << n) - 1
  const rowMask = new Int32Array(n)
  const colMask = new Int32Array(n)
  const boxMask = new Int32Array(n)

  for (let i = 0; i < n * n; i++) {
    const v = grid[i]
    if (!v) continue
    const r = (i / n) | 0
    const c = i % n
    const b = boxIndex(r, c, bh, bw, n)
    const bit = 1 << (v - 1)
    if ((rowMask[r] & bit) !== 0 || (colMask[c] & bit) !== 0 || (boxMask[b] & bit) !== 0) return null
    rowMask[r] |= bit
    colMask[c] |= bit
    boxMask[b] |= bit
  }

  const step = (): boolean => {
    let best = -1
    let bestMask = 0
    let bestCount = n + 1
    for (let i = 0; i < n * n; i++) {
      if (grid[i]) continue
      const r = (i / n) | 0
      const c = i % n
      const b = boxIndex(r, c, bh, bw, n)
      const avail = (~(rowMask[r] | colMask[c] | boxMask[b])) & full
      const cnt = popcount(avail)
      if (cnt === 0) return false
      if (cnt < bestCount) {
        bestCount = cnt
        best = i
        bestMask = avail
        if (cnt === 1) break
      }
    }
    if (best < 0) return true

    const r = (best / n) | 0
    const c = best % n
    const b = boxIndex(r, c, bh, bw, n)
    let m = bestMask
    while (m) {
      const bit = m & -m
      m ^= bit
      rowMask[r] |= bit
      colMask[c] |= bit
      boxMask[b] |= bit
      grid[best] = 31 - Math.clz32(bit) + 1
      if (step()) return true
      grid[best] = 0
      rowMask[r] ^= bit
      colMask[c] ^= bit
      boxMask[b] ^= bit
    }
    return false
  }

  return step() ? grid : null
}

/* ------------------------------ 生成 ------------------------------ */

function baseValue(r: number, c: number, bh: number, bw: number, n: number): number {
  return ((r % bh) * bw + Math.floor(r / bh) + c) % n
}

function shuffleGroups<T>(items: T[], groupSize: number, rng: Rng): T[] {
  const groups: T[][] = []
  for (let i = 0; i < items.length; i += groupSize) groups.push(shuffle(items.slice(i, i + groupSize), rng))
  return shuffle(groups, rng).flat()
}

/** 随机完整解：从标准拉丁方出发，打乱数字、行、列、宫 */
export function makeSolution(n: number, bh: number, bw: number, rng: Rng): Int8Array {
  const digitMap = shuffle(
    Array.from({ length: n }, (_, i) => i),
    rng
  )
  const rows = shuffleGroups(
    Array.from({ length: n }, (_, i) => i),
    bh,
    rng
  )
  const cols = shuffleGroups(
    Array.from({ length: n }, (_, i) => i),
    bw,
    rng
  )

  const grid = new Int8Array(n * n)
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      grid[r * n + c] = digitMap[baseValue(rows[r], cols[c], bh, bw, n)] + 1
    }
  }
  return grid
}

export interface GeneratedSudoku {
  puzzle: Int8Array
  solution: Int8Array
  clues: number
  seed: number
}

/**
 * 挖洞生成题目：每挖一格都验证「解仍然唯一」，
 * 所以产出的题目保证有且仅有一个解。
 */
export function generateSudoku(
  n: number,
  bh: number,
  bw: number,
  targetClues: number,
  seed: number
): GeneratedSudoku {
  const rng = mulberry32(seed || 1)
  const solution = makeSolution(n, bh, bw, rng)
  // 先放完整解，再逐格挖空；每挖一格都验证「解仍然唯一」
  const puzzle = Int8Array.from(solution)
  const order = shuffle(
    Array.from({ length: n * n }, (_, i) => i),
    rng
  )

  let clues = n * n
  for (const idx of order) {
    if (clues <= targetClues) break
    puzzle[idx] = 0
    if (countSolutions(puzzle, n, bh, bw, 2) === 1) {
      clues--
    } else {
      puzzle[idx] = solution[idx]
    }
  }

  return { puzzle, solution, clues, seed }
}

/** 玩家当前盘面是否与答案一致 */
export function isSolvedSudoku(player: Int8Array, solution: Int8Array): boolean {
  for (let i = 0; i < solution.length; i++) {
    if (player[i] !== solution[i]) return false
  }
  return true
}

/** 找出与同行 / 同列 / 同宫重复的格子下标 */
export function conflictsOf(grid: Int8Array, n: number, bh: number, bw: number): Set<number> {
  const bad = new Set<number>()

  const scan = (cells: number[]) => {
    const seen = new Map<number, number>()
    for (const i of cells) {
      const v = grid[i]
      if (!v) continue
      seen.set(v, (seen.get(v) ?? 0) + 1)
    }
    for (const [v, k] of seen) {
      if (k < 2) continue
      for (const i of cells) if (grid[i] === v) bad.add(i)
    }
  }

  for (let r = 0; r < n; r++) {
    scan(Array.from({ length: n }, (_, c) => r * n + c))
  }
  for (let c = 0; c < n; c++) {
    scan(Array.from({ length: n }, (_, r) => r * n + c))
  }
  for (let br = 0; br < n; br += bh) {
    for (let bc = 0; bc < n; bc += bw) {
      const cells: number[] = []
      for (let r = br; r < br + bh; r++) for (let c = bc; c < bc + bw; c++) cells.push(r * n + c)
      scan(cells)
    }
  }
  return bad
}

/** 随机取一个尚未填对的空格下标，-1 表示已填满 */
export function firstEmptyCell(grid: Int8Array, solution: Int8Array): number {
  const empties: number[] = []
  for (let i = 0; i < grid.length; i++) if (grid[i] !== solution[i]) empties.push(i)
  return empties.length ? empties[randInt(Math.random, empties.length)] : -1
}