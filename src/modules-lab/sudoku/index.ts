import type { ModuleManifest } from '@/modules/types'

const manifest: ModuleManifest = {
  id: 'sudoku',
  title: '图形数独',
  subtitle: '逻辑推理',
  description: '用水果图形代替数字，每行每列每宫都不重复，解法唯一。',
  icon: '🔢',
  accent: '#3fa7ff',
  component: () => import('./SudokuView.vue')
}

export default manifest