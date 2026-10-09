import { ALL_CATEGORY_ID, CATEGORIES, getCategory } from './categories'
import type { Category, Course, Step } from './types'

/**
 * 自动发现所有课程：扫描 src/content/courses/*.ts。
 * 新增 / 删除课程只需增删文件，这里与页面都不用改。
 */
const discovered = import.meta.glob<{ default: Course }>('./courses/*.ts', { eager: true })

function isValid(course: Course | undefined): course is Course {
  return Boolean(course && course.id && course.steps?.length && course.category)
}

export const courses: Course[] = Object.values(discovered)
  .map((mod) => mod?.default)
  .filter(isValid)
  .sort((a, b) => (a.order ?? 999) - (b.order ?? 999) || a.id.localeCompare(b.id))

/** 课程里出现过的分类（按分类表顺序），便于只展示有内容的分类 */
export const usedCategories: Category[] = CATEGORIES.filter((c) =>
  courses.some((a) => a.category === c.id)
)

export function coursesOf(categoryId: string): Course[] {
  if (!categoryId || categoryId === ALL_CATEGORY_ID) return courses
  return courses.filter((c) => c.category === categoryId)
}

export function getCourse(id: string): Course | undefined {
  return courses.find((c) => c.id === id)
}

export function courseCategory(course: Course): Category | undefined {
  return getCategory(course.category)
}

export function stepsOf(course: Course): Step[] {
  return course.steps
}

export function stepCount(course: Course): number {
  return course.steps.length
}

/** 课程里带小问答的步骤数 */
export function quizCount(course: Course): number {
  return course.steps.filter((s) => s.quiz).length
}

export const totalCourses = courses.length
export const totalSteps = courses.reduce((sum, c) => sum + c.steps.length, 0)
