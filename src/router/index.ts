import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    {
      path: '/m/:id',
      name: 'module',
      // 模块路由统一走这一个入口，具体组件由 registry 动态解析
      component: () => import('@/views/ModuleView.vue')
    }
  ]
})
