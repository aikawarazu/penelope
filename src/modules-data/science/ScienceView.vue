<script setup lang="ts">
import { computed, ref } from 'vue'

interface Slide {
  title: string
  text: string
  svg: string
}

/** 科普卡片：新增内容只需往数组里加一项即可 */
const slides: Slide[] = [
  {
    title: '太阳公公',
    text: '太阳会发光发热，让小花小草慢慢长大。',
    svg: `<svg viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg">
      <g stroke="#ffb703" stroke-width="5" stroke-linecap="round">
        <line x1="100" y1="20" x2="100" y2="8"/>
        <line x1="100" y1="112" x2="100" y2="100"/>
        <line x1="150" y1="60" x2="162" y2="60"/>
        <line x1="38" y1="60" x2="50" y2="60"/>
        <line x1="135" y1="25" x2="144" y2="16"/>
        <line x1="56" y1="104" x2="65" y2="95"/>
        <line x1="135" y1="95" x2="144" y2="104"/>
        <line x1="56" y1="16" x2="65" y2="25"/>
      </g>
      <circle cx="100" cy="60" r="30" fill="#ffd166"/>
      <circle cx="90" cy="54" r="3" fill="#7a5b1e"/>
      <circle cx="110" cy="54" r="3" fill="#7a5b1e"/>
      <path d="M90 68 Q100 78 110 68" stroke="#7a5b1e" stroke-width="3" fill="none" stroke-linecap="round"/>
    </svg>`
  },
  {
    title: '下雨啦',
    text: '云里的小水滴变重了，就会落下来变成雨，去喂饱泥土。',
    svg: `<svg viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="70" cy="42" rx="34" ry="22" fill="#cfe3ef"/>
      <ellipse cx="105" cy="38" rx="30" ry="24" fill="#cfe3ef"/>
      <ellipse cx="135" cy="46" rx="26" ry="18" fill="#cfe3ef"/>
      <g fill="#5aa9e6">
        <circle cx="60" cy="82" r="5"/>
        <circle cx="85" cy="94" r="5"/>
        <circle cx="110" cy="80" r="5"/>
        <circle cx="135" cy="96" r="5"/>
        <circle cx="150" cy="84" r="5"/>
      </g>
      <rect x="10" y="106" width="180" height="14" rx="6" fill="#a2704a"/>
    </svg>`
  },
  {
    title: '种子发芽',
    text: '种子喝饱水、晒到太阳，就会悄悄冒出小小的绿芽。',
    svg: `<svg viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg">
      <rect x="20" y="90" width="160" height="26" rx="8" fill="#a2704a"/>
      <path d="M100 90 C100 68 100 60 100 50" stroke="#4caf7d" stroke-width="5" fill="none" stroke-linecap="round"/>
      <path d="M100 60 C82 60 74 50 74 38 C90 38 100 48 100 58 Z" fill="#4caf7d"/>
      <path d="M100 56 C118 56 126 46 126 34 C110 34 100 44 100 54 Z" fill="#8ed9ae"/>
      <circle cx="100" cy="92" r="14" fill="#c98f5e"/>
    </svg>`
  }
]

const index = ref(0)
const slide = computed(() => slides[index.value])

function prev() {
  index.value = (index.value - 1 + slides.length) % slides.length
}
function next() {
  index.value = (index.value + 1) % slides.length
}
</script>

<template>
  <div class="deck">
    <div class="stage" v-html="slide.svg" />
    <h3 class="slide-title">{{ slide.title }}</h3>
    <p class="slide-text">{{ slide.text }}</p>

    <div class="controls">
      <button class="nav" @click="prev">← 上一页</button>
      <span class="pager">{{ index + 1 }} / {{ slides.length }}</span>
      <button class="nav" @click="next">下一页 →</button>
    </div>

    <div class="dots">
      <span
        v-for="(s, i) in slides"
        :key="i"
        class="dot"
        :class="{ active: i === index }"
        @click="index = i"
      />
    </div>
  </div>
</template>

<style scoped>
.deck {
  background: #fff;
  border-radius: 22px;
  padding: 18px;
  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.06);
}

.stage {
  background: var(--brand-soft);
  border-radius: 16px;
  padding: 10px;
}

.stage :deep(svg) {
  width: 100%;
  height: auto;
  display: block;
}

.slide-title {
  margin: 16px 0 6px;
  font-size: 20px;
}

.slide-text {
  margin: 0 0 16px;
  color: var(--muted);
  font-size: 15px;
  line-height: 1.6;
}

.controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.nav {
  background: var(--accent);
  color: #fff;
  border-radius: 14px;
  padding: 10px 14px;
  font-size: 15px;
}

.pager {
  color: var(--muted);
  font-size: 14px;
}

.dots {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: 14px;
}

.dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #d8e6de;
  cursor: pointer;
}

.dot.active {
  background: var(--accent);
}
</style>
