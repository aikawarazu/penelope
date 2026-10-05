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
    maze/           # 走迷宫
```

## 现有模块

| id | 名称 | 说明 |
| --- | --- | --- |
| `science` | 科普小课堂 | SVG 插画科普卡片，左右翻页 |
| `math` | 数一数 | 1~5 的数量认知，点选作答 |
| `logic` | 分分类 | 动物 / 水果归类 |
| `maze` | 走迷宫 | SVG 迷宫，方向键或按钮移动 |
