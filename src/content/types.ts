/** 内容层数据结构：分类 → 专辑 → 卡片 */

export interface Category {
  /** 唯一 id，专辑通过 category 字段挂载到分类下 */
  id: string
  label: string
  emoji: string
  /** 分类主题色，卡片描边与页头配色 */
  accent: string
}

export interface Card {
  id: string
  title: string
  text: string
  /** 内嵌 SVG 插画（自家内容，直接 v-html 渲染） */
  svg: string
}

export interface Album {
  /** 唯一 id，同时用作路由 /m/<module>/album/<id> */
  id: string
  title: string
  subtitle: string
  /** 所属分类 id，必须是 categories 里存在的 */
  category: string
  /** 封面 emoji */
  cover: string
  accent: string
  /** 展示顺序，数字小的排前面（可选，缺省按 id 排） */
  order?: number
  cards: Card[]
}
