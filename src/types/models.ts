export type Role = 'admin' | 'operator'

/** 1 启用/营业/上架，0 停用/休息/下架 */
export type EnableStatus = 0 | 1

export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T
}

export interface PageQuery {
  page: number
  pageSize: number
}

export interface PageResult<T> {
  list: T[]
  total: number
}

/* ---------- 认证 ---------- */
export interface LoginParams {
  username: string
  password: string
}

export interface UserInfo {
  id: number
  username: string
  nickname: string
  avatar: string
  role: Role
  permissions: string[]
}

/* ---------- 门店 ---------- */
export interface Store {
  id: number
  name: string
  phone: string
  address: string
  openTime: string
  closeTime: string
  deliveryFee: number
  minOrderAmount: number
  deliveryRadius: number
  status: EnableStatus
  createdAt: string
}

export interface StoreQuery {
  keyword?: string
  status?: EnableStatus
}

/* ---------- 分类 / 商品 ---------- */
export interface Category {
  id: number
  name: string
  sort: number
  status: EnableStatus
  productCount: number
  createdAt: string
}

export interface ProductSpec {
  name: string
  price: number
}

export interface Product {
  id: number
  name: string
  categoryId: number
  categoryName: string
  image: string
  price: number
  originalPrice: number
  packingFee: number
  stock: number
  sales: number
  specs: ProductSpec[]
  description: string
  status: EnableStatus
  createdAt: string
}

export interface ProductQuery {
  keyword?: string
  categoryId?: number
  status?: EnableStatus
}

/* ---------- 订单 ---------- */
export type OrderStatus =
  | 'pending_payment'
  | 'pending_accept'
  | 'preparing'
  | 'delivering'
  | 'completed'
  | 'cancelled'
  | 'refunding'
  | 'refunded'

export type OrderAction =
  'accept' | 'reject' | 'dispatch' | 'complete' | 'agreeRefund' | 'refuseRefund'

export type PayMethod = 'wechat' | 'alipay'

export interface OrderItem {
  productId: number
  name: string
  image: string
  spec: string
  price: number
  quantity: number
}

export interface OrderLog {
  status: OrderStatus
  time: string
  remark: string
}

export interface Order {
  id: number
  orderNo: string
  storeId: number
  storeName: string
  customerId: number
  customerName: string
  customerPhone: string
  address: string
  items: OrderItem[]
  goodsAmount: number
  packingFee: number
  deliveryFee: number
  discountAmount: number
  payAmount: number
  payMethod: PayMethod
  status: OrderStatus
  remark: string
  riderId: number | null
  riderName: string
  riderPhone: string
  refundReason: string
  createdAt: string
  logs: OrderLog[]
}

export interface OrderQuery {
  keyword?: string
  status?: OrderStatus | ''
  storeId?: number
  startDate?: string
  endDate?: string
}

export interface OrderActionParams {
  action: OrderAction
  riderId?: number
  reason?: string
}

/* ---------- 用户 ---------- */
export interface Customer {
  id: number
  nickname: string
  phone: string
  avatar: string
  orderCount: number
  totalSpent: number
  status: EnableStatus
  registeredAt: string
}

export interface CustomerQuery {
  keyword?: string
  status?: EnableStatus
}

/* ---------- 优惠券 ---------- */
export type CouponType = 'full_reduction' | 'discount' | 'no_threshold'

export interface Coupon {
  id: number
  name: string
  type: CouponType
  /** 使用门槛（满 X 元） */
  threshold: number
  /** 减免金额；折扣券为折扣数，如 8.5 */
  value: number
  total: number
  received: number
  used: number
  startTime: string
  endTime: string
  enabled: boolean
  createdAt: string
}

export interface CouponQuery {
  keyword?: string
  type?: CouponType
}

/* ---------- 配送 ---------- */
export type RiderStatus = 'idle' | 'busy' | 'offline'

export interface Rider {
  id: number
  name: string
  phone: string
  status: RiderStatus
  todayOrders: number
  totalOrders: number
  rating: number
  createdAt: string
}

export interface RiderQuery {
  keyword?: string
  status?: RiderStatus
}

/* ---------- 系统账号 ---------- */
export interface Account {
  id: number
  username: string
  nickname: string
  role: Role
  status: EnableStatus
  password?: string
  createdAt: string
  lastLoginAt: string
}

export interface AccountQuery {
  keyword?: string
  role?: Role
}

/* ---------- 统计 ---------- */
export interface DashboardData {
  today: {
    orderCount: number
    revenue: number
    newCustomers: number
    avgOrderValue: number
    pendingCount: number
  }
  yesterday: {
    orderCount: number
    revenue: number
  }
  trend: { date: string; orderCount: number; revenue: number }[]
  categorySales: { name: string; value: number }[]
  hotProducts: { name: string; sales: number }[]
}

export interface DailyReport {
  date: string
  orderCount: number
  completedCount: number
  revenue: number
  refundAmount: number
  avgOrderValue: number
}

export interface ReportQuery {
  startDate: string
  endDate: string
}
