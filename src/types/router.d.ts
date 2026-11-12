import 'vue-router'
import type { Role } from './models'

export {}

declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    /** @element-plus/icons-vue 图标组件名 */
    icon?: string
    /** 可访问角色，不填表示所有登录用户可访问 */
    roles?: Role[]
    /** 不在侧边栏显示 */
    hidden?: boolean
    /** 隐藏路由激活的菜单项 */
    activeMenu?: string
  }
}
