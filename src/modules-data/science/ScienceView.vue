<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ALL_CATEGORY_ID, categoryLabel } from '@/content/categories'
import {
  coursesOf,
  getCourse,
  stepCount,
  totalCourses,
  totalSteps,
  usedCategories
} from '@/content/registry'
import { getProgress, markQuiz, markRead } from '@/content/progress'
import type { Course, Step } from '@/content/types'
import LessonPlayer from './LessonPlayer.vue'

const route = useRoute()
const router = useRouter()

const moduleId = computed(() => String(route.params.id ?? ''))

/** 子路由：/m/<module>/course/<courseId> —— 可以直接分享到某一门课 */
const courseId = computed(() => {
  const rest = String(route.params.rest ?? '')
  const matched = /^course\/([^/]+)/.exec(rest)
  return matched ? matched[1] : ''
})

const course = computed(() => (courseId.value ? getCourse(courseId.value) : undefined))

/* ----------------------------- 课程列表 ----------------------------- */

const category = ref<string>(ALL_CATEGORY_ID)
const chips = computed(() => [
  { id: ALL_CATEGORY_ID, label: '全部', emoji: '📚' },
  ...usedCategories.map((c) => ({ id: c.id, label: c.label, emoji: c.emoji }))
])
const visibleCourses = computed(() => coursesOf(category.value))

function progressOf(one: Course) {
  const p = getProgress(one.id)
  return { read: p.read.length, total: stepCount(one) }
}

function openCourse(id: string) {
  router.push(`/m/${moduleId.value}/course/${id}`)
}

function backToList() {
  router.push(`/m/${moduleId.value}`)
}

/* ------------------------------ 阅读器 ------------------------------ */

type Page =
  | { kind: 'intro' }
  | { kind: 'step'; step: Step; index: number }
  | { kind: 'summary' }

/** 一门课的页面序列：引言 → 每一步 → 小结 */
const pages = computed<Page[]>(() => {
  const c = course.value
  if (!c) return []
  const list: Page[] = []
  if (c.intro) list.push({ kind: 'intro' })
  c.steps.forEach((step, index) => list.push({ kind: 'step', step, index }))
  if (c.summary) list.push({ kind: 'summary' })
  return list
})

const pageIndex = ref(0)
const page = computed(() => pages.value[pageIndex.value])

const savedQuiz = computed(() => (course.value ? getProgress(course.value.id).quiz : {}))
const answered = ref<Record<string, number>>({})

const progress = computed(() => {
  const c = course.value
  if (!c) return { read: 0, total: 0 }
  return { read: getProgress(c.id).read.length, total: c.steps.length }
})

function go(delta: number) {
  if (!pages.value.length) return
  pageIndex.value = (pageIndex.value + delta + pages.value.length) % pages.value.length
}

function goTo(i: number) {
  if (i >= 0 && i < pages.value.length) pageIndex.value = i
}

// 进入课程时接着上次的位置
watch(
  course,
  (c) => {
    if (!c) return
    answered.value = { ...getProgress(c.id).quiz }
    const saved = getProgress(c.id)
    // 没学过的课从引言开始；学过的接着上次的步骤继续
    const stepIdx = pages.value.findIndex((p) => p.kind === 'step' && p.index === saved.lastStep)
    pageIndex.value = saved.read.length === 0 ? 0 : stepIdx >= 0 ? stepIdx : 0
  },
  { immediate: true }
)

// 每翻一页记一次进度
watch(
  [course, pageIndex],
  () => {
    const c = course.value
    const p = page.value
    if (!c || !p || p.kind !== 'step') return
    markRead(c.id, p.step.id, p.index)
  },
  { immediate: true }
)

function answer(stepId: string, choice: number) {
  const c = course.value
  if (!c) return
  answered.value = { ...answered.value, [stepId]: choice }
  markQuiz(c.id, stepId, choice)
}

function onKey(e: KeyboardEvent) {
  if (!course.value) return
  // 场景课有自己的播放器接管键盘（空格播放 / 左右跳步）
  if (course.value.kind === 'scene') return
  if (e.key === 'ArrowLeft') {
    e.preventDefault()
    go(-1)
  } else if (e.key === 'ArrowRight') {
    e.preventDefault()
    go(1)
  } else if (e.key === 'Escape') {
    backToList()
  }
}

onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <!-- 场景动画课：整节课交给播放器 -->
  <LessonPlayer v-if="course && course.kind === 'scene'" :course="course" />

  <!-- 阅读器 -->
  <div v-else-if="course" class="sci-reader">
    <button class="sci-back" @click="backToList">← 全部课程</button>

    <div class="sci-head">
      <span class="sci-cover">{{ course.cover }}</span>
      <div class="sci-meta">
        <h3>{{ course.title }}</h3>
        <p>{{ course.subtitle }}</p>
        <span class="sci-tag">{{ categoryLabel(course.category) }}</span>
        <span v-if="course.age" class="sci-tag">{{ course.age }}</span>
        <span v-if="course.kind === 'course'" class="sci-tag accent">分步讲解</span>
      </div>
    </div>

    <div class="sci-bar">
      <span
        class="sci-bar-fill"
        :style="{ width: Math.round(((pageIndex + 1) / Math.max(1, pages.length)) * 100) + '%' }"
      />
    </div>

    <!-- 引言 -->
    <div v-if="page?.kind === 'intro'" class="sci-page intro">
      <span class="sci-big">{{ course.cover }}</span>
      <p>{{ course.intro }}</p>
      <button class="sci-go" @click="go(1)">开始 →</button>
    </div>

    <!-- 步骤 -->
    <div v-else-if="page?.kind === 'step'" class="sci-page">
      <p class="sci-step-no">第 {{ page.index + 1 }} / {{ course.steps.length }} 步</p>
      <div class="sci-stage" v-html="page.step.svg" />
      <p v-if="page.step.caption" class="sci-caption">{{ page.step.caption }}</p>
      <h4 class="sci-title">{{ page.step.title }}</h4>
      <p class="sci-text">{{ page.step.text }}</p>

      <div v-if="page.step.quiz" class="sci-quiz">
        <p class="sci-quiz-q">🤔 {{ page.step.quiz.question }}</p>
        <button
          v-for="(opt, i) in page.step.quiz.options"
          :key="i"
          class="sci-opt"
          :class="{
            picked: answered[page.step.id] === i,
            right: answered[page.step.id] !== undefined && i === page.step.quiz.answer,
            wrong: answered[page.step.id] === i && i !== page.step.quiz.answer
          }"
          :disabled="answered[page.step.id] !== undefined"
          @click="answer(page.step.id, i)"
        >
          {{ opt }}
        </button>
        <p v-if="answered[page.step.id] === page.step.quiz.answer" class="sci-quiz-ok">
          {{ page.step.quiz.explain ?? '答对啦！' }}
        </p>
        <p v-else-if="answered[page.step.id] !== undefined" class="sci-quiz-no">
          再看看上面的图，答案就在里面哦
        </p>
      </div>
    </div>

    <!-- 小结 -->
    <div v-else-if="page?.kind === 'summary'" class="sci-page intro">
      <span class="sci-big">{{ course.cover }}</span>
      <p class="sci-summary">{{ course.summary }}</p>
      <button class="sci-go" @click="goTo(0)">再看一遍</button>
    </div>

    <div class="sci-controls">
      <button class="sci-nav" @click="go(-1)">← 上一页</button>
      <span class="sci-pager">{{ pageIndex + 1 }} / {{ pages.length }}</span>
      <button class="sci-nav" @click="go(1)">下一页 →</button>
    </div>

    <div class="sci-dots">
      <button
        v-for="(p, i) in pages"
        :key="i"
        class="sci-dot"
        :class="{ active: i === pageIndex }"
        :title="p.kind === 'step' ? p.step.title : p.kind === 'intro' ? '引言' : '小结'"
        @click="goTo(i)"
      />
    </div>

    <p class="sci-progress">这门课看过 {{ progress.read }} / {{ progress.total }} 步</p>
  </div>

  <!-- 课程列表 -->
  <div v-else class="sci-library">
    <div class="sci-summary">
      共 <b>{{ totalCourses }}</b> 门课 · <b>{{ totalSteps }}</b> 个步骤
    </div>

    <div class="sci-chips">
      <button
        v-for="c in chips"
        :key="c.id"
        class="sci-chip"
        :class="{ on: category === c.id }"
        @click="category = c.id"
      >
        <span>{{ c.emoji }}</span>{{ c.label }}
      </button>
    </div>

    <div class="sci-grid">
      <button
        v-for="c in visibleCourses"
        :key="c.id"
        class="sci-course"
        :style="{ borderColor: c.accent }"
        @click="openCourse(c.id)"
      >
        <span class="sci-course-cover" :style="{ background: c.accent + '1f' }">{{ c.cover }}</span>
        <span class="sci-course-title">{{ c.title }}</span>
        <span class="sci-course-sub">{{ c.subtitle }}</span>
        <span class="sci-course-foot">
          <span class="sci-tag" :style="{ color: c.accent, borderColor: c.accent + '55' }">
            {{ categoryLabel(c.category) }}
          </span>
          <span class="sci-course-count">{{ progressOf(c).read }}/{{ progressOf(c).total }} 步</span>
        </span>
      </button>
    </div>

    <p v-if="!visibleCourses.length" class="sci-empty">这个分类还没有课程，先看看别的吧～</p>
  </div>
</template>

<style scoped>
/* ---------- 列表 ---------- */
.sci-summary {
  font-size: 13px;
  color: var(--muted);
  margin-bottom: 12px;
}

.sci-summary b {
  color: var(--ink);
}

.sci-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}

.sci-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 8px 14px;
  border-radius: 999px;
  font-size: 14px;
  background: #fff;
  border: 2px solid #e6efea;
  color: var(--ink);
}

.sci-chip.on {
  background: color-mix(in srgb, var(--accent) 12%, #fff);
  border-color: var(--accent);
  color: var(--accent);
  font-weight: 600;
}

.sci-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(152px, 1fr));
  gap: 14px;
}

.sci-course {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  text-align: left;
  padding: 14px;
  border-radius: 18px;
  background: #fff;
  border: 2px solid #e6efea;
  box-shadow: 0 6px 18px rgba(76, 175, 125, 0.08);
  transition: transform 0.15s ease;
}

.sci-course:active {
  transform: scale(0.97);
}

.sci-course-cover {
  width: 100%;
  height: 74px;
  display: grid;
  place-items: center;
  border-radius: 14px;
  font-size: 34px;
  margin-bottom: 6px;
}

.sci-course-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--ink);
}

.sci-course-sub {
  font-size: 12px;
  color: var(--muted);
  line-height: 1.4;
}

.sci-course-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  width: 100%;
  margin-top: 6px;
}

.sci-tag {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 999px;
  border: 1px solid #d8e6de;
  color: var(--muted);
}

.sci-tag.accent {
  color: var(--accent);
  border-color: color-mix(in srgb, var(--accent) 45%, transparent);
  background: color-mix(in srgb, var(--accent) 10%, #fff);
}

.sci-course-count {
  font-size: 11px;
  color: var(--muted);
}

.sci-empty {
  color: var(--muted);
  font-size: 14px;
}

/* ---------- 阅读器 ---------- */
.sci-back {
  color: var(--accent);
  font-size: 14px;
  padding: 4px 0;
}

.sci-head {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 8px 0 10px;
}

.sci-cover {
  width: 56px;
  height: 56px;
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  font-size: 30px;
  border-radius: 16px;
  background: color-mix(in srgb, var(--accent) 12%, #fff);
}

.sci-meta h3 {
  margin: 0 0 3px;
  font-size: 18px;
}

.sci-meta p {
  margin: 0 0 5px;
  font-size: 13px;
  color: var(--muted);
}

.sci-meta .sci-tag {
  margin-right: 5px;
}

.sci-bar {
  height: 6px;
  border-radius: 999px;
  background: #eef4f1;
  overflow: hidden;
  margin-bottom: 14px;
}

.sci-bar-fill {
  display: block;
  height: 100%;
  background: var(--accent);
  border-radius: 999px;
  transition: width 0.2s ease;
}

.sci-page {
  text-align: left;
}

.sci-page.intro {
  text-align: center;
  padding: 10px 0 4px;
}

.sci-big {
  font-size: 56px;
  line-height: 1;
}

.sci-page.intro p {
  font-size: 15px;
  line-height: 1.8;
  color: var(--ink);
  margin: 14px auto 4px;
  max-width: 30em;
}

.sci-summary {
  font-size: 15px;
  line-height: 1.8;
}

.sci-go {
  margin-top: 14px;
  background: var(--accent);
  color: #fff;
  border-radius: 14px;
  padding: 11px 20px;
  font-size: 15px;
  font-weight: 600;
}

.sci-step-no {
  margin: 0 0 8px;
  font-size: 12px;
  color: var(--accent);
  font-weight: 600;
}

.sci-stage {
  background: var(--brand-soft);
  border-radius: 18px;
  padding: 12px;
}

.sci-stage :deep(svg) {
  width: 100%;
  height: auto;
  display: block;
}

.sci-caption {
  margin: 10px 0 0;
  font-size: 12px;
  color: var(--muted);
  background: #f6faf8;
  border-left: 3px solid color-mix(in srgb, var(--accent) 45%, transparent);
  padding: 7px 10px;
  border-radius: 0 10px 10px 0;
  line-height: 1.6;
}

.sci-title {
  margin: 16px 0 6px;
  font-size: 19px;
}

.sci-text {
  margin: 0;
  color: var(--ink);
  font-size: 15px;
  line-height: 1.8;
}

/* ---------- 小问答 ---------- */
.sci-quiz {
  margin-top: 16px;
  padding: 14px;
  border-radius: 16px;
  background: #fffdf5;
  border: 2px solid #fde68a;
}

.sci-quiz-q {
  margin: 0 0 10px;
  font-size: 14px;
  font-weight: 600;
}

.sci-opt {
  display: block;
  width: 100%;
  text-align: left;
  margin-bottom: 7px;
  padding: 10px 12px;
  border-radius: 12px;
  background: #fff;
  border: 2px solid #e6efea;
  font-size: 14px;
  color: var(--ink);
}

.sci-opt:disabled {
  cursor: default;
}

.sci-opt.right {
  background: #eafff2;
  border-color: #22c55e;
  color: #15803d;
  font-weight: 600;
}

.sci-opt.wrong {
  background: #fef2f2;
  border-color: #fca5a5;
  color: #b91c1c;
}

.sci-quiz-ok {
  margin: 8px 0 0;
  font-size: 13px;
  color: #15803d;
}

.sci-quiz-no {
  margin: 8px 0 0;
  font-size: 13px;
  color: #b45309;
}

/* ---------- 翻页 ---------- */
.sci-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: 18px;
}

.sci-nav {
  background: var(--accent);
  color: #fff;
  border-radius: 14px;
  padding: 10px 14px;
  font-size: 15px;
}

.sci-pager {
  color: var(--muted);
  font-size: 14px;
}

.sci-dots {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 14px;
}

.sci-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #d8e6de;
}

.sci-dot.active {
  background: var(--accent);
}

.sci-progress {
  margin: 10px 0 0;
  text-align: center;
  font-size: 12px;
  color: var(--muted);
}
</style>
