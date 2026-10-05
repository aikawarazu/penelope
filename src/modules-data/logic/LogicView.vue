<script setup lang="ts">
import { computed, ref } from 'vue'

interface Item {
  emoji: string
  kind: 'animal' | 'fruit'
}

const items: Item[] = [
  { emoji: '🐶', kind: 'animal' },
  { emoji: '🍌', kind: 'fruit' },
  { emoji: '🐱', kind: 'animal' },
  { emoji: '🍇', kind: 'fruit' },
  { emoji: '🐰', kind: 'animal' },
  { emoji: '🍓', kind: 'fruit' }
]

const index = ref(0)
const feedback = ref('')
const correct = ref(0)
const done = computed(() => index.value >= items.length)
const current = computed(() => items[index.value])

function choose(kind: Item['kind']) {
  if (!current.value) return
  if (kind === current.value.kind) {
    feedback.value = '放对啦！'
    correct.value += 1
    setTimeout(() => {
      index.value += 1
      feedback.value = ''
    }, 800)
  } else {
    feedback.value = '再想想，它是动物还是水果？'
  }
}

function restart() {
  index.value = 0
  correct.value = 0
  feedback.value = ''
}
</script>

<template>
  <div class="logic">
    <template v-if="!done">
      <div class="item">{{ current.emoji }}</div>
      <p class="ask">它应该回到哪个家？</p>

      <div class="baskets">
        <button class="basket" @click="choose('animal')">🐾 动物家</button>
        <button class="basket" @click="choose('fruit')">🧺 水果家</button>
      </div>

      <p class="feedback">{{ feedback }}</p>
      <p class="progress">第 {{ index + 1 }} / {{ items.length }} 个</p>
    </template>

    <template v-else>
      <div class="item">🎉</div>
      <p class="ask">全部送回家啦！答对 {{ correct }} 个。</p>
      <button class="big-btn" @click="restart">再玩一次</button>
    </template>
  </div>
</template>

<style scoped>
.logic {
  background: #fff;
  border-radius: 22px;
  padding: 20px 18px;
  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.06);
  text-align: center;
}

.item {
  font-size: 64px;
  line-height: 1;
}

.ask {
  font-size: 17px;
  margin: 14px 0 16px;
}

.baskets {
  display: flex;
  justify-content: center;
  gap: 12px;
}

.basket {
  background: color-mix(in srgb, var(--accent) 15%, #fff);
  color: var(--accent);
  border: 2px solid color-mix(in srgb, var(--accent) 40%, transparent);
  border-radius: 18px;
  padding: 14px 18px;
  font-size: 16px;
  font-weight: 600;
  min-width: 120px;
}

.feedback {
  min-height: 24px;
  margin: 16px 0 4px;
  font-size: 15px;
  color: var(--accent);
}

.progress {
  color: var(--muted);
  font-size: 13px;
  margin: 0;
}
</style>
