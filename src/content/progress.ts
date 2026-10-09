/**
 * 学习进度：记住每门课学到第几步、看过哪些步骤、小问答答得怎么样。
 * 存在 localStorage，换设备不保留也能正常使用。
 */

const KEY = 'penelope:progress:v2'

export interface CourseProgress {
  /** 上次看到的步骤下标 */
  lastStep: number
  /** 已经看过的步骤 id */
  read: string[]
  /** 小问答作答：步骤 id → 选中的选项下标 */
  quiz: Record<string, number>
}

type ProgressMap = Record<string, CourseProgress>

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

export function getProgress(courseId: string): CourseProgress {
  const found = readAll()[courseId]
  return {
    lastStep: found?.lastStep ?? 0,
    read: found?.read ?? [],
    quiz: found?.quiz ?? {}
  }
}

export function markRead(courseId: string, stepId: string, stepIndex: number): void {
  const map = readAll()
  const cur = map[courseId] ?? { lastStep: 0, read: [], quiz: {} }
  map[courseId] = {
    lastStep: stepIndex,
    read: cur.read.includes(stepId) ? cur.read : [...cur.read, stepId],
    quiz: cur.quiz
  }
  writeAll(map)
}

export function markQuiz(courseId: string, stepId: string, choice: number): void {
  const map = readAll()
  const cur = map[courseId] ?? { lastStep: 0, read: [], quiz: {} }
  map[courseId] = { ...cur, quiz: { ...cur.quiz, [stepId]: choice } }
  writeAll(map)
}

export function resetProgress(): void {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* 忽略 */
  }
}
