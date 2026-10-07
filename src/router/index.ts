import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    {
      // 模块路由统一走这一个入口，具体组件由 registry 动态解析。
      // 末尾的 rest 交给模块自己当子路由用（例如 /m/science/album/plants）。
      path: '/m/:id/:rest(.*)?',
      name: 'module',
      component: () => import('@/views/ModuleView.vue')
    },
    { path: '/:pathMatch(.*)*', redirect: '/' }
  ]
})
