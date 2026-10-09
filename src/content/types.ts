/** 内容层数据结构：分类 → 课程 → 步骤 */

export interface Category {
  /** 唯一 id，课程通过 category 字段挂载到分类下 */
  id: string
  label: string
  emoji: string
  /** 分类主题色，卡片描边与页头配色 */
  accent: string
}

/** 每一步的小问答（可选） */
export interface StepQuiz {
  question: string
  options: string[]
  /** 正确选项下标 */
  answer: number
  /** 答对后的说明 */
  explain?: string
}

/** 场景课上浮在画面上的气泡字 */
export interface ScenePop {
  text: string
  /** 相对场景容器的定位，百分比字符串 */
  left?: string
  top?: string
  right?: string
  bottom?: string
}

export interface Step {
  id: string
  /** 小标题 */
  title: string
  /** 讲解正文，一到两句话，念出来要顺口 */
  text: string
  /** 图注：插画旁边的一句短说明（可选） */
  caption?: string
  /** 这一步的小问答（可选） */
  quiz?: StepQuiz
  /** 图卡课：这一步的插画（场景课不需要，画面是共用的） */
  svg?: string
  /** 场景课：自动播放时这一步停留的毫秒数 */
  dur?: number
  /** 场景课：这一步浮出来的气泡字 */
  pop?: ScenePop
}

/**
 * 场景课的画面：不是每步一张图，而是**一幅连贯的大场景**，
 * 通过给容器加 `st1…stN` 状态类来驱动 CSS 动画（吃草、消化、出奶、加热……）。
 * 这样整节课是一个连续的世界，而不是一堆风格不一的插画。
 */
export interface SceneSpec {
  viewBox: string
  /** 整幅场景 SVG，含所有步骤会用到的元素 */
  svg: string
  /** 配合 st1..stN 的动画样式，只在课程被打开时注入 */
  css: string
  /** 最后一步显示的完成徽章 */
  doneBadge?: { title: string; sub: string }
  /** 画面左上角的小旗子标签 */
  flag?: string
}

/** 「你知道吗」知识卡 */
export interface FactItem {
  /** 小图标 SVG */
  icon: string
  title: string
  text: string
}

/**
 * 一门课程的三种形态：
 * - 'scene'   场景动画课：一幅连贯大画面 + 分步状态动画 + 自动播放配音（最高级，讲过程）
 * - 'course'  分步讲解课：每步一张插画，有严格先后
 * - 'gallery' 图卡集：同主题的一组插画，顺序不敏感
 */
export interface Course {
  /** 唯一 id，同时用作路由 /m/<module>/course/<id> */
  id: string
  title: string
  subtitle: string
  /** 所属分类 id，必须是 categories 里存在的 */
  category: string
  kind: 'scene' | 'course' | 'gallery'
  /** 封面 emoji */
  cover: string
  accent: string
  /** 展示顺序，数字小的排前面（可选，缺省按 id 排） */
  order?: number
  /** 适合年龄，如「3-6 岁」 */
  age?: string
  /** 开场引言（作为第一页展示） */
  intro?: string
  /** 场景课的画面定义 */
  scene?: SceneSpec
  /** 课程步骤 */
  steps: Step[]
  /** 收尾小结（作为最后一页展示） */
  summary?: string
  /** 「你知道吗」板块的标题 */
  factsTitle?: string
  facts?: FactItem[]
  footer?: string
}
