import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
import type { Router } from 'vue-router'
import { usePermissionStore } from '@/stores/permission'
import { useUserStore } from '@/stores/user'

NProgress.configure({ showSpinner: false })

const WHITE_LIST = ['/login']

export function setupRouterGuard(router: Router) {
  router.beforeEach(async (to) => {
    NProgress.start()
    const userStore = useUserStore()

    if (!userStore.token) {
      return WHITE_LIST.includes(to.path)
        ? true
        : { path: '/login', query: { redirect: to.fullPath } }
    }
    if (to.path === '/login') return { path: '/' }
    if (userStore.userInfo) return true

    try {
      const info = await userStore.fetchUserInfo()
      usePermissionStore().generateRoutes(info.role)
      // 动态路由刚注册，需要重新解析一次目标地址
      return { path: to.path, query: to.query, hash: to.hash, replace: true }
    } catch {
      userStore.reset()
      return { path: '/login', query: { redirect: to.fullPath } }
    }
  })

  router.afterEach((to) => {
    NProgress.done()
    const title = import.meta.env.VITE_APP_TITLE
    document.title = to.meta.title ? `${to.meta.title} - ${title}` : title
  })
}
