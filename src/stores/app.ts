import { defineStore } from 'pinia'
import { ref, watchEffect } from 'vue'

export const useAppStore = defineStore('app', () => {
  const collapsed = ref(localStorage.getItem('sidebar_collapsed') === '1')
  const dark = ref(localStorage.getItem('theme') === 'dark')

  watchEffect(() => {
    localStorage.setItem('sidebar_collapsed', collapsed.value ? '1' : '0')
    localStorage.setItem('theme', dark.value ? 'dark' : 'light')
    document.documentElement.classList.toggle('dark', dark.value)
  })

  const toggleSidebar = () => (collapsed.value = !collapsed.value)
  const toggleDark = () => (dark.value = !dark.value)

  return { collapsed, dark, toggleSidebar, toggleDark }
})
