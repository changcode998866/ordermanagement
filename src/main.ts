import { createApp } from 'vue'
import { createPinia } from 'pinia'
import * as ElementPlusIcons from '@element-plus/icons-vue'
// 函数式调用的组件不会被自动按需引入，需要手动引入样式
import 'element-plus/es/components/message/style/css'
import 'element-plus/es/components/message-box/style/css'
import 'element-plus/es/components/notification/style/css'
import 'element-plus/es/components/loading/style/css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import '@/styles/index.scss'

import App from './App.vue'
import router from './router'
import { setupRouterGuard } from './router/guard'
import { vPermission } from './directives/permission'

const app = createApp(App)

for (const [name, component] of Object.entries(ElementPlusIcons)) {
  app.component(name, component)
}

app.use(createPinia())
app.use(router)
app.directive('permission', vPermission)
setupRouterGuard(router)

app.mount('#app')
