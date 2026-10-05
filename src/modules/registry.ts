import type { ModuleManifest } from './types'

/**
 * 自动发现所有模块：扫描 src/modules-data/*\/index.ts。
 * 模块的增删只需在 modules-data 下增删文件夹，
 * 这里不需要任何手工维护。
 */
const discovered = import.meta.glob<{ default: ModuleManifest }>(
  '../modules-data/*/index.ts',
  { eager: true }
)

export const moduleRegistry: ModuleManifest[] = Object.values(discovered)
  .map((mod) => mod?.default)
  .filter((m): m is ModuleManifest => Boolean(m) && Boolean(m.id))
  .sort((a, b) => a.id.localeCompare(b.id))

export function getModule(id: string): ModuleManifest | undefined {
  return moduleRegistry.find((m) => m.id === id)
}
