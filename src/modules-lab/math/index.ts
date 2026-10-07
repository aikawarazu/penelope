import type { ModuleManifest } from '@/modules/types'

const manifest: ModuleManifest = {
  id: 'math',
  title: '数一数',
  subtitle: '数学启蒙',
  description: '数一数有几个水果，认识 1 到 5 的数量。',
  icon: '🍎',
  accent: '#ff8f6b',
  component: () => import('./MathView.vue')
}

export default manifest
