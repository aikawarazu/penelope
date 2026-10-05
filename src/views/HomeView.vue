<script setup lang="ts">
import { moduleRegistry } from '@/modules/registry'
</script>

<template>
  <section>
    <p class="hint">挑一个开始吧 · 共 {{ moduleRegistry.length }} 个模块</p>
    <div class="module-grid">
      <router-link
        v-for="m in moduleRegistry"
        :key="m.id"
        class="module-card"
        :to="`/m/${m.id}`"
        :style="{ borderColor: m.accent }"
      >
        <span class="emoji">{{ m.icon }}</span>
        <h3>{{ m.title }}</h3>
        <p>{{ m.description }}</p>
      </router-link>
    </div>
  </section>
</template>

<style scoped>
.hint {
  color: var(--muted);
  font-size: 14px;
  margin-top: 10px;
}
</style>
