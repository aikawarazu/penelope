# Penelope · 佩佩启蒙乐园

面向婴幼儿的启蒙 PWA：科普（SVG 插画）、数学、逻辑、迷宫。
名字取自 Penelope —— 一针一线耐心编织，寓意陪宝宝一点点认识世界。

## 运行

```bash
npm install
npm run dev      # 开发
npm run build    # 类型检查 + 生产构建（含 PWA 离线缓存）
npm run preview  # 预览生产包
```

构建后可直接「添加到主屏幕」离线使用。

## 技术栈

Vite + Vue 3 + TypeScript + vue-router + Pinia + vite-plugin-pwa

## 核心：模块是可插拔的

所有学习模块放在 `src/modules-data/` 下，**一个模块 = 一个文件夹**，由
`src/modules/registry.ts` 通过 `import.meta.glob` 自动发现。
首页卡片、路由、代码分包全部自动生成，**新增/删除模块不需要改 registry、router 或首页**。

### 新增一个模块

1. 新建目录 `src/modules-data/<id>/`
2. 写视图组件 `MyView.vue`
3. 写 `index.ts`，默认导出 manifest：

```ts
import type { ModuleManifest } from '@/modules/types'

const manifest: ModuleManifest = {
  id: 'my-module',        // 与目录名一致，同时是路由 /m/my-module
  title: '我的模块',
  subtitle: '副标题',
  description: '首页卡片上的一句话简介',
  icon: '🌟',              // emoji 或图标
  accent: '#4caf7d',       // 主题色
  component: () => import('./MyView.vue')   // 必须懒加载
}

export default manifest
```

保存即可，首页自动出现卡片。删除模块：直接删掉该文件夹。

## 目录结构

```
src/
  modules/
    types.ts        # ModuleManifest 接口
    registry.ts     # 自动发现所有模块
  router/           # 首页 + 通用模块路由 /m/:id
  views/
    HomeView.vue    # 自动列出所有模块
    ModuleView.vue  # 按 id 动态渲染模块组件
  modules-data/
    science/        # 科普（SVG 幻灯片）
    math/           # 数一数
    logic/          # 分分类
    maze/           # 走迷宫（小游戏）
    maze-generator/ # 迷宫生成器（可打印导出）
    bingo/          # 图形宾果卡
    find/           # 图形找找看
    nonogram/       # 数织画
    sudoku/         # 图形数独
    jigsaw/         # 拼图
  lib/
    puzzle/         # 所有拼图类模块的公共底座
```

## 现有模块

| id | 名称 | 说明 |
| --- | --- | --- |
| `science` | 科普小课堂 | SVG 插画科普卡片，左右翻页 |
| `math` | 数一数 | 1~5 的数量认知，点选作答 |
| `logic` | 分分类 | 动物 / 水果归类 |
| `maze` | 走迷宫 | SVG 迷宫，方向键或按钮移动 |
| `maze-generator` | 迷宫生成器 | 3 种算法 + 5 档难度，导出 PDF（含答案页）/ PNG / SVG |
| `bingo` | 图形宾果 | 3×3 / 4×4 / 5×5，最多 30 张唯一卡 + 呼叫清单，PDF 每页 1 或 4 张 |
| `find` | 图形找找看 | 目标图形横 / 竖 / 斜藏进干扰图形里，PDF 含答案页 |
| `nonogram` | 数织画 | 12 个内置像素图案或自己手绘，自动生成行列线索，PDF 含答案页 |
| `sudoku` | 图形数独 | 4×4 / 6×6 / 9×9 + 4 档难度，**保证唯一解**，一次可出 9 题 |
| `jigsaw` | 拼图 | 内置图案 + 6 种外形 + 4~25 片，PDF 打印模板（含涂色版）+ SVG 刀路 |

后 5 个模块都是「**生成器 + 在线可玩**」双形态：既能调参导出打印稿，也能直接在页面上玩（点选 / 拖拽 / 填色）。

### 公共底座 `src/lib/puzzle/`

被所有拼图类模块共用，避免每个模块重写一遍导出逻辑：

| 文件 | 职责 |
| --- | --- |
| `rng.ts` | mulberry32 种子随机 —— 相同设置 + 相同种子必然复现同一份题 |
| `pdf.ts` | 零依赖 PDF 写入器，每页嵌一张 JPEG（/DCTDecode） |
| `download.ts` | Blob 下载、`canvas.toBlob`、多画布合并成多页 PDF |
| `paper.ts` | A4 / Letter / A3 尺寸、方向判定、内容铺进可打印区域 |
| `pictures.ts` | 4 套幼儿图形库（动物 / 水果 / 交通工具 / 生活用品，各 24 个） |
| `canvas2d.ts` | 圆角矩形、emoji 字体栈、居中文字、颜色插值等绘制辅助 |

界面样式复用 `src/style.css` 里的 `.puzzle-*` 类，新增模块不需要再写一遍 CSS。

### `maze-generator` 内部结构

迷宫相关的全部逻辑都在 `src/modules-data/maze-generator/lib/` 下，与 UI 解耦，可单独复用：

| 文件 | 职责 |
| --- | --- |
| `rng.ts` | mulberry32 种子随机 —— 相同设置 + 相同种子必然复现同一张迷宫 |
| `generate.ts` | 递归回溯 / 随机化 Prim / 随机化 Kruskal 三种生成算法 + 编织（按比率打通死角） |
| `solve.ts` | BFS 求最短通路、统计死角数 |
| `geometry.ts` | 把墙体抽成去重线段，并留出起点入口 / 终点出口开口 |
| `render.ts` | Canvas 绘制（预览、PNG、PDF 共用同一套几何） |
| `renderSvg.ts` | 矢量 SVG 输出，全部墙体合并为单条 path |
| `pdf.ts` | 零依赖 PDF 写入器，每页嵌一张 JPEG |
| `export.ts` | PDF（第 1 页题目 + 第 2 页答案）/ PNG / SVG 导出与下载 |
| `worker.ts` | 大尺寸迷宫放到 Web Worker 生成，避免卡住界面 |

### `bingo` / `find` / `nonogram` / `sudoku` / `jigsaw` 内部结构

5 个模块结构一致：视图组件只负责调参与交互，逻辑全放在各自的 `lib/` 下，方便单独复用或改成别的形态。

- `lib/types.ts` 预设常量（难度、尺寸、图形集）
- `lib/generate.ts`（或 `sudoku.ts` / `paths.ts`）纯逻辑生成器，无 DOM 依赖，可在 Node 里直接跑测试
- `lib/render.ts` Canvas 绘制，**预览与导出共用同一套绘制函数**，所见即所得
- `lib/export.ts` PDF / PNG / SVG 导出，PDF 一般「第 1 页题目 + 第 2 页答案」
