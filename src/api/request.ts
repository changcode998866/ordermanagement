import axios, { type AxiosError, type AxiosRequestConfig } from 'axios'
import { ElMessage } from 'element-plus'
import { getToken, removeToken } from '@/utils/storage'
import type { ApiResponse } from '@/types/models'

const service = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 15000,
})

if (import.meta.env.VITE_USE_MOCK === 'true') {
  service.defaults.adapter = async (config) => {
    const { mockAdapter } = await import('@/mock')
    return mockAdapter(config)
  }
}

let redirecting = false
function handleUnauthorized() {
  if (redirecting) return
  redirecting = true
  removeToken()
  ElMessage.warning('登录已过期，请重新登录')
  const redirect = encodeURIComponent(location.pathname + location.search)
  location.href = `${import.meta.env.BASE_URL}login?redirect=${redirect}`
}

service.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

service.interceptors.response.use(
  (response) => {
    const res = response.data as ApiResponse
    if (res.code === 0) return response
    if (res.code === 401) {
      handleUnauthorized()
    } else {
      ElMessage.error(res.message || '请求失败')
    }
    return Promise.reject(new Error(res.message))
  },
  (error: AxiosError<ApiResponse>) => {
    if (error.response?.status === 401) {
      handleUnauthorized()
    } else {
      ElMessage.error(error.response?.data?.message || error.message || '网络异常')
    }
    return Promise.reject(error)
  },
)

export function request<T>(config: AxiosRequestConfig): Promise<T> {
  return service.request<ApiResponse<T>>(config).then((res) => res.data.data)
}

export const http = {
  get: <T>(url: string, params?: object) => request<T>({ url, method: 'get', params }),
  post: <T>(url: string, data?: unknown) => request<T>({ url, method: 'post', data }),
  put: <T>(url: string, data?: unknown) => request<T>({ url, method: 'put', data }),
  delete: <T>(url: string) => request<T>({ url, method: 'delete' }),
}
