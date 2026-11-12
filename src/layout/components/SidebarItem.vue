<script setup lang="ts">
import { computed } from 'vue'
import type { RouteRecordRaw } from 'vue-router'

const props = defineProps<{ route: RouteRecordRaw; basePath: string }>()

const resolvePath = (path: string) =>
  path.startsWith('/') ? path : `${props.basePath.replace(/\/$/, '')}/${path}`

const fullPath = computed(() => resolvePath(props.route.path))
const visibleChildren = computed(() => props.route.children?.filter((c) => !c.meta?.hidden) ?? [])
</script>

<template>
  <template v-if="!route.meta?.hidden">
    <el-sub-menu v-if="visibleChildren.length" :index="fullPath">
      <template #title>
        <el-icon v-if="route.meta?.icon"><component :is="route.meta.icon" /></el-icon>
        <span>{{ route.meta?.title }}</span>
      </template>
      <SidebarItem
        v-for="child in visibleChildren"
        :key="child.path"
        :route="child"
        :base-path="fullPath"
      />
    </el-sub-menu>
    <el-menu-item v-else :index="fullPath">
      <el-icon v-if="route.meta?.icon"><component :is="route.meta.icon" /></el-icon>
      <template #title>{{ route.meta?.title }}</template>
    </el-menu-item>
  </template>
</template>
