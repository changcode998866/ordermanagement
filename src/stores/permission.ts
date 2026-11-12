import { defineStore } from 'pinia'
import { shallowRef } from 'vue'
import type { RouteRecordRaw } from 'vue-router'
import router from '@/router'
import { asyncRoutes } from '@/router/routes'
import type { Role } from '@/types/models'

function filterRoutes(routes: RouteRecordRaw[], role: Role): RouteRecordRaw[] {
  return routes
    .filter((route) => !route.meta?.roles || route.meta.roles.includes(role))
    .map((route) =>
      route.children
        ? ({ ...route, children: filterRoutes(route.children, role) } as RouteRecordRaw)
        : route,
    )
}

export const usePermissionStore = defineStore('permission', () => {
  /** 当前角色可访问的路由，用于生成菜单 */
  const menuRoutes = shallowRef<RouteRecordRaw[]>([])
  let removers: (() => void)[] = []

  function generateRoutes(role: Role) {
    const accessed = filterRoutes(asyncRoutes, role)
    removers = accessed.map((route) => router.addRoute('Root', route))
    menuRoutes.value = accessed
  }

  function resetRoutes() {
    removers.forEach((remove) => remove())
    removers = []
    menuRoutes.value = []
  }

  return { menuRoutes, generateRoutes, resetRoutes }
})
