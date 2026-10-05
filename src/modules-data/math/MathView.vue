<script setup lang="ts">
import { ref } from 'vue'

const MAX = 5

const count = ref(1)
const options = ref<number[]>([])
const feedback = ref('')
const score = ref(0)

function newRound() {
  count.value = 1 + Math.floor(Math.random() * MAX)
  const picked = new Set<number>([count.value])
  while (picked.size < 3) {
    picked.add(1 + Math.floor(Math.random() * MAX))
  }
  options.value = [...picked].sort(() => Math.random() - 0.5)
  feedback.value = ''
}

function answer(n: number) {
  if (n === count.value) {
    feedback.value = '答对啦，真棒！'
    score.value += 1
    setTimeout(newRound, 900)
  } else {
    feedback.value = '再数一数～'
  }
}

newRound()
</script>

<template>
  <div class="math">
    <div class="row">
      <span v-for="i in count" :key="i" class="fruit">🍎</span>
    </div>

    <p class="ask">一共有几个苹果？</p>

    <div class="opts">
      <button v-for="n in options" :key="n" class="opt" @click="answer(n)">
        {{ n }}
      </button>
    </div>

    <p class="feedback">{{ feedback }}</p>
    <p class="score">答对 {{ score }} 题</p>
    <button class="big-btn" @click="newRound">换一题</button>
  </div>
</template>

<style scoped>
.math {
  background: #fff;
  border-radius: 22px;
  padding: 20px 18px;
  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.06);
  text-align: center;
}

.row {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  min-height: 56px;
}

.fruit {
  font-size: 42px;
  line-height: 1;
}

.ask {
  font-size: 17px;
  margin: 14px 0 12px;
}

.opts {
  display: flex;
  justify-content: center;
  gap: 12px;
}

.opt {
  width: 60px;
  height: 60px;
  border-radius: 18px;
  background: color-mix(in srgb, var(--accent) 15%, #fff);
  color: var(--accent);
  font-size: 24px;
  font-weight: 700;
  border: 2px solid color-mix(in srgb, var(--accent) 40%, transparent);
}

.feedback {
  min-height: 24px;
  margin: 16px 0 4px;
  font-size: 15px;
  color: var(--accent);
}

.score {
  color: var(--muted);
  font-size: 13px;
  margin: 0 0 16px;
}
</style>
