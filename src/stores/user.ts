import { defineStore } from 'pinia'
import { ref } from 'vue'
import { authApi } from '@/api'
import type { LoginParams, UserInfo } from '@/types/models'
import { getToken, removeToken, setToken } from '@/utils/storage'
import { usePermissionStore } from './permission'

export const useUserStore = defineStore('user', () => {
  const token = ref(getToken())
  const userInfo = ref<UserInfo | null>(null)

  async function login(params: LoginParams) {
    const res = await authApi.login(params)
    token.value = res.token
    setToken(res.token)
  }

  async function fetchUserInfo() {
    userInfo.value = await authApi.userInfo()
    return userInfo.value
  }

  function reset() {
    token.value = ''
    userInfo.value = null
    removeToken()
    usePermissionStore().resetRoutes()
  }

  async function logout() {
    try {
      await authApi.logout()
    } finally {
      reset()
    }
  }

  function hasPermission(code: string | string[]) {
    const owned = userInfo.value?.permissions ?? []
    if (owned.includes('*')) return true
    const required = Array.isArray(code) ? code : [code]
    return required.some((c) => owned.includes(c))
  }

  return { token, userInfo, login, fetchUserInfo, logout, reset, hasPermission }
})
