import type { ModuleManifest } from '@/modules/types'

const manifest: ModuleManifest = {
  id: 'maze-classic',
  title: '走迷宫（经典版）',
  subtitle: '方向键走一走',
  description: '固定关卡的小迷宫，用方向键或按钮带小球走到终点。',
  icon: '🌀',
  accent: '#3fa7ff',
  component: () => import('./MazeView.vue')
}

export default manifest