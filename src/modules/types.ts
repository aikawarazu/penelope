import type { Component } from 'vue'

/**
 * 一个学习模块的元信息（manifest）。
 *
 * 每个模块放在 src/modules-data/<id>/ 目录下，
 * 其 index.ts 默认导出符合本接口的 manifest 即可被自动发现：
 *   - 首页卡片、路由、懒加载全部由 registry 自动生成
 *   - 新增模块：新建文件夹 + index.ts + 视图组件
 *   - 删除模块：直接删掉文件夹
 * registry / router / 首页均无需改动任何代码
 */
export interface ModuleManifest {
  /** 唯一 id，同时用作路由 /m/:id，建议与目录名一致 */
  id: string
  /** 展示标题 */
  title: string
  /** 副标题（可选） */
  subtitle?: string
  /** 一句话简介，展示在首页卡片与模块页顶部 */
  description: string
  /** 卡片图标，可用 emoji 或 SVG 标识 */
  icon: string
  /** 主题色（十六进制），卡片描边与模块内按钮配色 */
  accent: string
  /** 模块视图，必须懒加载以便按需下载 */
  component: () => Promise<{ default: Component }>
}
