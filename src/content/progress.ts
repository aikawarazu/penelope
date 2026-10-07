/**
 * 阅读进度：记住每个专辑看到第几张、哪些卡片看过。
 * 存在 localStorage，换设备不保留也可正常使用。
 */

const KEY = 'penelope:progress:v1'

export interface AlbumProgress {
  /** 上次看到的卡片下标 */
  lastCard: number
  /** 已经看过的卡片 id */
  read: string[]
}

type ProgressMap = Record<string, AlbumProgress>

function readAll(): ProgressMap {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as ProgressMap
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function writeAll(map: ProgressMap): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(map))
  } catch {
    // 隐私模式下写不进去，忽略即可
  }
}

export function getProgress(albumId: string): AlbumProgress {
  return readAll()[albumId] ?? { lastCard: 0, read: [] }
}

export function markRead(albumId: string, cardId: string, cardIndex: number): void {
  const map = readAll()
  const cur = map[albumId] ?? { lastCard: 0, read: [] }
  map[albumId] = {
    lastCard: cardIndex,
    read: cur.read.includes(cardId) ? cur.read : [...cur.read, cardId]
  }
  writeAll(map)
}

export function resetProgress(): void {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* 忽略 */
  }
}
