import type { Album } from '../types'

/**
 * 专辑：会长大的植物
 * 新增专辑 = 在 albums/ 下新建这样一个文件，自动被发现，无需改任何注册表。
 */
const album: Album = {
  id: 'plants',
  title: '会长大的植物',
  subtitle: '种子、小芽和大树',
  category: 'nature',
  cover: '🌱',
  accent: '#4caf7d',
  order: 1,
  cards: [
    {
      id: 'seed',
      title: '种子发芽',
      text: '种子喝饱水、晒到太阳，就会悄悄冒出小小的绿芽。',
      svg: `<svg viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg">
        <rect x="20" y="90" width="160" height="26" rx="8" fill="#a2704a"/>
        <path d="M100 90 C100 68 100 60 100 50" stroke="#4caf7d" stroke-width="5" fill="none" stroke-linecap="round"/>
        <path d="M100 60 C82 60 74 50 74 38 C90 38 100 48 100 58 Z" fill="#4caf7d"/>
        <path d="M100 56 C118 56 126 46 126 34 C110 34 100 44 100 54 Z" fill="#8ed9ae"/>
        <circle cx="100" cy="92" r="14" fill="#c98f5e"/>
      </svg>`
    },
    {
      id: 'tree',
      title: '大树',
      text: '小芽一天天长高，变成有粗粗树干、绿绿树冠的大树。',
      svg: `<svg viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg">
        <rect x="14" y="98" width="172" height="18" rx="8" fill="#a2704a"/>
        <rect x="92" y="62" width="16" height="38" rx="6" fill="#8b5e3c"/>
        <circle cx="100" cy="44" r="30" fill="#4caf7d"/>
        <circle cx="74" cy="56" r="18" fill="#3f9c6d"/>
        <circle cx="126" cy="56" r="18" fill="#8ed9ae"/>
        <circle cx="100" cy="24" r="14" fill="#8ed9ae"/>
      </svg>`
    },
    {
      id: 'flower',
      title: '小花开了',
      text: '春天来了，枝头开出香香的小花，蜜蜂会飞来打招呼。',
      svg: `<svg viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg">
        <rect x="14" y="100" width="172" height="16" rx="8" fill="#a2704a"/>
        <path d="M100 100 C100 82 100 74 100 62" stroke="#4caf7d" stroke-width="5" fill="none" stroke-linecap="round"/>
        <path d="M100 78 C86 78 80 70 80 60 C94 58 100 66 100 76 Z" fill="#4caf7d"/>
        <g fill="#ff8f6b">
          <circle cx="100" cy="40" r="11"/>
          <circle cx="87" cy="51" r="11"/>
          <circle cx="113" cy="51" r="11"/>
          <circle cx="92" cy="66" r="11"/>
          <circle cx="108" cy="66" r="11"/>
        </g>
        <circle cx="100" cy="53" r="9" fill="#ffd166"/>
      </svg>`
    }
  ]
}

export default album
