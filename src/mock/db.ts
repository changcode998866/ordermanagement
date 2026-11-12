import dayjs, { type Dayjs } from 'dayjs'
import type {
  Account,
  Category,
  Coupon,
  Customer,
  Order,
  OrderItem,
  OrderLog,
  OrderStatus,
  Product,
  Rider,
  Store,
} from '@/types/models'

/* ---------- 可复现的伪随机 ---------- */
let seed = 20261112
export const rand = () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296
  return seed / 4294967296
}
export const randInt = (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min
export const pick = <T>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)] as T
export const now = () => dayjs().format('YYYY-MM-DD HH:mm:ss')
const fmt = (d: Dayjs) => d.format('YYYY-MM-DD HH:mm:ss')
const round2 = (n: number) => Math.round(n * 100) / 100

export const emojiImage = (emoji: string, bg: string) =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" rx="24" fill="${bg}"/><text x="100" y="132" font-size="100" text-anchor="middle">${emoji}</text></svg>`,
  )}`

const avatarColors = ['#ff9a3c', '#4fc3f7', '#81c784', '#ba68c8', '#f06292', '#ffb74d', '#7986cb']
export const letterAvatar = (name: string) =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" fill="${pick(avatarColors)}"/><text x="40" y="52" font-size="34" fill="#fff" text-anchor="middle" font-family="sans-serif">${name.slice(0, 1)}</text></svg>`,
  )}`

const randomPhone = () =>
  `1${pick(['3', '5', '7', '8', '9'])}${String(randInt(0, 999999999)).padStart(9, '0')}`
const surnames = '王李张刘陈杨黄赵吴周徐孙马朱胡郭何林罗高'.split('')
const givenNames = '伟芳娜敏静丽强磊洋艳勇军杰娟涛明超秀霞平刚桂英华玉萍红'.split('')
const randomName = () => pick(surnames) + pick(givenNames) + (rand() > 0.5 ? pick(givenNames) : '')

/* ---------- 门店 ---------- */
export const stores: Store[] = [
  ['望京旗舰店', '北京市朝阳区望京SOHO T1 B1-08'],
  ['中关村店', '北京市海淀区中关村大街 27 号 1F'],
  ['国贸店', '北京市朝阳区建国门外大街 1 号 B2'],
  ['五道口店', '北京市海淀区成府路 28 号 2F-12'],
].map(([name, address], i): Store => ({
  id: i + 1,
  name: name as string,
  address: address as string,
  phone: `010-${randInt(60000000, 89999999)}`,
  openTime: '09:00',
  closeTime: i === 2 ? '23:30' : '22:00',
  deliveryFee: pick([3, 4, 5]),
  minOrderAmount: pick([15, 20, 25]),
  deliveryRadius: pick([3, 4, 5]),
  status: i === 3 ? 0 : 1,
  createdAt: fmt(dayjs().subtract(400 - i * 60, 'day')),
}))

/* ---------- 分类 / 商品 ---------- */
const menu: [string, string, string, [string, number][]][] = [
  [
    '招牌主食',
    '🍚',
    '#ffe0b2',
    [
      ['黄焖鸡米饭', 22],
      ['红烧牛肉饭', 26],
      ['台式卤肉饭', 18],
      ['宫保鸡丁饭', 20],
    ],
  ],
  [
    '面食粉类',
    '🍜',
    '#fff3e0',
    [
      ['兰州牛肉面', 18],
      ['酸辣粉', 14],
      ['老北京炸酱面', 16],
      ['柳州螺蛳粉', 19],
    ],
  ],
  [
    '汉堡炸鸡',
    '🍔',
    '#ffecb3',
    [
      ['香辣鸡腿堡', 16],
      ['双层牛肉堡', 25],
      ['炸鸡全家桶', 59],
      ['香酥鸡翅', 12],
    ],
  ],
  [
    '轻食沙拉',
    '🥗',
    '#dcedc8',
    [
      ['鸡胸肉沙拉', 28],
      ['牛油果能量碗', 32],
    ],
  ],
  [
    '特色小吃',
    '🍟',
    '#ffccbc',
    [
      ['黄金薯条', 9],
      ['鸡米花', 12],
      ['煎饺(8只)', 15],
    ],
  ],
  [
    '饮品甜点',
    '🧋',
    '#e1bee7',
    [
      ['珍珠奶茶', 13],
      ['杨枝甘露', 16],
      ['手打柠檬茶', 10],
      ['芒果布丁', 9],
    ],
  ],
]

export const categories: Category[] = menu.map(([name], i): Category => ({
  id: i + 1,
  name,
  sort: i + 1,
  status: 1,
  productCount: 0,
  createdAt: fmt(dayjs().subtract(300, 'day')),
}))

export const products: Product[] = menu.flatMap(([, emoji, bg, items], ci) =>
  items.map(([name, price]): Product => ({
    id: 0,
    name,
    categoryId: ci + 1,
    categoryName: '',
    image: emojiImage(emoji, bg),
    price,
    originalPrice: rand() > 0.5 ? price + randInt(2, 8) : price,
    packingFee: ci === 5 ? 0.5 : 1,
    stock: randInt(0, 10) === 0 ? randInt(0, 8) : randInt(30, 300),
    sales: randInt(200, 3000),
    specs:
      ci === 5
        ? [
            { name: '中杯', price: 0 },
            { name: '大杯', price: 3 },
          ]
        : ci <= 1
          ? [
              { name: '标准份', price: 0 },
              { name: '加量份', price: 5 },
            ]
          : [],
    description: `<p><strong>${name}</strong>，精选食材，现点现做。</p><p>过敏原提示：可能含有麸质、大豆。</p>`,
    status: rand() > 0.1 ? 1 : 0,
    createdAt: fmt(dayjs().subtract(randInt(30, 300), 'day')),
  })),
)
products.forEach((p, i) => (p.id = i + 1))

/* ---------- 用户 / 骑手 ---------- */
export const customers: Customer[] = Array.from({ length: 80 }, (_, i): Customer => {
  const nickname = randomName()
  return {
    id: i + 1,
    nickname,
    phone: randomPhone(),
    avatar: letterAvatar(nickname),
    orderCount: 0,
    totalSpent: 0,
    status: rand() > 0.05 ? 1 : 0,
    registeredAt: fmt(
      i >= 76
        ? dayjs().subtract(randInt(5, 120), 'minute')
        : dayjs().subtract(randInt(1, 365), 'day'),
    ),
  }
})

export const riders: Rider[] = Array.from({ length: 12 }, (_, i): Rider => ({
  id: i + 1,
  name: randomName(),
  phone: randomPhone(),
  status: i < 2 ? 'offline' : 'idle',
  todayOrders: 0,
  totalOrders: randInt(300, 3000),
  rating: round2(4.5 + rand() * 0.5),
  createdAt: fmt(dayjs().subtract(randInt(30, 500), 'day')),
}))

/* ---------- 优惠券 ---------- */
export const coupons: Coupon[] = [
  {
    name: '新人专享 满20减8',
    type: 'full_reduction',
    threshold: 20,
    value: 8,
    start: -30,
    end: 60,
  },
  { name: '午餐满40减10', type: 'full_reduction', threshold: 40, value: 10, start: -10, end: 20 },
  { name: '饮品 8.5 折', type: 'discount', threshold: 0, value: 8.5, start: -5, end: 25 },
  { name: '无门槛 3 元券', type: 'no_threshold', threshold: 0, value: 3, start: -60, end: -1 },
  { name: '双十二 满60减20', type: 'full_reduction', threshold: 60, value: 20, start: 25, end: 32 },
].map((c, i): Coupon => {
  const total = pick([500, 1000, 2000])
  const received = c.start > 0 ? 0 : randInt(total * 0.3, total)
  return {
    id: i + 1,
    name: c.name,
    type: c.type as Coupon['type'],
    threshold: c.threshold,
    value: c.value,
    total,
    received,
    used: Math.floor(received * (0.3 + rand() * 0.5)),
    startTime: fmt(dayjs().add(c.start, 'day').startOf('day')),
    endTime: fmt(dayjs().add(c.end, 'day').endOf('day')),
    enabled: true,
    createdAt: fmt(dayjs().add(c.start - 3, 'day')),
  }
})

/* ---------- 后台账号 ---------- */
export const accounts: (Account & { password: string })[] = [
  { username: 'admin', nickname: '店长 · 老王', role: 'admin' as const },
  { username: 'operator', nickname: '运营 · 小李', role: 'operator' as const },
  { username: 'kefu01', nickname: '客服 · 小周', role: 'operator' as const },
].map((a, i): Account & { password: string } => ({
  id: i + 1,
  ...a,
  password: '123456',
  status: 1,
  createdAt: fmt(dayjs().subtract(200 - i * 30, 'day')),
  lastLoginAt: fmt(dayjs().subtract(i + 1, 'day')),
}))

/* ---------- 订单 ---------- */
export const orders: Order[] = []

const STATUS_FLOW: OrderStatus[] = [
  'pending_payment',
  'pending_accept',
  'preparing',
  'delivering',
  'completed',
]
const FLOW_REMARK: Record<string, string> = {
  pending_payment: '用户提交订单',
  pending_accept: '用户支付成功',
  preparing: '商家已接单，开始制作',
  delivering: '骑手已取餐，配送中',
  completed: '订单已送达',
}

export function createOrder(time: Dayjs, status: OrderStatus): Order {
  const store = pick(stores.filter((s) => s.status === 1))
  const customer = pick(customers)
  const items: OrderItem[] = Array.from({ length: randInt(1, 4) }, () => {
    const p = pick(products)
    const spec = p.specs.length ? pick(p.specs) : null
    return {
      productId: p.id,
      name: p.name,
      image: p.image,
      spec: spec?.name ?? '',
      price: p.price + (spec?.price ?? 0),
      quantity: rand() > 0.8 ? 2 : 1,
    }
  })
  const goodsAmount = round2(items.reduce((s, it) => s + it.price * it.quantity, 0))
  const packingFee = items.length
  const discountAmount =
    goodsAmount >= 40 && rand() > 0.5 ? 10 : goodsAmount >= 20 && rand() > 0.6 ? 8 : 0
  const payAmount = round2(goodsAmount + packingFee + store.deliveryFee - discountAmount)

  const logs: OrderLog[] = []
  const endIndex = STATUS_FLOW.indexOf(status)
  const lastFlow = endIndex >= 0 ? endIndex : status === 'cancelled' ? 1 : 4
  const offsets = [0, 1, 3, 15, randInt(30, 45)]
  for (let i = 0; i <= lastFlow; i++) {
    const s = STATUS_FLOW[i] as OrderStatus
    logs.push({
      status: s,
      time: fmt(time.add(offsets[i] as number, 'minute')),
      remark: FLOW_REMARK[s] as string,
    })
  }
  let refundReason = ''
  if (status === 'cancelled') {
    logs.push({
      status,
      time: fmt(time.add(5, 'minute')),
      remark: pick(['用户取消订单', '商家拒单：门店繁忙']) + '，已原路退款',
    })
  }
  if (status === 'refunding' || status === 'refunded') {
    refundReason = pick(['餐品洒漏', '送达超时', '少送餐品', '口味不符'])
    logs.push({
      status: 'refunding',
      time: fmt(time.add(60, 'minute')),
      remark: `用户申请退款：${refundReason}`,
    })
    if (status === 'refunded') {
      logs.push({
        status,
        time: fmt(time.add(80, 'minute')),
        remark: '商家同意退款，款项已原路退回',
      })
    }
  }

  const needRider = ['delivering', 'completed', 'refunding', 'refunded'].includes(status)
  const rider = needRider ? pick(riders.filter((r) => r.status !== 'offline')) : null
  if (rider && status === 'delivering') rider.status = 'busy'
  if (rider && time.isSame(dayjs(), 'day')) rider.todayOrders++

  return {
    id: orders.length + 1,
    orderNo: `${time.format('YYYYMMDDHHmmss')}${randInt(1000, 9999)}`,
    storeId: store.id,
    storeName: store.name,
    customerId: customer.id,
    customerName: customer.nickname,
    customerPhone: customer.phone,
    address: `${pick(['望京', '中关村', '国贸', '五道口', '酒仙桥'])}${pick(['花园', '小区', '公寓', '大厦'])}${randInt(1, 20)}号楼${randInt(1, 30)}0${randInt(1, 6)}`,
    items,
    goodsAmount,
    packingFee,
    deliveryFee: store.deliveryFee,
    discountAmount,
    payAmount,
    payMethod: rand() > 0.35 ? 'wechat' : 'alipay',
    status,
    remark: pick(['', '', '', '不要香菜', '少辣', '放门口就行，谢谢', '多给点餐具']),
    riderId: rider?.id ?? null,
    riderName: rider?.name ?? '',
    riderPhone: rider?.phone ?? '',
    refundReason,
    createdAt: fmt(time),
    logs,
  }
}

const peakHours = [10, 11, 11, 12, 12, 12, 12, 13, 13, 14, 17, 17, 18, 18, 18, 19, 19, 20, 21]
const current = dayjs()
for (let d = 29; d >= 0; d--) {
  const day = current.subtract(d, 'day').startOf('day')
  const weekend = [0, 6].includes(day.day())
  const count = randInt(8, 16) + (weekend ? 5 : 0)
  for (let i = 0; i < count; i++) {
    const time = day.hour(pick(peakHours)).minute(randInt(0, 59)).second(randInt(0, 59))
    if (time.isAfter(current.subtract(2, 'hour'))) continue
    const r = rand()
    const status: OrderStatus =
      d <= 1 && r > 0.96 ? 'refunding' : r > 0.93 ? 'cancelled' : r > 0.9 ? 'refunded' : 'completed'
    orders.push(createOrder(time, status))
  }
}
// 当前正在进行中的订单
;(
  [
    [95, 'delivering'],
    [70, 'delivering'],
    [50, 'preparing'],
    [30, 'preparing'],
    [12, 'pending_accept'],
    [6, 'pending_accept'],
    [3, 'pending_payment'],
    [1, 'pending_accept'],
  ] as [number, OrderStatus][]
).forEach(([minutesAgo, status]) =>
  orders.push(createOrder(current.subtract(minutesAgo, 'minute'), status)),
)

orders.forEach((o) => {
  const c = customers.find((c) => c.id === o.customerId)
  if (c && !['pending_payment', 'cancelled', 'refunded'].includes(o.status)) {
    c.orderCount++
    c.totalSpent = round2(c.totalSpent + o.payAmount)
  }
})

export const nextId = (list: { id: number }[]) =>
  list.reduce((max, item) => Math.max(max, item.id), 0) + 1
