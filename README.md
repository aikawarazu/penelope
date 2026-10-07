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

/m/science             分类 tabs + 全部专辑
/m/science/album/<id>  单本专辑阅读器（可深链分享、记住读到第几张）
/m/maze                走迷宫
```

这样做的原因：内容会越加越多，扁平的一页页卡片找不到东西；分类 + 专辑两层结构，
加内容时只需要往 `src/content/albums/` 里丢文件，导航、计数、进度全部自动跟上。

### 内容层 `src/content/`

| 文件 | 职责 |
| --- | --- |
| `types.ts` | `Category` / `Album` / `Card` 数据结构 |
| `categories.ts` | 分类表（自然 / 天气 / 动物 / 身体…） |
| `albums/*.ts` | 每个专辑一个文件，**自动发现** |
| `registry.ts` | `import.meta.glob` 扫描 + 按分类查询 + 全站计数 |
| `progress.ts` | localStorage 阅读进度（读到第几张、看过哪些） |

**新增一本专辑**：在 `src/content/albums/` 下新建一个文件，默认导出 `Album` 即可，
首页、专辑列表、计数全部自动更新，不需要改任何注册表。

```ts
import type { Album } from '../types'

const album: Album = {
  id: 'ocean',            // 路由 /m/science/album/ocean
  title: '大海里',
  subtitle: '鱼、贝壳和海浪',
  category: 'nature',     // 对应 categories.ts 里的 id
  cover: '🐟',
  accent: '#3fa7ff',
  order: 5,               // 展示顺序，小的在前
  cards: [{ id: 'fish', title: '小鱼', text: '…', svg: '<svg …>' }]
}

export default album
```

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
  content/            # 内容层：分类 / 专辑 / 卡片 / 阅读进度
    albums/           # 一个文件一本专辑，自动发现
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
| `science` | 科普小课堂 | 内容库 | 4 本专辑 13 张 SVG 卡片，分类筛选、记住阅读进度 |
| `maze` | 走迷宫 | 工具 | 3 种算法 + 5 档难度，导出 PDF（含答案页）/ PNG / SVG |
| `jigsaw` | 拼图 | 工具 | 8 种图案 × 6 种外形 × 4~25 片；在线拖拽拼图 + PDF 打印模板（含涂色版）+ SVG 刀路 |

### 开发中（`src/modules-lab/`，暂未上线）

| id | 名称 | 说明 |
| --- | --- | --- |
| `bingo` | 图形宾果 | 3×3 / 4×4 / 5×5，最多 30 张唯一卡 + 呼叫清单 |
| `find` | 图形找找看 | 目标图形横 / 竖 / 斜藏进干扰图形里 |
| `nonogram` | 数织画 | 12 个内置像素图案或手绘，自动生成行列线索 |
| `sudoku` | 图形数独 | 4×4 / 6×6 / 9×9 + 4 档难度，保证唯一解 |
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
