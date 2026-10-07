import type { ModuleManifest } from '@/modules/types'

const manifest: ModuleManifest = {
  id: 'maze',
  title: '走迷宫',
  subtitle: '可打印 · 带答案',
  description: '选难度、挑算法，生成一张迷宫，可以打印出来走，也能导出 PDF / PNG / SVG。',
  icon: '🌀',
  accent: '#3fa7ff',
  kind: 'tool',
  component: () => import('./MazeView.vue')
}

export default manifest