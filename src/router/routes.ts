import { RouterView, type RouteRecordRaw } from 'vue-router'

export const constantRoutes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { title: '登录' },
  },
  {
    path: '/',
    name: 'Root',
    component: () => import('@/layout/index.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: '403',
        name: 'Forbidden',
        component: () => import('@/views/error/403.vue'),
        meta: { title: '无权限', hidden: true },
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/error/404.vue'),
    meta: { title: '页面不存在' },
  },
]

/** 动态路由：登录后根据角色过滤，挂载到 Root 下 */
export const asyncRoutes: RouteRecordRaw[] = [
  {
    path: 'dashboard',
    name: 'Dashboard',
    component: () => import('@/views/dashboard/index.vue'),
    meta: { title: '数据概览', icon: 'Odometer' },
  },
  {
    path: 'order',
    name: 'Order',
    component: RouterView,
    redirect: '/order/list',
    meta: { title: '订单管理', icon: 'Tickets' },
    children: [
      {
        path: 'list',
        name: 'OrderList',
        component: () => import('@/views/order/index.vue'),
        meta: { title: '订单列表' },
      },
      {
        path: 'detail/:id',
        name: 'OrderDetail',
        component: () => import('@/views/order/detail.vue'),
        meta: { title: '订单详情', hidden: true, activeMenu: '/order/list' },
      },
    ],
  },
  {
    path: 'goods',
    name: 'Goods',
    component: RouterView,
    redirect: '/goods/product',
    meta: { title: '商品管理', icon: 'Bowl' },
    children: [
      {
        path: 'product',
        name: 'Product',
        component: () => import('@/views/product/index.vue'),
        meta: { title: '商品列表' },
      },
      {
        path: 'category',
        name: 'Category',
        component: () => import('@/views/category/index.vue'),
        meta: { title: '商品分类' },
      },
    ],
  },
  {
    path: 'store',
    name: 'Store',
    component: () => import('@/views/store/index.vue'),
    meta: { title: '门店管理', icon: 'Shop', roles: ['admin'] },
  },
  {
    path: 'coupon',
    name: 'Coupon',
    component: () => import('@/views/coupon/index.vue'),
    meta: { title: '优惠券', icon: 'Ticket' },
  },
  {
    path: 'delivery',
    name: 'Delivery',
    component: () => import('@/views/delivery/index.vue'),
    meta: { title: '配送管理', icon: 'Van' },
  },
  {
    path: 'customer',
    name: 'Customer',
    component: () => import('@/views/customer/index.vue'),
    meta: { title: '用户管理', icon: 'User' },
  },
  {
    path: 'report',
    name: 'Report',
    component: () => import('@/views/report/index.vue'),
    meta: { title: '营业报表', icon: 'DataAnalysis', roles: ['admin'] },
  },
  {
    path: 'system',
    name: 'System',
    component: RouterView,
    redirect: '/system/account',
    meta: { title: '系统管理', icon: 'Setting', roles: ['admin'] },
    children: [
      {
        path: 'account',
        name: 'Account',
        component: () => import('@/views/system/account.vue'),
        meta: { title: '账号管理' },
      },
    ],
  },
]
