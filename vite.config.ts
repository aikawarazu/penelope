import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import { copyFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Penelope · 佩佩启蒙乐园',
        short_name: '佩佩',
        description: '面向婴幼儿的科普、数学、逻辑与迷宫启蒙内容平台',
        lang: 'zh-CN',
        theme_color: '#4caf7d',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }
        ]
      }
    }),
    {
      // history 模式下 /m/:id 等深链在静态托管上会 404，
      // 复制 index.html 为 404.html 作为 SPA 回退页
      name: 'spa-404-fallback',
      apply: 'build',
      closeBundle() {
        const outDir = fileURLToPath(new URL('./dist', import.meta.url))
        copyFileSync(`${outDir}/index.html`, `${outDir}/404.html`)
      }
    }
  ],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) }
  }
})
