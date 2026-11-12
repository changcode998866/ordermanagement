<script setup lang="ts">
import { onBeforeUnmount, onMounted, shallowRef, useTemplateRef, watch } from 'vue'
import echarts, { type EChartsCoreOption } from '@/utils/echarts'
import { useAppStore } from '@/stores/app'

const props = withDefaults(defineProps<{ option: EChartsCoreOption; height?: string }>(), {
  height: '320px',
})

const el = useTemplateRef<HTMLDivElement>('el')
const chart = shallowRef<ReturnType<typeof echarts.init>>()
const appStore = useAppStore()
let observer: ResizeObserver | undefined

function render() {
  if (!el.value) return
  chart.value?.dispose()
  chart.value = echarts.init(el.value, appStore.dark ? 'dark' : undefined)
  chart.value.setOption({ backgroundColor: 'transparent', ...props.option })
}

onMounted(() => {
  render()
  observer = new ResizeObserver(() => chart.value?.resize())
  if (el.value) observer.observe(el.value)
})

watch(
  () => props.option,
  (option) => chart.value?.setOption({ backgroundColor: 'transparent', ...option }, true),
  { deep: true },
)
watch(() => appStore.dark, render)

onBeforeUnmount(() => {
  observer?.disconnect()
  chart.value?.dispose()
})
</script>

<template>
  <div ref="el" :style="{ height, width: '100%' }" />
</template>
