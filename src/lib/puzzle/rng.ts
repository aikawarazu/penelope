export type Rng = () => number

/**
 * mulberry32：小巧、快速、可复现的 32 位伪随机数发生器。
 * 同一个 seed 必然产出同一串随机数 —— 题目可凭种子完美复现。
 */
export function mulberry32(seed: number): Rng {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** 随机种子（1 ~ 999999） */
export function randomSeed(): number {
  return 1 + Math.floor(Math.random() * 999999)
}

/** [0, n) 内的随机整数 */
export function randInt(rng: Rng, n: number): number {
  if (n <= 0) return 0
  return Math.min(n - 1, Math.floor(rng() * n))
}

/** Fisher-Yates 洗牌（原地） */
export function shuffle<T>(items: T[], rng: Rng): T[] {
  for (let i = items.length - 1; i > 0; i--) {
    const j = randInt(rng, i + 1)
    const tmp = items[i]
    items[i] = items[j]
    items[j] = tmp
  }
  return items
}

/** 从数组里随机取 n 个不重复元素 */
export function pick<T>(items: readonly T[], n: number, rng: Rng): T[] {
  const pool = items.slice()
  shuffle(pool, rng)
  return pool.slice(0, Math.min(n, pool.length))
}