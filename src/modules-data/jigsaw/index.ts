import type { ModuleManifest } from '@/modules/types'

const manifest: ModuleManifest = {
  id: 'jigsaw',
  title: '拼图',
  subtitle: '动手动脑',
  description: '内置可爱图案，切成 4 到 25 片，可以打印也可以直接拖着装起来。',
  icon: '🧩',
  accent: '#22b8a6',
  component: () => import('./JigsawView.vue')
}

export default manifest