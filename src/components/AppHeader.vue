<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { moduleRegistry } from '@/modules/registry'

const route = useRoute()
const isActive = (id: string) => String(route.params.id ?? '') === id
const isHome = computed(() => route.name === 'home')
</script>

<template>
  <header class="app-header">
    <router-link to="/" class="brand">Penelope</router-link>

    <nav class="nav">
      <router-link to="/" class="nav-link" :class="{ on: isHome }">首页</router-link>
      <router-link
        v-for="m in moduleRegistry"
        :key="m.id"
        class="nav-link"
        :class="{ on: isActive(m.id) }"
        :to="`/m/${m.id}`"
      >
        {{ m.title }}
      </router-link>
    </nav>
  </header>
</template>

<style scoped>
.app-header {
  max-width: 880px;
  margin: 0 auto;
  padding: 16px 18px 4px;
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.brand {
  font-size: 20px;
  font-weight: 700;
  color: var(--brand);
  letter-spacing: 0.6px;
  text-decoration: none;
}

.nav {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.nav-link {
  font-size: 13px;
  color: var(--muted);
  text-decoration: none;
  padding: 6px 12px;
  border-radius: 999px;
  background: #fff;
  border: 2px solid transparent;
}

.nav-link.on {
  color: var(--brand);
  border-color: var(--brand);
  background: var(--brand-soft);
  font-weight: 600;
}
</style>
