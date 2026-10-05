import type { ModuleManifest } from '@/modules/types'

const manifest: ModuleManifest = {
  id: 'science',
  title: '科普小课堂',
  subtitle: '用图画认识世界',
  description: '一页页科普小卡片，配合 SVG 插画，带宝宝认识自然。',
  icon: '🌱',
  accent: '#4caf7d',
  component: () => import('./ScienceView.vue')
}

export default manifest
