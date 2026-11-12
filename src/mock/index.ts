import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import type { ApiResponse } from '@/types/models'
import { MockError, routes } from './core'
import { accounts } from './db'
import './routes'

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

function parseBody(data: unknown) {
  if (typeof data !== 'string') return data ?? {}
  try {
    return JSON.parse(data)
  } catch {
    return data
  }
}

function resolveUser(authorization: unknown) {
  const id = Number(String(authorization ?? '').replace('Bearer mock-token-', ''))
  const account = accounts.find((a) => a.id === id && a.status === 1)
  return account?.id ?? null
}

async function handle(config: InternalAxiosRequestConfig): Promise<ApiResponse> {
  const method = (config.method ?? 'get').toLowerCase()
  const path = (config.url ?? '').split('?')[0] as string

  for (const route of routes) {
    if (route.method !== method) continue
    const match = route.regexp.exec(path)
    if (!match) continue

    const userId = resolveUser(config.headers.Authorization)
    if (!route.isPublic && !userId) return { code: 401, message: '未登录或登录已过期', data: null }

    const params = Object.fromEntries(route.keys.map((key, i) => [key, match[i + 1] as string]))
    try {
      const data = await route.handler({
        params,
        query: config.params ?? {},
        body: parseBody(config.data),
        userId,
      })
      return { code: 0, message: 'ok', data: data === undefined ? null : structuredClone(data) }
    } catch (e) {
      if (e instanceof MockError) return { code: e.code, message: e.message, data: null }
      console.error('[mock]', e)
      return { code: 500, message: '服务器内部错误', data: null }
    }
  }
  return { code: 404, message: `接口不存在：${method.toUpperCase()} ${path}`, data: null }
}

export async function mockAdapter(config: InternalAxiosRequestConfig): Promise<AxiosResponse> {
  await sleep(120 + Math.random() * 280)
  const data = await handle(config)
  if (import.meta.env.DEV) {
    console.debug(`[mock] ${config.method?.toUpperCase()} ${config.url}`, config.params ?? '', data)
  }
  return { data, status: 200, statusText: 'OK', headers: {}, config }
}
