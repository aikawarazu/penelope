import type { ModuleManifest } from '@/modules/types'

const manifest: ModuleManifest = {
  id: 'bingo',
  title: '图形宾果',
  subtitle: '认一认 · 找一找',
  description: '3×3 / 4×4 / 5×5 图形宾果卡，可一次生成多张并打印，带呼叫清单。',
  icon: '🎯',
  accent: '#ff8f6b',
  component: () => import('./BingoView.vue')
}

export default manifest