import dayjs from 'dayjs'

export const formatMoney = (value: number) => `¥${(value ?? 0).toFixed(2)}`

export const formatDate = (value: string | Date, pattern = 'YYYY-MM-DD HH:mm:ss') =>
  value ? dayjs(value).format(pattern) : '-'

export type TagType = 'primary' | 'success' | 'warning' | 'danger' | 'info'
