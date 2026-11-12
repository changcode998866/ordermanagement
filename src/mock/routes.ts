import dayjs from 'dayjs'
import { omit } from 'lodash-es'
import type { Account, OrderAction, OrderStatus, Product, Role, UserInfo } from '@/types/models'
import {
  define,
  isEmpty,
  matchKeyword,
  MockError,
  paginate,
  type MockRequest,
  type Query,
} from './core'
import {
  accounts,
  categories,
  coupons,
  createOrder,
  customers,
  letterAvatar,
  nextId,
  now,
  orders,
  products,
  rand,
  riders,
  stores,
} from './db'

const PERMISSIONS: Record<Role, string[]> = {
  admin: ['*'],
  operator: [
    'product:edit',
    'category:edit',
    'order:operate',
    'order:export',
    'coupon:edit',
    'rider:edit',
    'customer:edit',
  ],
}

const eq = (value: unknown, target: unknown) => isEmpty(value) || String(value) === String(target)

interface CrudOptions<T> {
  filter?: (item: T, query: Query) => boolean
  output?: (item: T) => unknown
  validate?: (data: Partial<T>, req: MockRequest, existing?: T) => void
  beforeDelete?: (item: T, req: MockRequest) => void
}

function crud<T extends { id: number; createdAt?: string }>(
  base: string,
  list: T[],
  { filter = () => true, output = (item) => item, validate, beforeDelete }: CrudOptions<T> = {},
) {
  const find = (id: string) => {
    const item = list.find((i) => i.id === Number(id))
    if (!item) throw new MockError(404, '数据不存在')
    return item
  }
  define('get', base, ({ query }) => {
    const result = paginate(
      list.filter((i) => filter(i, query)).sort((a, b) => b.id - a.id),
      query,
    )
    return { ...result, list: result.list.map(output) }
  })
  define('get', `${base}/:id`, ({ params }) => output(find(params.id as string)))
  define('post', base, (req) => {
    validate?.(req.body, req)
    const item = { ...req.body, id: nextId(list), createdAt: now() } as T
    list.push(item)
    return output(item)
  })
  define('put', `${base}/:id`, (req) => {
    const item = find(req.params.id as string)
    validate?.(req.body, req, item)
    Object.assign(item, req.body, { id: item.id })
    return output(item)
  })
  define('delete', `${base}/:id`, (req) => {
    const item = find(req.params.id as string)
    beforeDelete?.(item, req)
    list.splice(list.indexOf(item), 1)
  })
}

/* ---------- 认证 & 上传 ---------- */
define(
  'post',
  '/auth/login',
  ({ body }) => {
    const account = accounts.find((a) => a.username === body.username)
    if (!account || account.password !== body.password) throw new MockError(400, '用户名或密码错误')
    if (account.status === 0) throw new MockError(403, '账号已被停用，请联系管理员')
    account.lastLoginAt = now()
    return { token: `mock-token-${account.id}` }
  },
  true,
)

define('post', '/auth/logout', () => null)

define('get', '/auth/user-info', ({ userId }): UserInfo => {
  const account = accounts.find((a) => a.id === userId)
  if (!account) throw new MockError(401, '用户不存在')
  return {
    id: account.id,
    username: account.username,
    nickname: account.nickname,
    avatar: letterAvatar(account.nickname),
    role: account.role,
    permissions: PERMISSIONS[account.role],
  }
})

define('post', '/upload', ({ body }) => {
  const file = (body as FormData).get('file') as File
  if (file.size > 2 * 1024 * 1024) throw new MockError(400, '图片不能超过 2MB')
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = () => resolve({ url: reader.result as string })
    reader.readAsDataURL(file)
  })
})

/* ---------- 门店 ---------- */
define('get', '/stores/all', () => stores)
crud('/stores', stores, {
  filter: (s, q) => matchKeyword(q.keyword, s.name, s.address) && eq(q.status, s.status),
})

/* ---------- 分类 ---------- */
const categoryOutput = (c: (typeof categories)[number]) => ({
  ...c,
  productCount: products.filter((p) => p.categoryId === c.id).length,
})
define('get', '/categories/all', () =>
  [...categories].sort((a, b) => a.sort - b.sort).map(categoryOutput),
)
define('get', '/categories', ({ query }) => {
  const list = [...categories].sort((a, b) => a.sort - b.sort)
  const result = paginate(list, query)
  return { ...result, list: result.list.map(categoryOutput) }
})
crud('/categories', categories, {
  output: categoryOutput,
  validate: (data, _req, existing) => {
    if (categories.some((c) => c.name === data.name && c.id !== existing?.id)) {
      throw new MockError(400, '分类名称已存在')
    }
  },
  beforeDelete: (c) => {
    if (products.some((p) => p.categoryId === c.id)) {
      throw new MockError(400, '该分类下还有商品，无法删除')
    }
  },
})

/* ---------- 商品 ---------- */
const productOutput = (p: Product) => ({
  ...p,
  categoryName: categories.find((c) => c.id === p.categoryId)?.name ?? '-',
})
define('put', '/products/batch-status', ({ body }) => {
  products.filter((p) => body.ids.includes(p.id)).forEach((p) => (p.status = body.status))
})
crud('/products', products, {
  output: productOutput,
  filter: (p, q) =>
    matchKeyword(q.keyword, p.name) && eq(q.categoryId, p.categoryId) && eq(q.status, p.status),
  validate: (data, _req, existing) => {
    if (!existing) data.sales = 0
  },
})

/* ---------- 订单 ---------- */
const findOrder = (id: string) => {
  const order = orders.find((o) => o.id === Number(id))
  if (!order) throw new MockError(404, '订单不存在')
  return order
}

define('get', '/orders', ({ query }) => {
  const list = orders
    .filter(
      (o) =>
        matchKeyword(query.keyword, o.orderNo, o.customerName, o.customerPhone) &&
        eq(query.status, o.status) &&
        eq(query.storeId, o.storeId) &&
        (isEmpty(query.startDate) || o.createdAt.slice(0, 10) >= String(query.startDate)) &&
        (isEmpty(query.endDate) || o.createdAt.slice(0, 10) <= String(query.endDate)),
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  return paginate(list, query)
})

/** 轮询待接单数量，并模拟随机来单 */
define('get', '/orders/pending-count', () => {
  if (rand() > 0.6) {
    const order = createOrder(dayjs(), 'pending_accept')
    order.id = nextId(orders)
    orders.push(order)
  }
  return orders.filter((o) => o.status === 'pending_accept').length
})

define('get', '/orders/:id', ({ params }) => findOrder(params.id as string))

const TRANSITIONS: Record<OrderAction, { from: OrderStatus; to: OrderStatus; remark: string }> = {
  accept: { from: 'pending_accept', to: 'preparing', remark: '商家已接单，开始制作' },
  reject: { from: 'pending_accept', to: 'cancelled', remark: '商家拒单，已原路退款' },
  dispatch: { from: 'preparing', to: 'delivering', remark: '骑手已取餐，配送中' },
  complete: { from: 'delivering', to: 'completed', remark: '订单已送达' },
  agreeRefund: { from: 'refunding', to: 'refunded', remark: '商家同意退款，款项已原路退回' },
  refuseRefund: { from: 'refunding', to: 'completed', remark: '商家拒绝退款' },
}

define('post', '/orders/:id/action', ({ params, body }) => {
  const order = findOrder(params.id as string)
  const action = body.action as OrderAction
  const rule = TRANSITIONS[action]
  if (!rule || order.status !== rule.from) throw new MockError(400, '当前订单状态不允许该操作')

  if (action === 'dispatch') {
    const rider = riders.find((r) => r.id === body.riderId)
    if (!rider || rider.status !== 'idle') throw new MockError(400, '该骑手当前不可派单')
    rider.status = 'busy'
    rider.todayOrders++
    rider.totalOrders++
    Object.assign(order, { riderId: rider.id, riderName: rider.name, riderPhone: rider.phone })
  }
  if (action === 'complete') {
    const rider = riders.find((r) => r.id === order.riderId)
    if (rider) rider.status = 'idle'
  }

  order.status = rule.to
  const reason = body.reason ? `：${body.reason}` : ''
  order.logs.push({ status: rule.to, time: now(), remark: `${rule.remark}${reason}` })
  return order
})

/* ---------- 用户 ---------- */
define('get', '/customers', ({ query }) =>
  paginate(
    customers
      .filter((c) => matchKeyword(query.keyword, c.nickname, c.phone) && eq(query.status, c.status))
      .sort((a, b) => b.registeredAt.localeCompare(a.registeredAt)),
    query,
  ),
)
define('put', '/customers/:id', ({ params, body }) => {
  const customer = customers.find((c) => c.id === Number(params.id))
  if (!customer) throw new MockError(404, '用户不存在')
  return Object.assign(customer, body)
})

/* ---------- 优惠券 ---------- */
crud('/coupons', coupons, {
  filter: (c, q) => matchKeyword(q.keyword, c.name) && eq(q.type, c.type),
  validate: (data, _req, existing) => {
    if (!existing) Object.assign(data, { received: 0, used: 0 })
    if (existing && data.total !== undefined && data.total < existing.received) {
      throw new MockError(400, '发放总量不能小于已领取数量')
    }
  },
  beforeDelete: (c) => {
    if (c.received > 0) throw new MockError(400, '已有用户领取，只能停用不能删除')
  },
})

/* ---------- 骑手 ---------- */
define('get', '/riders/idle', () => riders.filter((r) => r.status === 'idle'))
crud('/riders', riders, {
  filter: (r, q) => matchKeyword(q.keyword, r.name, r.phone) && eq(q.status, r.status),
  validate: (data, _req, existing) => {
    if (!existing) Object.assign(data, { todayOrders: 0, totalOrders: 0, rating: 5 })
  },
  beforeDelete: (r) => {
    if (r.status === 'busy') throw new MockError(400, '骑手正在配送中，无法删除')
  },
})

/* ---------- 账号 ---------- */
crud('/accounts', accounts, {
  output: (a) => omit(a, 'password'),
  filter: (a, q) => matchKeyword(q.keyword, a.username, a.nickname) && eq(q.role, a.role),
  validate: (data: Partial<Account>, _req, existing) => {
    if (accounts.some((a) => a.username === data.username && a.id !== existing?.id)) {
      throw new MockError(400, '用户名已存在')
    }
    if (!existing) data.lastLoginAt = ''
    if (existing && !data.password) delete data.password
  },
  beforeDelete: (a, req) => {
    if (a.id === 1 || a.id === req.userId) throw new MockError(400, '不能删除超级管理员或当前账号')
  },
})

/* ---------- 统计 ---------- */
const VALID: OrderStatus[] = ['pending_accept', 'preparing', 'delivering', 'completed', 'refunding']
const sum = (list: number[]) => Math.round(list.reduce((s, n) => s + n, 0) * 100) / 100

function dayStats(date: string) {
  const dayOrders = orders.filter((o) => o.createdAt.startsWith(date))
  const valid = dayOrders.filter((o) => VALID.includes(o.status))
  const revenue = sum(valid.map((o) => o.payAmount))
  return {
    date,
    orderCount: valid.length,
    completedCount: dayOrders.filter((o) => o.status === 'completed').length,
    revenue,
    refundAmount: sum(dayOrders.filter((o) => o.status === 'refunded').map((o) => o.payAmount)),
    avgOrderValue: valid.length ? Math.round((revenue / valid.length) * 100) / 100 : 0,
  }
}

define('get', '/dashboard', () => {
  const today = dayjs().format('YYYY-MM-DD')
  const todayStats = dayStats(today)
  const yesterday = dayStats(dayjs().subtract(1, 'day').format('YYYY-MM-DD'))

  const productSales = new Map<number, number>()
  orders
    .filter((o) => VALID.includes(o.status))
    .forEach((o) =>
      o.items.forEach((it) =>
        productSales.set(it.productId, (productSales.get(it.productId) ?? 0) + it.quantity),
      ),
    )
  const categorySales = categories.map((c) => ({
    name: c.name,
    value: products
      .filter((p) => p.categoryId === c.id)
      .reduce((s, p) => s + (productSales.get(p.id) ?? 0), 0),
  }))
  const hotProducts = products
    .map((p) => ({ name: p.name, sales: productSales.get(p.id) ?? 0 }))
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 10)

  return {
    today: {
      orderCount: todayStats.orderCount,
      revenue: todayStats.revenue,
      avgOrderValue: todayStats.avgOrderValue,
      newCustomers: customers.filter((c) => c.registeredAt.startsWith(today)).length,
      pendingCount: orders.filter((o) => o.status === 'pending_accept').length,
    },
    yesterday: { orderCount: yesterday.orderCount, revenue: yesterday.revenue },
    trend: Array.from({ length: 7 }, (_, i) =>
      dayStats(
        dayjs()
          .subtract(6 - i, 'day')
          .format('YYYY-MM-DD'),
      ),
    ),
    categorySales,
    hotProducts,
  }
})

define('get', '/report/daily', ({ query }) => {
  const start = dayjs(String(query.startDate))
  const days = dayjs(String(query.endDate)).diff(start, 'day') + 1
  if (!start.isValid() || days <= 0) throw new MockError(400, '日期范围不正确')
  return Array.from({ length: Math.min(days, 366) }, (_, i) =>
    dayStats(start.add(i, 'day').format('YYYY-MM-DD')),
  )
})
