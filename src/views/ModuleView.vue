<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getModule } from '@/modules/registry'

const route = useRoute()
const router = useRouter()

const manifest = computed(() => getModule(String(route.params.id ?? '')))
const Comp = computed(() =>
  manifest.value ? defineAsyncComponent(manifest.value.component) : null
)
</script>

<template>
  <div v-if="manifest" class="module-page" :style="{ '--accent': manifest.accent }">
    <button class="back" @click="router.push('/')">← 返回</button>
    <h2>{{ manifest.title }}</h2>
    <p class="desc">{{ manifest.description }}</p>
    <component :is="Comp" v-if="Comp" />
  </div>

  <div v-else class="module-page">
    <button class="back" @click="router.push('/')">← 返回</button>
    <h2>模块不存在</h2>
    <p class="desc">这个模块可能已经被移除了。</p>
  </div>
</template>
