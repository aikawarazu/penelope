import type { ModuleManifest } from '@/modules/types'

const manifest: ModuleManifest = {
  id: 'nonogram',
  title: '数织画',
  subtitle: '按数字涂格子',
  description: '照着行列数字把格子涂满，图案就慢慢显出来啦。',
  icon: '🎨',
  accent: '#7c6cf0',
  component: () => import('./NonogramView.vue')
}

export default manifest