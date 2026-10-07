<script setup lang="ts">
import { computed, ref } from 'vue'
import { ALL_CATEGORY_ID, categoryLabel } from '@/content/categories'
import { albumsOf, cardCount, totalAlbums, totalCards, usedCategories } from '@/content/registry'
import { getProgress } from '@/content/progress'
import { libraryModules, toolModules } from '@/modules/registry'

const library = computed(() => libraryModules[0])

const category = ref<string>(ALL_CATEGORY_ID)
const chips = computed(() => [
  { id: ALL_CATEGORY_ID, label: '全部', emoji: '📚' },
  ...usedCategories.map((c) => ({ id: c.id, label: c.label, emoji: c.emoji }))
])

const HOME_ALBUM_LIMIT = 6
const visibleAlbums = computed(() => albumsOf(category.value).slice(0, HOME_ALBUM_LIMIT))
const remaining = computed(() => Math.max(0, albumsOf(category.value).length - HOME_ALBUM_LIMIT))

function readCount(albumId: string) {
  return getProgress(albumId).read.length
}

function albumHref(albumId: string) {
  return library.value ? `/m/${library.value.id}/album/${albumId}` : '/'
}
</script>

<template>
  <section class="home-hero">
    <h1>佩佩启蒙乐园</h1>
    <p>一针一线耐心编织，陪宝宝一点点认识世界。</p>
    <div class="home-stats">
      <span><b>{{ totalAlbums }}</b> 本专辑</span>
      <span><b>{{ totalCards }}</b> 张卡片</span>
      <span><b>{{ toolModules.length }}</b> 个玩法</span>
    </div>
  </section>

  <section v-if="library" class="home-section">
    <header class="home-section-head">
      <h2>{{ library.title }}</h2>
      <router-link class="home-more" :to="`/m/${library.id}`">查看全部 →</router-link>
    </header>

    <div class="home-chips">
      <button
        v-for="c in chips"
        :key="c.id"
        class="home-chip"
        :class="{ on: category === c.id }"
        @click="category = c.id"
      >
        <span>{{ c.emoji }}</span>{{ c.label }}
      </button>
    </div>

    <div class="home-grid">
      <router-link
        v-for="a in visibleAlbums"
        :key="a.id"
        class="home-album"
        :style="{ borderColor: a.accent }"
        :to="albumHref(a.id)"
      >
        <span class="home-album-cover" :style="{ background: a.accent + '1f' }">{{ a.cover }}</span>
        <span class="home-album-title">{{ a.title }}</span>
        <span class="home-album-foot">
          <span class="home-tag" :style="{ color: a.accent, borderColor: a.accent + '55' }">
            {{ categoryLabel(a.category) }}
          </span>
          <span class="home-album-count">{{ readCount(a.id) }}/{{ cardCount(a) }} 张</span>
        </span>
      </router-link>
    </div>

    <p v-if="remaining" class="home-note">还有 {{ remaining }} 本，点右上角「查看全部」</p>
    <p v-if="!visibleAlbums.length" class="home-note">这个分类还没有专辑～</p>
  </section>

  <section v-if="toolModules.length" class="home-section">
    <header class="home-section-head">
      <h2>玩一玩</h2>
    </header>
    <div class="module-grid">
      <router-link
        v-for="m in toolModules"
        :key="m.id"
        class="module-card"
        :to="`/m/${m.id}`"
        :style="{ borderColor: m.accent }"
      >
        <span class="emoji">{{ m.icon }}</span>
        <h3>
          {{ m.title }}
          <span v-if="m.lab" class="lab-badge">实验室</span>
        </h3>
        <p>{{ m.description }}</p>
      </router-link>
    </div>
  </section>
</template>

<style scoped>
.home-hero {
  text-align: center;
  padding: 8px 0 4px;
}

.home-hero h1 {
  margin: 0;
  font-size: 26px;
  letter-spacing: 1px;
  color: var(--brand);
}

.home-hero p {
  margin: 6px 0 0;
  font-size: 14px;
  color: var(--muted);
}

.home-stats {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 12px;
  font-size: 12px;
  color: var(--muted);
}

.home-stats b {
  color: var(--ink);
  font-size: 14px;
}

.home-section {
  margin-top: 26px;
}

.home-section-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
}

.home-section-head h2 {
  margin: 0;
  font-size: 18px;
}

.home-more {
  font-size: 13px;
  color: var(--brand);
  text-decoration: none;
}

.home-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 14px;
}

.home-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 7px 13px;
  border-radius: 999px;
  font-size: 13px;
  background: #fff;
  border: 2px solid #e6efea;
  color: var(--ink);
}

.home-chip.on {
  background: var(--brand-soft);
  border-color: var(--brand);
  color: var(--brand);
  font-weight: 600;
}

.home-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 14px;
}

.home-album {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 14px;
  border-radius: 18px;
  background: #fff;
  border: 2px solid #e6efea;
  box-shadow: 0 6px 18px rgba(76, 175, 125, 0.08);
  text-decoration: none;
  color: inherit;
  transition: transform 0.15s ease;
}

.home-album:active {
  transform: scale(0.97);
}

.home-album-cover {
  height: 72px;
  display: grid;
  place-items: center;
  border-radius: 14px;
  font-size: 32px;
}

.home-album-title {
  font-size: 15px;
  font-weight: 700;
}

.home-album-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}

.home-tag {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 999px;
  border: 1px solid #d8e6de;
}

.home-album-count {
  font-size: 11px;
  color: var(--muted);
}

.home-note {
  margin: 12px 0 0;
  font-size: 12px;
  color: var(--muted);
}
</style>
