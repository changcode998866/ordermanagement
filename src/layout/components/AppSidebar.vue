<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { usePermissionStore } from '@/stores/permission'
import SidebarItem from './SidebarItem.vue'

const route = useRoute()
const appStore = useAppStore()
const permissionStore = usePermissionStore()

const activeMenu = computed(() => route.meta.activeMenu ?? route.path)
const title = import.meta.env.VITE_APP_TITLE
</script>

<template>
  <div class="sidebar">
    <router-link to="/" class="logo">
      <span class="logo-icon">🍱</span>
      <span v-show="!appStore.collapsed" class="logo-title">{{ title }}</span>
    </router-link>
    <el-scrollbar>
      <el-menu
        :default-active="activeMenu"
        :collapse="appStore.collapsed"
        :collapse-transition="false"
        background-color="#1f2329"
        text-color="#c9cdd4"
        active-text-color="#ffffff"
        router
        unique-opened
      >
        <SidebarItem
          v-for="item in permissionStore.menuRoutes"
          :key="item.path"
          :route="item"
          base-path="/"
        />
      </el-menu>
    </el-scrollbar>
  </div>
</template>

<style scoped lang="scss">
.sidebar {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.logo {
  display: flex;
  flex-shrink: 0;
  gap: 10px;
  align-items: center;
  height: $header-height;
  padding: 0 20px;
  overflow: hidden;
  color: #fff;
  text-decoration: none;
  white-space: nowrap;

  .logo-icon {
    font-size: 24px;
  }

  .logo-title {
    font-size: 16px;
    font-weight: 600;
  }
}

.el-menu {
  border-right: none;

  :deep(.el-menu-item.is-active) {
    background: $brand-color !important;
  }
}
</style>
