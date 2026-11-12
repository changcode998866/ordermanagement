import type { CouponType, OrderStatus, PayMethod, RiderStatus, Role } from '@/types/models'
import type { TagType } from './format'

interface DictItem {
  label: string
  type: TagType
}

export const ORDER_STATUS: Record<OrderStatus, DictItem> = {
  pending_payment: { label: '待支付', type: 'info' },
  pending_accept: { label: '待接单', type: 'danger' },
  preparing: { label: '制作中', type: 'warning' },
  delivering: { label: '配送中', type: 'primary' },
  completed: { label: '已完成', type: 'success' },
  cancelled: { label: '已取消', type: 'info' },
  refunding: { label: '退款中', type: 'danger' },
  refunded: { label: '已退款', type: 'info' },
}

export const PAY_METHOD: Record<PayMethod, string> = {
  wechat: '微信支付',
  alipay: '支付宝',
}

export const COUPON_TYPE: Record<CouponType, DictItem> = {
  full_reduction: { label: '满减券', type: 'danger' },
  discount: { label: '折扣券', type: 'warning' },
  no_threshold: { label: '无门槛券', type: 'success' },
}

export const RIDER_STATUS: Record<RiderStatus, DictItem> = {
  idle: { label: '空闲', type: 'success' },
  busy: { label: '配送中', type: 'warning' },
  offline: { label: '离线', type: 'info' },
}

export const ROLE: Record<Role, string> = {
  admin: '超级管理员',
  operator: '运营人员',
}

export const toOptions = <K extends string>(dict: Record<K, DictItem | string>) =>
  (Object.keys(dict) as K[]).map((value) => {
    const item = dict[value]
    return { value, label: typeof item === 'string' ? item : item.label }
  })
