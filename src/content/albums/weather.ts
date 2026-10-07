import type { Album } from '../types'

/** 专辑：天空的秘密 */
const album: Album = {
  id: 'weather',
  title: '天空的秘密',
  subtitle: '太阳、雨、彩虹和雪花',
  category: 'weather',
  cover: '☁️',
  accent: '#3fa7ff',
  order: 2,
  cards: [
    {
      id: 'sun',
      title: '太阳公公',
      text: '太阳会发光发热，让小花小草慢慢长大。',
      svg: `<svg viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg">
        <g stroke="#ffb703" stroke-width="5" stroke-linecap="round">
          <line x1="100" y1="20" x2="100" y2="8"/>
          <line x1="100" y1="112" x2="100" y2="100"/>
          <line x1="150" y1="60" x2="162" y2="60"/>
          <line x1="38" y1="60" x2="50" y2="60"/>
          <line x1="135" y1="25" x2="144" y2="16"/>
          <line x1="56" y1="104" x2="65" y2="95"/>
          <line x1="135" y1="95" x2="144" y2="104"/>
          <line x1="56" y1="16" x2="65" y2="25"/>
        </g>
        <circle cx="100" cy="60" r="30" fill="#ffd166"/>
        <circle cx="90" cy="54" r="3" fill="#7a5b1e"/>
        <circle cx="110" cy="54" r="3" fill="#7a5b1e"/>
        <path d="M90 68 Q100 78 110 68" stroke="#7a5b1e" stroke-width="3" fill="none" stroke-linecap="round"/>
      </svg>`
    },
    {
      id: 'rain',
      title: '下雨啦',
      text: '云里的小水滴变重了，就会落下来变成雨，去喂饱泥土。',
      svg: `<svg viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="70" cy="42" rx="34" ry="22" fill="#cfe3ef"/>
        <ellipse cx="105" cy="38" rx="30" ry="24" fill="#cfe3ef"/>
        <ellipse cx="135" cy="46" rx="26" ry="18" fill="#cfe3ef"/>
        <g fill="#5aa9e6">
          <circle cx="60" cy="82" r="5"/>
          <circle cx="85" cy="94" r="5"/>
          <circle cx="110" cy="80" r="5"/>
          <circle cx="135" cy="96" r="5"/>
          <circle cx="150" cy="84" r="5"/>
        </g>
        <rect x="10" y="106" width="180" height="14" rx="6" fill="#a2704a"/>
      </svg>`
    },
    {
      id: 'rainbow',
      title: '彩虹桥',
      text: '雨停了，阳光穿过小水滴，天上就架起一座七色的小桥。',
      svg: `<svg viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 110 A80 80 0 0 1 180 110" fill="none" stroke="#ef4444" stroke-width="10" stroke-linecap="round"/>
        <path d="M34 110 A66 66 0 0 1 166 110" fill="none" stroke="#f59e0b" stroke-width="10" stroke-linecap="round"/>
        <path d="M48 110 A52 52 0 0 1 152 110" fill="none" stroke="#facc15" stroke-width="10" stroke-linecap="round"/>
        <path d="M62 110 A38 38 0 0 1 138 110" fill="none" stroke="#22c55e" stroke-width="10" stroke-linecap="round"/>
        <path d="M76 110 A24 24 0 0 1 124 110" fill="none" stroke="#3b82f6" stroke-width="10" stroke-linecap="round"/>
        <circle cx="30" cy="30" r="12" fill="#ffd166"/>
      </svg>`
    },
    {
      id: 'snow',
      title: '小雪花',
      text: '天很冷的时候，云里的小水滴变成六角形的雪花飘下来。',
      svg: `<svg viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg">
        <g stroke="#5aa9e6" stroke-width="5" stroke-linecap="round">
          <line x1="100" y1="18" x2="100" y2="102"/>
          <line x1="64" y1="38" x2="136" y2="82"/>
          <line x1="136" y1="38" x2="64" y2="82"/>
          <line x1="100" y1="30" x2="86" y2="46"/>
          <line x1="100" y1="30" x2="114" y2="46"/>
          <line x1="100" y1="90" x2="86" y2="74"/>
          <line x1="100" y1="90" x2="114" y2="74"/>
        </g>
      </svg>`
    }
  ]
}

export default album
