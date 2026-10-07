import type { ModuleManifest } from '@/modules/types'

const manifest: ModuleManifest = {
  id: 'science',
  title: '科普小课堂',
  subtitle: '用图画认识世界',
  description: '按分类挑一本专辑，一页页看图听故事，记住宝宝看到哪。',
  icon: '🌱',
  accent: '#4caf7d',
  kind: 'library',
  component: () => import('./ScienceView.vue')
}

export default manifest
