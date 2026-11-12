<script setup lang="ts">
import { computed, onMounted, ref, shallowRef } from 'vue'
import dayjs from 'dayjs'
import { dashboardApi } from '@/api'
import EChart from '@/components/EChart.vue'
import type { DailyReport } from '@/types/models'
import type { EChartsCoreOption } from '@/utils/echarts'
import { exportExcel } from '@/utils/excel'
import { formatMoney } from '@/utils/format'

const range = ref<[string, string]>([
  dayjs().subtract(29, 'day').format('YYYY-MM-DD'),
  dayjs().format('YYYY-MM-DD'),
])
const shortcuts = [7, 14, 30].map((days) => ({
  text: `近 ${days} 天`,
  value: () => [
    dayjs()
      .subtract(days - 1, 'day')
      .toDate(),
    new Date(),
  ],
}))
const disabledDate = (date: Date) => dayjs(date).isAfter(dayjs(), 'day')

const loading = ref(false)
const rows = shallowRef<DailyReport[]>([])

async function load() {
  loading.value = true
  try {
    rows.value = await dashboardApi.report({ startDate: range.value[0], endDate: range.value[1] })
  } finally {
    loading.value = false
  }
}
onMounted(load)

const total = computed(() => {
  const sum = (key: keyof Omit<DailyReport, 'date'>) => rows.value.reduce((s, r) => s + r[key], 0)
  const orderCount = sum('orderCount')
  const revenue = sum('revenue')
  return {
    orderCount,
    revenue,
    refundAmount: sum('refundAmount'),
    avgOrderValue: orderCount ? revenue / orderCount : 0,
  }
})

const chartOption = computed<EChartsCoreOption>(() => ({
  tooltip: { trigger: 'axis' },
  legend: { top: 0, data: ['营业额', '退款金额', '订单量'] },
  grid: { left: 60, right: 60, top: 40, bottom: 30 },
  xAxis: { type: 'category', data: rows.value.map((r) => r.date.slice(5)) },
  yAxis: [
    { type: 'value', name: '金额(元)' },
    { type: 'value', name: '订单量', splitLine: { show: false } },
  ],
  series: [
    {
      name: '营业额',
      type: 'line',
      smooth: true,
      itemStyle: { color: '#ff6a00' },
      areaStyle: { color: 'rgba(255,106,0,0.08)' },
      data: rows.value.map((r) => r.revenue),
    },
    {
      name: '退款金额',
      type: 'line',
      smooth: true,
      itemStyle: { color: '#f56c6c' },
      data: rows.value.map((r) => r.refundAmount),
    },
    {
      name: '订单量',
      type: 'bar',
      yAxisIndex: 1,
      barMaxWidth: 16,
      itemStyle: { color: '#ffd2b3' },
      data: rows.value.map((r) => r.orderCount),
    },
  ],
}))

const handleExport = () =>
  exportExcel(
    rows.value,
    [
      { label: '日期', value: (r) => r.date },
      { label: '有效订单', value: (r) => r.orderCount },
      { label: '已完成', value: (r) => r.completedCount },
      { label: '营业额', value: (r) => r.revenue },
      { label: '退款金额', value: (r) => r.refundAmount },
      { label: '客单价', value: (r) => r.avgOrderValue },
    ],
    `营业报表_${range.value[0]}_${range.value[1]}`,
  )
</script>

<template>
  <div>
    <div class="page-card toolbar">
      <el-date-picker
        v-model="range"
        type="daterange"
        value-format="YYYY-MM-DD"
        :shortcuts="shortcuts"
        :disabled-date="disabledDate"
        :clearable="false"
        style="max-width: 320px"
        @change="load"
      />
      <el-button icon="Download" :disabled="!rows.length" @click="handleExport"
        >导出 Excel</el-button
      >
    </div>

    <el-row :gutter="16">
      <el-col :xs="12" :md="6">
        <div class="page-card"><el-statistic title="有效订单" :value="total.orderCount" /></div>
      </el-col>
      <el-col :xs="12" :md="6">
        <div class="page-card">
          <el-statistic title="营业额 (元)" :value="total.revenue" :precision="2" />
        </div>
      </el-col>
      <el-col :xs="12" :md="6">
        <div class="page-card">
          <el-statistic title="客单价 (元)" :value="total.avgOrderValue" :precision="2" />
        </div>
      </el-col>
      <el-col :xs="12" :md="6">
        <div class="page-card">
          <el-statistic title="退款金额 (元)" :value="total.refundAmount" :precision="2" />
        </div>
      </el-col>
    </el-row>

    <div v-loading="loading" class="page-card">
      <EChart :option="chartOption" height="340px" />
    </div>

    <div class="page-card">
      <el-table v-loading="loading" :data="[...rows].reverse()" max-height="480" show-summary>
        <el-table-column label="日期" prop="date" />
        <el-table-column label="有效订单" prop="orderCount" sortable />
        <el-table-column label="已完成" prop="completedCount" />
        <el-table-column label="营业额" prop="revenue" sortable>
          <template #default="{ row }">{{ formatMoney(row.revenue) }}</template>
        </el-table-column>
        <el-table-column label="退款金额" prop="refundAmount">
          <template #default="{ row }">{{ formatMoney(row.refundAmount) }}</template>
        </el-table-column>
        <el-table-column label="客单价" prop="avgOrderValue">
          <template #default="{ row }">{{ formatMoney(row.avgOrderValue) }}</template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<style scoped>
.toolbar {
  display: flex;
  justify-content: space-between;
}
</style>
