# Penelope · 佩佩启蒙乐园

面向婴幼儿的启蒙 PWA：科普看图卡 + 可打印的益智玩法。
名字取自 Penelope —— 一针一线耐心编织，寓意陪宝宝一点点认识世界。

## 运行

```bash
npm install
npm run dev      # 开发
npm run build    # 类型检查 + 生产构建（含 PWA 离线缓存）
npm run preview  # 预览生产包

VITE_SHOW_LAB=1 npm run dev   # 额外把 src/modules-lab 下开发中的模块也挂出来
```

构建后可直接「添加到主屏幕」离线使用。

## 技术栈

Vite + Vue 3 + TypeScript + vue-router + Pinia + vite-plugin-pwa

## 信息架构

站点分两层：**内容层**（看什么）与**模块层**（玩什么）。

```
首页
├─ 品牌区 + 全站统计（几本专辑 / 几张卡片 / 几个玩法）
├─ 科普小课堂          ← 内容层：分类筛选 + 专辑网格 + 「查看全部」
└─ 玩一玩              ← 模块层：工具卡片

/m/science             分类 tabs + 全部课程
/m/science/course/<id> 单门课阅读器（引言 → 每一步 → 小结，可深链分享、记住学到第几步）
/m/maze                走迷宫
```

这样做的原因：内容会越加越多，扁平的一页页卡片找不到东西；分类 + 专辑两层结构，
加内容时只需要往 `src/content/albums/` 里丢文件，导航、计数、进度全部自动跟上。

### 内容层 `src/content/`

| 文件 | 职责 |
| --- | --- |
| `types.ts` | `Category` / `Course` / `Step` / `StepQuiz` 数据结构 |
| `categories.ts` | 分类表（食物 / 自然 / 天气 / 动物 / 身体…） |
| `courses/*.ts` | 每门课一个文件，**自动发现** |
| `registry.ts` | `import.meta.glob` 扫描 + 按分类查询 + 全站计数 |
| `progress.ts` | localStorage 学习进度（学到第几步、看过哪些、问答作答） |

一门课的形态有三种：

- **`kind: 'scene'` 场景动画课**（品质最高，讲过程）
  不是「每步一张图」，而是**一幅连贯的大场景**（如 1200×560 的牧场全景）。
  容器上加 `st1…stN` 状态类，由课程自带的 CSS 驱动动画：牛头摆动、咀嚼、气泡上浮、
  血液快递、乳房出奶、加热炉点火……整节课是同一个连续的世界。
  配套：自动播放 + 配音朗读 + 气泡字 + 完成徽章 + 「你知道吗」知识卡。
  样板：`courses/milk.ts`（草是怎么变成牛奶的）。
- **`kind: 'course'` 分步讲解课**：每步一张插画，有严格先后。
- **`kind: 'gallery'` 图卡集**：同主题的一组插画，顺序不敏感（如「农场小伙伴」）。

一门课的组成部分：`intro`（封面页）→ `steps[]`（每一步）→ `summary`（回顾）。
每一步可带 `caption`（图注）、`quiz`（小问答）、`dur`（自动播放停留毫秒）、`pop`（气泡字）。
课程还可带 `facts[]`（知识卡）与 `footer`。

**新增一门课**：在 `src/content/courses/` 下新建一个文件，默认导出 `Course` 即可，
首页、课程列表、计数全部自动更新，不需要改任何注册表。

```ts
import type { Course } from '../types'

const course: Course = {
  id: 'milk',                 // 路由 /m/science/course/milk
  title: '草是怎么变成牛奶的',
  subtitle: '一杯牛奶的六段旅行',
  category: 'food',           // 对应 categories.ts 里的 id
  kind: 'course',
  cover: '🥛',
  accent: '#22b8a6',
  order: 1,                   // 展示顺序，小的在前
  age: '3-6 岁',
  intro: '每天早上喝的那杯牛奶，最开始是一片绿绿的草……',
  steps: [
    {
      id: 'grass',
      title: '1 · 一片青青的草地',
      text: '牛奶的故事从草开始……',
      caption: '小草把阳光和雨水，变成自己身体里的营养。',
      svg: '<svg viewBox="0 0 200 120" …>',
      quiz: { question: '牛奶最开始是从哪里来的？', options: ['…', '…', '…'], answer: 0, explain: '…' }
    }
  ],
  summary: '草 → 奶牛吃草 → …… 原来每天那杯牛奶走了这么远的路。'
}

export default course
```

**插画约定**：
- 图卡课：统一 `viewBox="0 0 200 120"`，同一门课保持同一套配色和主角。
- 场景课：一幅大画面（建议 `viewBox="0 0 1200 560"`），所有步骤的元素都画进去，
  靠 `st1…stN` 控制显隐与动画；动画样式写在 `scene.css` 里，只在课程打开时注入、离开时移除。

**配音**：不打包音频文件（离线包会爆），改用浏览器自带的 `speechSynthesis` 朗读步骤文案，
零字节、可静音。

**场景课新增步骤的小抄**：
1. 在场景 SVG 里加好这一步要显示／动起来的元素，给它们 id 或 class；
2. 在 `scene.css` 里加 `.scene.stN #xxx { … }` / `@keyframes`；
3. 在 `steps[]` 里加一项（title / text / dur / pop / quiz）。
播放器、进度条、圆点、自动播放全部自动跟上。

### 模块层 `src/modules/`

| 文件 | 职责 |
| --- | --- |
| `types.ts` | `ModuleManifest` 接口（`kind: 'tool' \| 'library'`） |
| `registry.ts` | 自动发现 `modules-data`（已发布）与 `modules-lab`（开发中） |

- `kind: 'library'` 的模块（内容库）首页直接铺开内容；`kind: 'tool'` 的模块以卡片入口呈现。
- 路由是 `/m/:id/:rest(.*)?`，末尾的 `rest` 交给模块自己当子路由用 —— 所以专辑阅读器可以深链分享。
- 开发中的模块放 `src/modules-lab/`，**默认完全不注册**（生产包里也不会打进去），
  需要调试时 `VITE_SHOW_LAB=1 npm run dev`，页面上会带「实验室」标记。测试通过后
  把目录 `mv` 到 `src/modules-data/` 就正式上线。

## 目录结构

```
src/
  content/            # 内容层：分类 / 课程 / 步骤 / 学习进度
    courses/          # 一个文件一门课，自动发现
  modules/
    types.ts          # ModuleManifest 接口
    registry.ts       # 自动发现模块（含实验室开关）
  router/             # 首页 + 通用模块路由（支持子路径）
  views/
    HomeView.vue      # 品牌区 + 内容区 + 工具区
    ModuleView.vue    # 按 id 动态渲染模块组件
  components/         # AppHeader（品牌 + 模块导航）
  modules-data/       # 已发布模块
    science/          # 科普小课堂（内容库）
    maze/             # 走迷宫（迷宫生成器）
  modules-lab/        # 开发中模块，默认不注册
  lib/puzzle/         # 益智类模块的公共底座
```

## 现有模块

| id | 名称 | 形态 | 说明 |
| --- | --- | --- | --- |
| `science` | 科普小课堂 | 内容库 | 5 门课 19 个步骤：分步讲解 + 图注 + 小问答，分类筛选、记住学到第几步 |
| `maze` | 走迷宫 | 工具 | **可以在线走**：方向键 / 屏幕按钮 / 滑动 / 点相邻格；也能导出 PDF（含答案页）/ PNG / SVG 打印 |

### 开发中（`src/modules-lab/`，暂未上线）

| id | 名称 | 说明 |
| --- | --- | --- |
| `bingo` | 图形宾果 | 3×3 / 4×4 / 5×5，最多 30 张唯一卡 + 呼叫清单 |
| `find` | 图形找找看 | 目标图形横 / 竖 / 斜藏进干扰图形里 |
| `nonogram` | 数织画 | 12 个内置像素图案或手绘，自动生成行列线索 |
| `sudoku` | 图形数独 | 4×4 / 6×6 / 9×9 + 4 档难度，保证唯一解 |
| `jigsaw` | 拼图 | 已从站点下线（交互不好用），代码保留待处理 |
| `math` / `logic` / `maze-classic` | 早期小模块 | 数一数 / 分分类 / 经典走迷宫小游戏 |

> 这几个模块代码已完成并跑过测试，只是按当前产品范围先藏着；
> 要上线就 `mv src/modules-lab/<id> src/modules-data/`，首页自动出现。

## 公共底座 `src/lib/puzzle/`

| 文件 | 职责 |
| --- | --- |
| `rng.ts` | mulberry32 种子随机 —— 相同设置 + 相同种子必然复现同一份题 |
| `pdf.ts` | 零依赖 PDF 写入器，每页嵌一张 JPEG（/DCTDecode） |
| `download.ts` | Blob 下载、`canvas.toBlob`、多画布合并成多页 PDF |
| `paper.ts` | A4 / Letter / A3 尺寸、方向判定、内容铺进可打印区域 |
| `pictures.ts` | 4 套幼儿图形库（动物 / 水果 / 交通工具 / 生活用品，各 24 个） |
| `canvas2d.ts` | 圆角矩形、emoji 字体栈、居中文字、颜色插值等绘制辅助 |

界面样式复用 `src/style.css` 里的 `.puzzle-*` 类，新增模块不需要再写一遍 CSS。

### 益智类模块的统一结构

以 `maze` 为例，视图只负责调参与交互，逻辑全在 `lib/` 下，可单独复用或跑 Node 测试：

| 文件 | 职责 |
| --- | --- |
| `lib/generate.ts` | 纯逻辑生成器（无 DOM 依赖） |
| `lib/solve.ts` | 求解 / 校验 |
| `lib/geometry.ts` | 几何抽取 |
| `lib/render.ts` | Canvas 绘制，**预览与导出共用同一套函数**，所见即所得 |
| `lib/renderSvg.ts` | 矢量 SVG 输出 |
| `lib/export.ts` | PDF（第 1 页题目 + 第 2 页答案）/ PNG / SVG |
| `lib/worker.ts` | 大尺寸迷宫放 Web Worker，避免卡住界面 |
