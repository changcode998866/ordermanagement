import { http, request } from './request'
import type {
  Account,
  AccountQuery,
  Category,
  Coupon,
  CouponQuery,
  Customer,
  CustomerQuery,
  DailyReport,
  DashboardData,
  EnableStatus,
  LoginParams,
  Order,
  OrderActionParams,
  OrderQuery,
  PageQuery,
  PageResult,
  Product,
  ProductQuery,
  ReportQuery,
  Rider,
  RiderQuery,
  Store,
  StoreQuery,
  UserInfo,
} from '@/types/models'

type Paged<Q> = Q & PageQuery
type Payload<T> = Partial<Omit<T, 'id' | 'createdAt'>>

/** 标准 RESTful CRUD 接口 */
function createCrud<T, Q>(base: string) {
  return {
    page: (query: Paged<Q>) => http.get<PageResult<T>>(base, query),
    detail: (id: number) => http.get<T>(`${base}/${id}`),
    create: (data: Payload<T>) => http.post<T>(base, data),
    update: (id: number, data: Payload<T>) => http.put<T>(`${base}/${id}`, data),
    remove: (id: number) => http.delete<void>(`${base}/${id}`),
  }
}

export const authApi = {
  login: (data: LoginParams) => http.post<{ token: string }>('/auth/login', data),
  logout: () => http.post<void>('/auth/logout'),
  userInfo: () => http.get<UserInfo>('/auth/user-info'),
}

export const uploadApi = {
  upload: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return request<{ url: string }>({ url: '/upload', method: 'post', data: form })
  },
}

export const dashboardApi = {
  overview: () => http.get<DashboardData>('/dashboard'),
  report: (query: ReportQuery) => http.get<DailyReport[]>('/report/daily', query),
}

export const storeApi = {
  ...createCrud<Store, StoreQuery>('/stores'),
  all: () => http.get<Store[]>('/stores/all'),
}

export const categoryApi = {
  ...createCrud<Category, object>('/categories'),
  all: () => http.get<Category[]>('/categories/all'),
}

export const productApi = {
  ...createCrud<Product, ProductQuery>('/products'),
  batchStatus: (ids: number[], status: EnableStatus) =>
    http.put<void>('/products/batch-status', { ids, status }),
}

export const orderApi = {
  page: (query: Paged<OrderQuery>) => http.get<PageResult<Order>>('/orders', query),
  detail: (id: number) => http.get<Order>(`/orders/${id}`),
  action: (id: number, data: OrderActionParams) => http.post<Order>(`/orders/${id}/action`, data),
  pendingCount: () => http.get<number>('/orders/pending-count'),
}

export const customerApi = {
  page: (query: Paged<CustomerQuery>) => http.get<PageResult<Customer>>('/customers', query),
  update: (id: number, data: Payload<Customer>) => http.put<Customer>(`/customers/${id}`, data),
}

export const couponApi = createCrud<Coupon, CouponQuery>('/coupons')

export const riderApi = {
  ...createCrud<Rider, RiderQuery>('/riders'),
  idle: () => http.get<Rider[]>('/riders/idle'),
}

export const accountApi = createCrud<Account, AccountQuery>('/accounts')
