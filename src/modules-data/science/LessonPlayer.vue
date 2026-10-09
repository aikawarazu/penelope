<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { Course, SceneSpec } from '@/content/types'
import { markRead } from '@/content/progress'

const props = defineProps<{ course: Course }>()

const scene = computed<SceneSpec | null>(() => props.course.scene ?? null)
const steps = computed(() => props.course.steps)
const total = computed(() => steps.value.length)

/* ------------------------------ 状态 ------------------------------ */

const stepIndex = ref(0)
const playing = ref(false)
const finished = ref(false)
const speaking = ref(true)
const reduced = ref(false)
/** 有引言时先显示封面，点「开始上课」再进入场景 */
const started = ref(!props.course.intro)

const step = computed(() => steps.value[stepIndex.value])
/** 这一步的小问答作答情况（课程数据里带 quiz 的步骤才会出现） */
const answered = ref<Record<string, number>>({})

function answer(stepId: string, choice: number) {
  answered.value = { ...answered.value, [stepId]: choice }
}
const isLast = computed(() => stepIndex.value === total.value - 1)
const progressWidth = computed(() => ((stepIndex.value + 1) / Math.max(1, total.value)) * 100)

/** 参考稿的做法：给场景容器加 st1…stN，由 CSS 驱动动画 */
const sceneClass = computed(() => ['scene', `st${stepIndex.value + 1}`, { paused: !playing.value }])

/* --------------------------- 课程自带样式 --------------------------- */

let styleEl: HTMLStyleElement | null = null

function installCss() {
  styleEl?.remove()
  styleEl = null
  const css = scene.value?.css
  if (!css) return
  styleEl = document.createElement('style')
  styleEl.setAttribute('data-lesson', props.course.id)
  styleEl.textContent = css
  document.head.appendChild(styleEl)
}

/* ------------------------------ 配音 ------------------------------ */

function stopSpeak() {
  const synth = window.speechSynthesis
  if (synth) synth.cancel()
}

function speakCurrent() {
  if (!speaking.value || reduced.value) return
  const synth = window.speechSynthesis
  if (!synth || !step.value) return
  synth.cancel()
  const u = new SpeechSynthesisUtterance(`${step.value.title}。${step.value.text}`)
  u.lang = 'zh-CN'
  u.rate = 0.92
  synth.speak(u)
}

/* ------------------------------ 播放 ------------------------------ */

let timer = 0

function clearTimer() {
  if (timer) {
    window.clearTimeout(timer)
    timer = 0
  }
}

function scheduleNext() {
  clearTimer()
  if (!playing.value) return
  const dur = reduced.value ? 1400 : step.value?.dur ?? 6000
  timer = window.setTimeout(() => {
    if (!playing.value) return
    if (!isLast.value) {
      // 走 goTo 才会顺带记进度
      goTo(stepIndex.value + 1)
    } else {
      const s = steps.value[stepIndex.value]
      if (s) markRead(props.course.id, s.id, stepIndex.value)
      playing.value = false
      finished.value = true
    }
  }, dur)
}

function goTo(i: number) {
  stepIndex.value = Math.max(0, Math.min(total.value - 1, i))
  finished.value = false
  const s = steps.value[stepIndex.value]
  if (s) markRead(props.course.id, s.id, stepIndex.value)
  if ((playing.value || speaking.value) && started.value) speakCurrent()
  scheduleNext()
}

function start() {
  started.value = true
  playing.value = true
  goTo(0)
}

function next() {
  goTo(stepIndex.value + 1)
}

function prev() {
  goTo(stepIndex.value - 1)
}

function togglePlay() {
  if (finished.value && !playing.value) {
    stepIndex.value = 0
    finished.value = false
  }
  playing.value = !playing.value
  if (playing.value) {
    speakCurrent()
    scheduleNext()
  } else {
    clearTimer()
    stopSpeak()
  }
}

function replay() {
  stepIndex.value = 0
  finished.value = false
  playing.value = true
  speakCurrent()
  scheduleNext()
}

function toggleSpeak() {
  speaking.value = !speaking.value
  if (speaking.value) speakCurrent()
  else stopSpeak()
}

function onKey(e: KeyboardEvent) {
  if (e.target instanceof HTMLElement && e.target.tagName === 'BUTTON') return
  if (!started.value) return
  if (e.key === ' ' || e.code === 'Space') {
    e.preventDefault()
    togglePlay()
  } else if (e.key === 'ArrowLeft') {
    e.preventDefault()
    prev()
  } else if (e.key === 'ArrowRight') {
    e.preventDefault()
    next()
  }
}

onMounted(() => {
  reduced.value = Boolean(
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
  installCss()
  window.addEventListener('keydown', onKey)
})

onBeforeUnmount(() => {
  clearTimer()
  stopSpeak()
  window.removeEventListener('keydown', onKey)
  styleEl?.remove()
  styleEl = null
})

watch(() => props.course.id, () => {
  stepIndex.value = 0
  playing.value = false
  finished.value = false
  installCss()
})
</script>

<template>
  <div class="lesson" :class="{ reduced }" :style="{ '--accent': course.accent }">
    <div v-if="!started" class="intro-card">
      <span class="intro-cover">{{ course.cover }}</span>
      <h3>{{ course.title }}</h3>
      <p>{{ course.intro }}</p>
      <button class="start" type="button" @click="start">开始上课 →</button>
    </div>

    <section v-else class="stage-card">
      <div v-if="scene?.flag" class="flag">{{ scene.flag }}</div>

      <div :class="sceneClass">
        <!-- eslint-disable-next-line vue/no-v-html -->
        <div v-if="scene" class="scene-svg" v-html="scene.svg" />

        <div
          v-if="step?.pop"
          class="pop"
          :style="{
            left: step.pop.left,
            top: step.pop.top,
            right: step.pop.right,
            bottom: step.pop.bottom
          }"
        >
          {{ step.pop.text }}
        </div>

        <div v-if="scene?.doneBadge" class="done-badge" :class="{ show: isLast }">
          <b>{{ scene.doneBadge.title }}</b>
          <span>{{ scene.doneBadge.sub }}</span>
        </div>
      </div>

      <div class="caption">
        <span class="step-no">第 {{ stepIndex + 1 }} 步</span>
        <div>
          <div class="cap-t">{{ step?.title }}</div>
          <div class="cap-d">{{ step?.text }}</div>
        </div>
      </div>

      <div v-if="step?.quiz" class="quiz">
        <p class="quiz-q">🤔 {{ step.quiz.question }}</p>
        <button
          v-for="(opt, i) in step.quiz.options"
          :key="i"
          class="quiz-opt"
          :class="{
            picked: answered[step.id] === i,
            right: answered[step.id] !== undefined && i === step.quiz.answer,
            wrong: answered[step.id] === i && i !== step.quiz.answer
          }"
          :disabled="answered[step.id] !== undefined"
          @click="answer(step.id, i)"
        >
          {{ opt }}
        </button>
        <p v-if="answered[step.id] === step.quiz.answer" class="quiz-ok">
          {{ step.quiz.explain ?? '答对啦！' }}
        </p>
        <p v-else-if="answered[step.id] !== undefined" class="quiz-no">再看看画面，答案就在里面哦</p>
      </div>

      <div class="controls">
        <div class="progress"><i :style="{ width: progressWidth + '%' }" /></div>

        <div class="btns">
          <button class="btn" type="button" aria-label="上一步" @click="prev">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7V5z" /></svg>
          </button>

          <button class="btn primary" type="button" :aria-label="playing ? '暂停' : '播放'" @click="togglePlay">
            <svg v-if="!playing" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
            <svg v-else viewBox="0 0 24 24" aria-hidden="true"><path d="M6 5h4v14H6zM14 5h4v14h-4z" /></svg>
            <span>{{ playing ? '暂停' : finished ? '再播一次' : '播放' }}</span>
          </button>

          <button class="btn" type="button" aria-label="下一步" @click="next">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7V5z" /></svg>
          </button>

          <button class="btn" type="button" aria-label="从头重播" @click="replay">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 5V2L7 6l5 4V7a5 5 0 1 1-4.9 6H4.2A7 7 0 1 0 12 5z" />
            </svg>
            <span>重播</span>
          </button>

          <button
            class="btn"
            type="button"
            :aria-pressed="speaking ? 'true' : 'false'"
            :aria-label="speaking ? '关闭朗读' : '打开朗读'"
            @click="toggleSpeak"
          >
            <svg v-if="speaking" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M4 9v6h4l5 4V5L8 9H4zM16.5 8.5l-1.4 1.4 2.1 2.1-2.1 2.1 1.4 1.4 2.1-2.1 2.1 2.1 1.4-1.4-2.1-2.1 2.1-2.1-1.4-1.4-2.1 2.1-2.1-2.1z"
              />
            </svg>
            <svg v-else viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 9v6h4l5 4V5L8 9H4z" />
            </svg>
            <span>{{ speaking ? '朗读中' : '静音' }}</span>
          </button>
        </div>

        <div class="step-dots" role="group" aria-label="步骤切换">
          <button
            v-for="(s, i) in steps"
            :key="s.id"
            class="step-dot"
            :class="{ on: i === stepIndex }"
            :aria-current="i === stepIndex ? 'step' : 'false'"
            :aria-label="`跳到第 ${i + 1} 步`"
            @click="goTo(i)"
          >
            {{ i + 1 }}
          </button>
        </div>

        <div class="hint">小提示：点数字可直接跳步；空格键暂停 / 继续；「朗读」可以关掉声音。</div>
      </div>
    </section>

    <p v-if="course.summary" class="recap">{{ course.summary }}</p>

    <section v-if="course.facts?.length" class="facts">
      <h2>{{ course.factsTitle || '你知道吗？' }}</h2>
      <div class="facts-grid">
        <div v-for="f in course.facts" :key="f.title" class="fact">
          <div class="ic" v-html="f.icon" />
          <h3>{{ f.title }}</h3>
          <p>{{ f.text }}</p>
        </div>
      </div>
    </section>

    <p v-if="course.footer" class="lesson-footer">{{ course.footer }}</p>
  </div>
</template>

<style scoped>
.lesson {
  --green: var(--accent, #6fb33f);
  --sub: #71806f;
  --ink: #33403a;
  --sun: #ffc94d;
  --pink: #f6a8bc;
}

.intro-card {
  text-align: center;
  background: #fff;
  border: 3px solid #dcebc8;
  border-radius: 24px;
  padding: 26px 18px 24px;
  box-shadow: 0 8px 22px rgba(110, 150, 60, 0.14);
}

.intro-cover {
  font-size: 56px;
  line-height: 1;
}

.intro-card h3 {
  margin: 12px 0 6px;
  font-size: 21px;
  color: #3e7a2b;
}

.intro-card p {
  margin: 0 auto;
  max-width: 30em;
  font-size: 15px;
  line-height: 1.8;
  color: #55635a;
}

.start {
  margin-top: 18px;
  border: none;
  background: var(--accent, #6fb33f);
  color: #fff;
  font-family: inherit;
  font-size: 16px;
  font-weight: 700;
  padding: 13px 24px;
  border-radius: 16px;
  cursor: pointer;
}

.stage-card {
  background: #fff;
  border: 3px solid #dcebc8;
  border-radius: 24px;
  padding: 14px 14px 16px;
  position: relative;
  box-shadow: 0 8px 22px rgba(110, 150, 60, 0.14);
}

.flag {
  position: absolute;
  top: -13px;
  left: 18px;
  z-index: 3;
  background: var(--sun);
  color: #6b4e00;
  font-size: 12.5px;
  font-weight: 700;
  padding: 4px 12px;
  border-radius: 999px;
  border: 2.5px solid #fff;
}

.scene {
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  background: linear-gradient(180deg, #c9e9fb, #eff9ff);
}

.scene-svg :deep(svg) {
  display: block;
  width: 100%;
  height: auto;
}

/* 气泡字：位置来自步骤数据，这里只管样式 */
.pop {
  position: absolute;
  font-size: clamp(15px, 3.2vw, 22px);
  font-weight: 700;
  color: #e2719a;
  background: #fff;
  padding: 6px 14px;
  border-radius: 14px;
  border: 2.5px dashed var(--pink);
  white-space: nowrap;
  animation: popBounce 1.2s ease-in-out infinite;
  pointer-events: none;
  z-index: 2;
}

@keyframes popBounce {
  0%,
  100% {
    transform: scale(1) translateY(0);
  }
  50% {
    transform: scale(1.1) translateY(-7px);
  }
}

/* 完成徽章：覆盖课程自带 CSS 里的 .scene.st7 规则，让任意步数都生效 */
.lesson .scene .done-badge {
  position: absolute;
  left: 4.5%;
  top: 10%;
  z-index: 2;
  background: #fff;
  border: 3px solid var(--green);
  border-radius: 18px;
  padding: 10px 18px;
  text-align: center;
  opacity: 0;
  transform: scale(0.5);
  pointer-events: none;
  box-shadow: 0 6px 16px rgba(80, 120, 60, 0.18);
}

.lesson .scene .done-badge.show {
  opacity: 1;
  transform: scale(1);
  transition: all 0.5s cubic-bezier(0.22, 1, 0.36, 1);
}

.lesson .scene .done-badge b {
  display: block;
  font-size: clamp(20px, 3.4vw, 27px);
  color: #3e7a2b;
}

.lesson .scene .done-badge span {
  font-size: 13px;
  color: var(--sub);
}

.caption {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin: 14px 4px 2px;
  min-height: 58px;
}

.step-no {
  flex: none;
  background: var(--green);
  color: #fff;
  font-size: 14.5px;
  padding: 5px 13px;
  border-radius: 999px;
  margin-top: 3px;
  white-space: nowrap;
}

.cap-t {
  font-weight: 700;
  font-size: 18px;
  color: #3e7a2b;
}

.cap-d {
  font-size: 15px;
  color: #55635a;
  margin-top: 1px;
  line-height: 1.6;
}

.quiz {
  margin: 14px 4px 0;
  padding: 14px;
  border-radius: 16px;
  background: #fffdf5;
  border: 2px solid #fde68a;
}

.quiz-q {
  margin: 0 0 10px;
  font-size: 14px;
  font-weight: 700;
  color: #55635a;
}

.quiz-opt {
  display: block;
  width: 100%;
  text-align: left;
  margin-bottom: 7px;
  padding: 10px 12px;
  border-radius: 12px;
  background: #fff;
  border: 2px solid #e6efea;
  font-size: 14px;
  font-family: inherit;
  color: #33403a;
  cursor: pointer;
}

.quiz-opt:disabled {
  cursor: default;
}

.quiz-opt.right {
  background: #eafff2;
  border-color: #22c55e;
  color: #15803d;
  font-weight: 700;
}

.quiz-opt.wrong {
  background: #fef2f2;
  border-color: #fca5a5;
  color: #b91c1c;
}

.quiz-ok {
  margin: 8px 0 0;
  font-size: 13px;
  color: #15803d;
}

.quiz-no {
  margin: 8px 0 0;
  font-size: 13px;
  color: #b45309;
}

.controls {
  margin-top: 10px;
}

.progress {
  height: 10px;
  background: #e4efd8;
  border-radius: 999px;
  overflow: hidden;
}

.progress i {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, var(--green), #a4d96a);
  border-radius: 999px;
  transition: width 0.45s ease;
}

.btns {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  justify-content: center;
  margin-top: 12px;
}

.btn {
  border: none;
  background: #fff;
  border: 2px solid #cfe3ba;
  color: #3e7a2b;
  font-family: inherit;
  font-size: 15px;
  font-weight: 700;
  padding: 10px 15px;
  min-height: 46px;
  min-width: 46px;
  border-radius: 14px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: background 0.2s, transform 0.15s;
}

.btn:hover {
  background: #f2fae6;
}

.btn:active {
  transform: scale(0.96);
}

.btn.primary {
  background: var(--green);
  border-color: var(--green);
  color: #fff;
}

.btn svg {
  width: 18px;
  height: 18px;
  fill: currentColor;
  flex: none;
}

.step-dots {
  display: flex;
  gap: 9px;
  justify-content: center;
  margin-top: 12px;
  flex-wrap: wrap;
}

.step-dot {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 2px solid #cfe3ba;
  background: #fff;
  color: #5d8a42;
  font-weight: 700;
  font-size: 15.5px;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}

.step-dot:hover {
  background: #f2fae6;
}

.step-dot.on {
  background: var(--green);
  border-color: var(--green);
  color: #fff;
  transform: scale(1.08);
}

.hint {
  text-align: center;
  font-size: 12.5px;
  color: #9aa892;
  margin-top: 10px;
}

.recap {
  margin: 18px 2px 0;
  padding: 12px 14px;
  background: #fff;
  border: 2px solid #e2edd2;
  border-radius: 16px;
  font-size: 14.5px;
  line-height: 1.8;
  color: #55635a;
}

.facts {
  margin-top: 26px;
}

.facts h2 {
  font-size: 25px;
  color: #3e7a2b;
  text-align: center;
  margin: 0 0 16px;
}

.facts-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
}

.fact {
  background: #fff;
  border: 2px solid #e2edd2;
  border-radius: 18px;
  padding: 16px 15px;
}

.fact .ic {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: #eaf6dc;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 9px;
}

.fact .ic :deep(svg) {
  width: 32px;
  height: 32px;
}

.fact h3 {
  font-size: 16px;
  margin: 0 0 4px;
  color: #33503f;
}

.fact p {
  margin: 0;
  font-size: 14px;
  color: #5d6b61;
  line-height: 1.6;
}

.lesson-footer {
  text-align: center;
  color: #8a9886;
  font-size: 13px;
  margin-top: 26px;
  line-height: 1.8;
}

/* 尊重系统的「减少动态效果」 */
.lesson.reduced .scene :deep(*) {
  animation: none !important;
  transition: none !important;
}

.lesson.reduced .pop {
  animation: none !important;
}

@media (max-width: 680px) {
  .facts-grid {
    grid-template-columns: 1fr;
  }
  .caption {
    flex-wrap: wrap;
  }
}
</style>
