import { PATTERNS, patternById, patternToGrid } from './patterns'

export interface NonogramPuzzle {
  cols: number
  rows: number
  /** 答案：true = 需要涂满 */
  filled: boolean[]
  rowClues: number[][]
  colClues: number[][]
  /** 图案来源：内置图案 id，或 'custom' */
  patternId: string
  patternLabel: string
  seed: number
}

/** 由一行/一列的涂色状态算出线索，例如 [1,1,1,1,0,1] → [4, 1] */
export function cluesOf(line: boolean[]): number[] {
  const out: number[] = []
  let run = 0
  for (const v of line) {
    if (v) run++
    else if (run > 0) {
      out.push(run)
      run = 0
    }
  }
  if (run > 0) out.push(run)
  return out
}

export function buildPuzzle(
  cols: number,
  rows: number,
  filled: boolean[],
  patternLabel: string,
  patternId: string,
  seed: number
): NonogramPuzzle {
  const rowClues: number[][] = []
  for (let r = 0; r < rows; r++) {
    const line: boolean[] = []
    for (let c = 0; c < cols; c++) line.push(filled[r * cols + c])
    rowClues.push(cluesOf(line))
  }
  const colClues: number[][] = []
  for (let c = 0; c < cols; c++) {
    const line: boolean[] = []
    for (let r = 0; r < rows; r++) line.push(filled[r * cols + c])
    colClues.push(cluesOf(line))
  }
  return { cols, rows, filled: filled.slice(), rowClues, colClues, patternId, patternLabel, seed }
}

/** 用内置图案生成一道题 */
export function generateFromPattern(patternId: string, seed: number): NonogramPuzzle {
  const pattern = patternById(patternId) ?? PATTERNS[0]
  const g = patternToGrid(pattern)
  return buildPuzzle(g.cols, g.rows, g.filled, pattern.label, pattern.id, seed)
}

export function emptyGrid(cols: number, rows: number): boolean[] {
  return new Array(cols * rows).fill(false)
}

/** 玩家当前涂色是否与答案完全一致 */
export function isSolved(puzzle: NonogramPuzzle, player: boolean[]): boolean {
  for (let i = 0; i < puzzle.filled.length; i++) {
    if (player[i] !== puzzle.filled[i]) return false
  }
  return true
}

/** 已正确涂出的格子数 */
export function progressOf(puzzle: NonogramPuzzle, player: boolean[]): { right: number; total: number } {
  let right = 0
  for (let i = 0; i < puzzle.filled.length; i++) {
    if (player[i] && puzzle.filled[i]) right++
  }
  return { right, total: puzzle.filled.filter(Boolean).length }
}