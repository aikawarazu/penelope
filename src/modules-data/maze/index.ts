import type { ModuleManifest } from '@/modules/types'

const manifest: ModuleManifest = {
  id: 'maze',
  title: '走迷宫',
  subtitle: '空间与专注',
  description: '用方向键或按钮带小球走到终点，锻炼空间感。',
  icon: '🌀',
  accent: '#3fa7ff',
  component: () => import('./MazeView.vue')
}

export default manifest
