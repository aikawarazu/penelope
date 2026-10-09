import type { Course } from '../types'

/** 课程：农场小伙伴（图卡集） */
const course: Course = {
  id: 'farm',
  title: '农场小伙伴',
  subtitle: '鸭子、兔子和奶牛',
  category: 'animals',
  cover: '🐾',
  accent: '#ff8f6b',
  kind: 'gallery',
  order: 4,
  age: '3-5 岁',
  intro: '农场里有好多动物朋友，它们长得不一样，本领也不一样。',
  steps: [
    {
      id: 'duck',
      title: '小鸭子',
      text: '小鸭子有扁扁的嘴巴和脚蹼，最喜欢在水里游来游去。',
      svg: `<svg viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="92" cy="80" rx="38" ry="24" fill="#ffd166"/>
        <circle cx="128" cy="52" r="20" fill="#ffd166"/>
        <path d="M146 52 L170 58 L146 66 Z" fill="#f59e0b"/>
        <circle cx="134" cy="46" r="3.5" fill="#7a5b1e"/>
        <path d="M56 86 C46 94 50 106 64 106 L100 106 C114 106 118 94 108 86 Z" fill="#facc15"/>
        <path d="M70 106 L70 114 M86 106 L86 114" stroke="#f59e0b" stroke-width="5" stroke-linecap="round"/>
      </svg>`
    },
    {
      id: 'rabbit',
      title: '小兔子',
      text: '小兔子的耳朵长长的，能听到很远的声音，最爱啃胡萝卜。',
      svg: `<svg viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="100" cy="84" rx="34" ry="26" fill="#ffffff" stroke="#e2e8f0" stroke-width="3"/>
        <circle cx="100" cy="54" r="22" fill="#ffffff" stroke="#e2e8f0" stroke-width="3"/>
        <ellipse cx="88" cy="32" rx="7" ry="18" fill="#ffffff" stroke="#e2e8f0" stroke-width="3"/>
        <ellipse cx="112" cy="32" rx="7" ry="18" fill="#ffffff" stroke="#e2e8f0" stroke-width="3"/>
        <circle cx="92" cy="52" r="3.5" fill="#7a5b1e"/>
        <circle cx="108" cy="52" r="3.5" fill="#7a5b1e"/>
        <path d="M100 60 l-5 5 M100 60 l5 5" stroke="#e8b98f" stroke-width="3" stroke-linecap="round"/>
        <circle cx="100" cy="62" r="4" fill="#ff8f6b"/>
      </svg>`
    },
    {
      id: 'cow',
      title: '奶牛',
      text: '奶牛身上有黑白的斑块，它吃青草，给我们甜甜的牛奶。',
      svg: `<svg viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg">
        <rect x="34" y="50" width="86" height="50" rx="14" fill="#ffffff" stroke="#e2e8f0" stroke-width="3"/>
        <ellipse cx="58" cy="66" rx="11" ry="8" fill="#2b3a33"/>
        <ellipse cx="92" cy="86" rx="13" ry="9" fill="#2b3a33"/>
        <rect x="46" y="100" width="10" height="16" rx="5" fill="#e2e8f0"/>
        <rect x="98" y="100" width="10" height="16" rx="5" fill="#e2e8f0"/>
        <circle cx="140" cy="58" r="26" fill="#ffffff" stroke="#e2e8f0" stroke-width="3"/>
        <ellipse cx="127" cy="40" rx="9" ry="12" fill="#c9a227" transform="rotate(-25 127 40)"/>
        <ellipse cx="153" cy="40" rx="9" ry="12" fill="#c9a227" transform="rotate(25 153 40)"/>
        <circle cx="131" cy="56" r="3.5" fill="#7a5b1e"/>
        <circle cx="149" cy="56" r="3.5" fill="#7a5b1e"/>
        <ellipse cx="140" cy="70" rx="12" ry="9" fill="#ff8f6b"/>
      </svg>`
    }
  ],
  summary: '小鸭子会游泳，小兔子耳朵长，奶牛给我们牛奶。每个小伙伴都有自己的本领。'
}

export default course
