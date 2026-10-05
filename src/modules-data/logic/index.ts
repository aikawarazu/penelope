import type { ModuleManifest } from '@/modules/types'

const manifest: ModuleManifest = {
  id: 'logic',
  title: '分分类',
  subtitle: '逻辑思维',
  description: '把小动物和水果送回各自的家，练习分类与归纳。',
  icon: '🧩',
  accent: '#7a8ff5',
  component: () => import('./LogicView.vue')
}

export default manifest
