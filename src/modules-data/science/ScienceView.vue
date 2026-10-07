<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ALL_CATEGORY_ID, categoryLabel } from '@/content/categories'
import { albumsOf, cardCount, getAlbum, totalAlbums, totalCards, usedCategories } from '@/content/registry'
import { getProgress, markRead } from '@/content/progress'
import type { Album } from '@/content/types'

const route = useRoute()
const router = useRouter()

const moduleId = computed(() => String(route.params.id ?? ''))

/** 子路由：/m/<module>/album/<albumId> —— 可以直接分享到某一本专辑 */
const albumId = computed(() => {
  const rest = String(route.params.rest ?? '')
  const matched = /^album\/([^/]+)/.exec(rest)
  return matched ? matched[1] : ''
})

const album = computed(() => (albumId.value ? getAlbum(albumId.value) : undefined))

/* ----------------------------- 专辑列表 ----------------------------- */

const category = ref<string>(ALL_CATEGORY_ID)
const chips = computed(() => [
  { id: ALL_CATEGORY_ID, label: '全部', emoji: '📚' },
  ...usedCategories.map((c) => ({ id: c.id, label: c.label, emoji: c.emoji }))
])
const visibleAlbums = computed(() => albumsOf(category.value))

function progressOf(one: Album) {
  const p = getProgress(one.id)
  return { read: p.read.length, total: cardCount(one) }
}

function openAlbum(id: string) {
  router.push(`/m/${moduleId.value}/album/${id}`)
}

function backToList() {
  router.push(`/m/${moduleId.value}`)
}

/* ------------------------------ 阅读器 ------------------------------ */

const index = ref(0)
const cards = computed(() => album.value?.cards ?? [])
const card = computed(() => cards.value[index.value])
const progress = computed(() =>
  album.value ? { read: getProgress(album.value.id).read.length, total: cards.value.length } : { read: 0, total: 0 }
)

function go(delta: number) {
  if (!cards.value.length) return
  index.value = (index.value + delta + cards.value.length) % cards.value.length
}

function goTo(i: number) {
  if (i >= 0 && i < cards.value.length) index.value = i
}

// 进入专辑时从上次读到的位置继续
watch(
  album,
  (one) => {
    if (!one) return
    index.value = Math.min(getProgress(one.id).lastCard, one.cards.length - 1)
  },
  { immediate: true }
)

// 每次翻页记一次进度（immediate：刚打开时也要记下第一张）
watch(
  [album, index],
  () => {
    const one = album.value
    const c = card.value
    if (!one || !c) return
    markRead(one.id, c.id, index.value)
  },
  { immediate: true }
)

function onKey(e: KeyboardEvent) {
  if (!album.value) return
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
  <!-- 阅读器 -->
  <div v-if="album" class="sci-reader">
    <button class="sci-back" @click="backToList">← 全部专辑</button>

    <div class="sci-album-head">
      <span class="sci-cover">{{ album.cover }}</span>
      <div class="sci-album-meta">
        <h3>{{ album.title }}</h3>
        <p>{{ album.subtitle }}</p>
        <span class="sci-tag">{{ categoryLabel(album.category) }}</span>
      </div>
    </div>

    <div class="sci-stage" v-html="card.svg" />

    <h4 class="sci-card-title">{{ card.title }}</h4>
    <p class="sci-card-text">{{ card.text }}</p>

    <div class="sci-controls">
      <button class="sci-nav" @click="go(-1)">← 上一张</button>
      <span class="sci-pager">{{ index + 1 }} / {{ cards.length }}</span>
      <button class="sci-nav" @click="go(1)">下一张 →</button>
    </div>

    <div class="sci-dots">
      <button
        v-for="(c, i) in cards"
        :key="c.id"
        class="sci-dot"
        :class="{ active: i === index }"
        :title="c.title"
        @click="goTo(i)"
      />
    </div>

    <p class="sci-progress">这本专辑看过 {{ progress.read }} / {{ progress.total }} 张</p>
  </div>

  <!-- 专辑列表 -->
  <div v-else class="sci-library">
    <div class="sci-summary">
      共 <b>{{ totalAlbums }}</b> 本专辑 · <b>{{ totalCards }}</b> 张卡片
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
        v-for="a in visibleAlbums"
        :key="a.id"
        class="sci-album"
        :style="{ borderColor: a.accent }"
        @click="openAlbum(a.id)"
      >
        <span class="sci-album-cover" :style="{ background: a.accent + '1f' }">{{ a.cover }}</span>
        <span class="sci-album-title">{{ a.title }}</span>
        <span class="sci-album-sub">{{ a.subtitle }}</span>
        <span class="sci-album-foot">
          <span class="sci-tag" :style="{ color: a.accent, borderColor: a.accent + '55' }">
            {{ categoryLabel(a.category) }}
          </span>
          <span class="sci-album-count">{{ progressOf(a).read }}/{{ progressOf(a).total }} 张</span>
        </span>
      </button>
    </div>

    <p v-if="!visibleAlbums.length" class="sci-empty">这个分类还没有专辑，先看看别的吧～</p>
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
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 14px;
}

.sci-album {
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

.sci-album:active {
  transform: scale(0.97);
}

.sci-album-cover {
  width: 100%;
  height: 74px;
  display: grid;
  place-items: center;
  border-radius: 14px;
  font-size: 34px;
  margin-bottom: 6px;
}

.sci-album-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--ink);
}

.sci-album-sub {
  font-size: 12px;
  color: var(--muted);
  line-height: 1.4;
}

.sci-album-foot {
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

.sci-album-count {
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

.sci-album-head {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 8px 0 14px;
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

.sci-album-meta h3 {
  margin: 0 0 3px;
  font-size: 18px;
}

.sci-album-meta p {
  margin: 0 0 5px;
  font-size: 13px;
  color: var(--muted);
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

.sci-card-title {
  margin: 16px 0 6px;
  font-size: 20px;
}

.sci-card-text {
  margin: 0 0 16px;
  color: var(--muted);
  font-size: 15px;
  line-height: 1.7;
}

.sci-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
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
