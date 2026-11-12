export class MockError extends Error {
  constructor(
    public code: number,
    message: string,
  ) {
    super(message)
  }
}

export type Query = Record<string, string | number | undefined>

export interface MockRequest {
  params: Record<string, string>
  query: Query
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body: any
  userId: number | null
}

type Method = 'get' | 'post' | 'put' | 'delete'
type Handler = (req: MockRequest) => unknown

interface MockRoute {
  method: Method
  regexp: RegExp
  keys: string[]
  handler: Handler
  isPublic: boolean
}

export const routes: MockRoute[] = []

/** 按定义顺序匹配，具体路径需在 /:id 之前定义 */
export function define(method: Method, path: string, handler: Handler, isPublic = false) {
  const keys: string[] = []
  const pattern = path.replace(/:(\w+)/g, (_, key: string) => {
    keys.push(key)
    return '([^/]+)'
  })
  routes.push({ method, regexp: new RegExp(`^${pattern}$`), keys, handler, isPublic })
}

export function paginate<T>(list: T[], query: Query) {
  const page = Number(query.page) || 1
  const pageSize = Number(query.pageSize) || 10
  return { list: list.slice((page - 1) * pageSize, page * pageSize), total: list.length }
}

export const isEmpty = (v: unknown) => v === undefined || v === null || v === ''

export const matchKeyword = (keyword: unknown, ...fields: string[]) =>
  isEmpty(keyword) || fields.some((f) => f.includes(String(keyword).trim()))
