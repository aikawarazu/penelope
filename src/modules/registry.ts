import type { ModuleManifest } from './types'

/**
 * 自动发现所有模块：扫描 src/modules-data/*\/index.ts。
 * 模块的增删只需在 modules-data 下增删文件夹，
 * 这里不需要任何手工维护。
 */
const published = import.meta.glob<{ default: ModuleManifest }>(
  '../modules-data/*/index.ts',
  { eager: true }
)

/**
 * 开发中的模块放在 src/modules-lab/：默认完全不注册（生产包里也看不到入口）。
 * 需要本地调试时：`VITE_SHOW_LAB=1 npm run dev`
 */
const lab = import.meta.glob<{ default: ModuleManifest }>('../modules-lab/*/index.ts', {
  eager: true
})

const showLab = import.meta.env.VITE_SHOW_LAB === '1'

function collect(
  source: Record<string, { default: ModuleManifest }>,
  isLab: boolean
): ModuleManifest[] {
  return Object.values(source)
    .map((mod) => mod?.default)
    .filter((m): m is ModuleManifest => Boolean(m) && Boolean(m.id))
    .map((m) => (isLab ? { ...m, lab: true } : m))
}

export const moduleRegistry: ModuleManifest[] = [
  ...collect(published, false),
  ...(showLab ? collect(lab, true) : [])
].sort((a, b) => a.id.localeCompare(b.id))

/** 内容库类模块（首页直接铺开内容） */
export const libraryModules: ModuleManifest[] = moduleRegistry.filter((m) => m.kind === 'library')

/** 工具类模块（首页以卡片入口呈现） */
export const toolModules: ModuleManifest[] = moduleRegistry.filter((m) => m.kind !== 'library')

export function getModule(id: string): ModuleManifest | undefined {
  return moduleRegistry.find((m) => m.id === id)
}
