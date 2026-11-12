<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessageBox, ElNotification } from 'element-plus'
import { orderApi } from '@/api'
import { useAppStore } from '@/stores/app'
import { useUserStore } from '@/stores/user'
import { ROLE } from '@/utils/dict'

const POLL_INTERVAL = 20_000

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()
const userStore = useUserStore()

const breadcrumbs = computed(() => route.matched.filter((r) => r.meta.title))

/* 新订单提醒：轮询待接单数量（生产环境建议替换为 WebSocket 推送） */
const pendingCount = ref(0)
let timer: ReturnType<typeof setInterval> | undefined

async function pollPending(notify = true) {
  const count = await orderApi.pendingCount()
  if (notify && count > pendingCount.value) {
    ElNotification({
      title: '新订单提醒',
      message: `您有 ${count} 个订单待接单，请及时处理`,
      type: 'warning',
      onClick: goPending,
    })
  }
  pendingCount.value = count
}

function goPending() {
  router.push({ path: '/order/list', query: { status: 'pending_accept' } })
}

onMounted(() => {
  pollPending(false)
  timer = setInterval(pollPending, POLL_INTERVAL)
})
onBeforeUnmount(() => clearInterval(timer))

async function handleCommand(command: string) {
  if (command !== 'logout') return
  try {
    await ElMessageBox.confirm('确定退出登录吗？', '提示', { type: 'warning' })
  } catch {
    return
  }
  await userStore.logout()
  router.replace('/login')
}
</script>

<template>
  <header class="header">
    <div class="header-left">
      <el-icon class="action" @click="appStore.toggleSidebar">
        <Expand v-if="appStore.collapsed" />
        <Fold v-else />
      </el-icon>
      <el-breadcrumb separator="/">
        <el-breadcrumb-item v-for="item in breadcrumbs" :key="item.path">
          {{ item.meta.title }}
        </el-breadcrumb-item>
      </el-breadcrumb>
    </div>

    <div class="header-right">
      <el-tooltip content="待接单订单">
        <el-badge :value="pendingCount" :hidden="!pendingCount" :max="99" class="action">
          <el-icon @click="goPending"><Bell /></el-icon>
        </el-badge>
      </el-tooltip>
      <el-tooltip :content="appStore.dark ? '切换浅色' : '切换深色'">
        <el-icon class="action" @click="appStore.toggleDark">
          <Sunny v-if="appStore.dark" />
          <Moon v-else />
        </el-icon>
      </el-tooltip>
      <el-dropdown trigger="click" @command="handleCommand">
        <div class="user">
          <el-avatar :size="30" :src="userStore.userInfo?.avatar" />
          <span class="user-name">{{ userStore.userInfo?.nickname }}</span>
          <el-tag size="small" effect="plain">
            {{ userStore.userInfo ? ROLE[userStore.userInfo.role] : '' }}
          </el-tag>
          <el-icon><ArrowDown /></el-icon>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="logout" :icon="'SwitchButton'">退出登录</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </header>
</template>

<style scoped lang="scss">
.header {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  height: $header-height;
  padding: 0 16px;
  background: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.header-left,
.header-right {
  display: flex;
  gap: 18px;
  align-items: center;
}

.action {
  font-size: 19px;
  cursor: pointer;

  &:hover {
    color: var(--el-color-primary);
  }
}

.user {
  display: flex;
  gap: 8px;
  align-items: center;
  cursor: pointer;
  outline: none;
}

.user-name {
  font-size: 14px;
}
</style>
