import type { Album } from '../types'

/** 专辑：认识我自己 */
const album: Album = {
  id: 'body',
  title: '认识我自己',
  subtitle: '小手、牙齿和眼睛',
  category: 'body',
  cover: '🦷',
  accent: '#f5a524',
  order: 4,
  cards: [
    {
      id: 'hands',
      title: '小小手',
      text: '一只手有五根手指，可以拍拍手、拿勺子，也能帮妈妈做事。',
      svg: `<svg viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg">
        <g fill="#ffd9b8" stroke="#e8b98f" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          <rect x="64" y="30" width="13" height="44" rx="6.5"/>
          <rect x="80" y="20" width="13" height="54" rx="6.5"/>
          <rect x="96" y="24" width="13" height="50" rx="6.5"/>
          <rect x="112" y="34" width="13" height="40" rx="6.5"/>
          <rect x="128" y="50" width="13" height="26" rx="6.5" transform="rotate(20 134 63)"/>
          <path d="M58 62 C52 78 56 100 70 108 L126 108 C140 108 144 94 140 82 L128 60 Z"/>
        </g>
      </svg>`
    },
    {
      id: 'teeth',
      title: '白白的牙',
      text: '牙齿帮我们咬碎食物。早晚都要刷牙，牙齿才会又白又结实。',
      svg: `<svg viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg">
        <path d="M64 30 C82 20 118 20 136 30 C150 38 152 62 146 82 C142 94 134 90 132 78 L128 58 C126 50 118 50 116 58 L112 80 C110 92 90 92 88 80 L84 58 C82 50 74 50 72 58 L68 78 C66 90 58 94 54 82 C48 62 50 38 64 30 Z" fill="#ffffff" stroke="#cfe0d7" stroke-width="3" stroke-linejoin="round"/>
        <circle cx="60" cy="44" r="7" fill="#eafff2"/>
        <circle cx="140" cy="44" r="7" fill="#eafff2"/>
      </svg>`
    },
    {
      id: 'eyes',
      title: '亮眼睛',
      text: '眼睛能看见颜色和形状。看书要坐正，看久了要望望远方。',
      svg: `<svg viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="100" cy="60" rx="56" ry="34" fill="#ffffff" stroke="#cfe0d7" stroke-width="3"/>
        <circle cx="100" cy="60" r="22" fill="#5aa9e6"/>
        <circle cx="100" cy="60" r="10" fill="#22333f"/>
        <circle cx="94" cy="52" r="5" fill="#ffffff"/>
        <path d="M44 60 C60 30 140 30 156 60" fill="none" stroke="#cfe0d7" stroke-width="4" stroke-linecap="round"/>
      </svg>`
    }
  ]
}

export default album
