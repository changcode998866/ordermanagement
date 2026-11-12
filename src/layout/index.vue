<script setup lang="ts">
import { useAppStore } from '@/stores/app'
import AppSidebar from './components/AppSidebar.vue'
import AppHeader from './components/AppHeader.vue'

const appStore = useAppStore()
</script>

<template>
  <el-container class="layout">
    <el-aside :width="appStore.collapsed ? '64px' : '220px'" class="layout-aside">
      <AppSidebar />
    </el-aside>
    <el-container direction="vertical" class="layout-body">
      <AppHeader />
      <el-main class="layout-main">
        <router-view v-slot="{ Component, route }">
          <transition name="fade-slide" mode="out-in">
            <component :is="Component" :key="route.fullPath" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<style scoped lang="scss">
.layout {
  height: 100%;
}

.layout-aside {
  overflow: hidden;
  background: $sidebar-bg;
  transition: width 0.25s;
}

.layout-body {
  min-width: 0;
}

.layout-main {
  padding: 16px;
  overflow-x: hidden;
}
</style>
