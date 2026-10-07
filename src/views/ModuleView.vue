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

/** 子路径（/m/:id/:rest），有值说明在模块的二级页面里 */
const inSubPage = computed(() => Boolean(String(route.params.rest ?? '')))

function back() {
  if (inSubPage.value && manifest.value) router.push(`/m/${manifest.value.id}`)
  else router.push('/')
}
</script>

<template>
  <div v-if="manifest" class="module-page" :style="{ '--accent': manifest.accent }">
    <button class="back" @click="back">{{ inSubPage ? '← 返回' : '← 首页' }}</button>
    <h2>
      {{ manifest.title }}
      <span v-if="manifest.lab" class="lab-badge">实验室</span>
    </h2>
    <p class="desc">{{ manifest.description }}</p>
    <component :is="Comp" v-if="Comp" />
  </div>

  <div v-else class="module-page">
    <button class="back" @click="router.push('/')">← 首页</button>
    <h2>模块不存在</h2>
    <p class="desc">这个模块可能已经被移除了。</p>
  </div>
</template>
