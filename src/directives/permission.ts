import type { Directive } from 'vue'
import { useUserStore } from '@/stores/user'

/** 按钮级权限：v-permission="'product:delete'" 或 v-permission="['a', 'b']" */
export const vPermission: Directive<HTMLElement, string | string[]> = {
  mounted(el, binding) {
    if (!useUserStore().hasPermission(binding.value)) el.remove()
  },
}

declare module 'vue' {
  interface GlobalDirectives {
    vPermission: typeof vPermission
  }
}
