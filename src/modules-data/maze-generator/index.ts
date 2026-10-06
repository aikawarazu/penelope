import type { ModuleManifest } from '@/modules/types'

const manifest: ModuleManifest = {
  id: 'maze-generator',
  title: '迷宫生成器',
  subtitle: '可打印 · 带答案',
  description: '选难度、挑算法，生成可打印的迷宫，支持 PDF / PNG / SVG 导出。',
  icon: '📐',
  accent: '#3fa7ff',
  component: () => import('./MazeGeneratorView.vue')
}

export default manifest
