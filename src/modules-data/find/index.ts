import type { ModuleManifest } from '@/modules/types'

const manifest: ModuleManifest = {
  id: 'find',
  title: '图形找找看',
  subtitle: '视觉搜索',
  description: '把目标图形藏进一整片图形里，横着竖着斜着把它们整条找出来。',
  icon: '🔍',
  accent: '#f5a524',
  component: () => import('./FindView.vue')
}

export default manifest