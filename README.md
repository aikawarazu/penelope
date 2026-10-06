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
```

## 现有模块

| id | 名称 | 说明 |
| --- | --- | --- |
| `science` | 科普小课堂 | SVG 插画科普卡片，左右翻页 |
| `math` | 数一数 | 1~5 的数量认知，点选作答 |
| `logic` | 分分类 | 动物 / 水果归类 |
| `maze` | 走迷宫 | SVG 迷宫，方向键或按钮移动 |
| `maze-generator` | 迷宫生成器 | 3 种算法 + 5 档难度，导出 PDF（含答案页）/ PNG / SVG |

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
