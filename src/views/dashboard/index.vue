<script setup lang="ts">
import { computed, onMounted, ref, shallowRef } from 'vue'
import { orderApi, dashboardApi } from '@/api'
import EChart from '@/components/EChart.vue'
import OrderActions from '@/views/order/components/OrderActions.vue'
import type { DashboardData, Order } from '@/types/models'
import { formatMoney } from '@/utils/format'
import type { EChartsCoreOption } from '@/utils/echarts'

const loading = ref(true)
const data = shallowRef<DashboardData>()
const pendingOrders = shallowRef<Order[]>([])

async function load() {
  loading.value = true
  try {
    const [overview, pending] = await Promise.all([
      dashboardApi.overview(),
      orderApi.page({ status: 'pending_accept', page: 1, pageSize: 5 }),
    ])
    data.value = overview
    pendingOrders.value = pending.list
  } finally {
    loading.value = false
  }
}
onMounted(load)

const percent = (today: number, yesterday: number) =>
  yesterday ? Math.round(((today - yesterday) / yesterday) * 100) : 0

const cards = computed(() => {
  const d = data.value
  if (!d) return []
  return [
    {
      label: '今日订单',
      value: d.today.orderCount,
      icon: 'Tickets',
      color: '#ff6a00',
      compare: percent(d.today.orderCount, d.yesterday.orderCount),
    },
    {
      label: '今日营业额',
      value: formatMoney(d.today.revenue),
      icon: 'Money',
      color: '#13c2c2',
      compare: percent(d.today.revenue, d.yesterday.revenue),
    },
    {
      label: '客单价',
      value: formatMoney(d.today.avgOrderValue),
      icon: 'Wallet',
      color: '#722ed1',
    },
    { label: '今日新增用户', value: d.today.newCustomers, icon: 'User', color: '#52c41a' },
  ]
})

const trendOption = computed<EChartsCoreOption>(() => ({
  tooltip: { trigger: 'axis' },
  legend: { top: 0, data: ['订单量', '营业额'] },
  grid: { left: 50, right: 60, top: 40, bottom: 30 },
  xAxis: { type: 'category', data: data.value?.trend.map((t) => t.date.slice(5)) ?? [] },
  yAxis: [
    { type: 'value', name: '订单量' },
    { type: 'value', name: '营业额(元)', splitLine: { show: false } },
  ],
  series: [
    {
      name: '订单量',
      type: 'bar',
      barWidth: 22,
      itemStyle: { color: '#ffb580', borderRadius: [4, 4, 0, 0] },
      data: data.value?.trend.map((t) => t.orderCount) ?? [],
    },
    {
      name: '营业额',
      type: 'line',
      yAxisIndex: 1,
      smooth: true,
      itemStyle: { color: '#ff6a00' },
      areaStyle: { color: 'rgba(255,106,0,0.08)' },
      data: data.value?.trend.map((t) => t.revenue) ?? [],
    },
  ],
}))

const categoryOption = computed<EChartsCoreOption>(() => ({
  tooltip: { trigger: 'item', formatter: '{b}: {c} 份 ({d}%)' },
  legend: { bottom: 0, type: 'scroll' },
  series: [
    {
      type: 'pie',
      radius: ['42%', '68%'],
      center: ['50%', '45%'],
      itemStyle: { borderRadius: 6, borderColor: 'transparent', borderWidth: 2 },
      label: { formatter: '{b}\n{d}%' },
      data: data.value?.categorySales ?? [],
    },
  ],
}))

const hotOption = computed<EChartsCoreOption>(() => {
  const list = [...(data.value?.hotProducts ?? [])].reverse()
  return {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: 110, right: 40, top: 10, bottom: 20 },
    xAxis: { type: 'value' },
    yAxis: { type: 'category', data: list.map((p) => p.name) },
    series: [
      {
        type: 'bar',
        barWidth: 14,
        label: { show: true, position: 'right' },
        itemStyle: { color: '#ff9640', borderRadius: [0, 4, 4, 0] },
        data: list.map((p) => p.sales),
      },
    ],
  }
})
</script>

<template>
  <div v-loading="loading" class="dashboard">
    <el-row :gutter="16">
      <el-col v-for="card in cards" :key="card.label" :xs="24" :sm="12" :lg="6">
        <div class="page-card stat-card">
          <div class="stat-icon" :style="{ background: card.color }">
            <el-icon :size="26"><component :is="card.icon" /></el-icon>
          </div>
          <div>
            <div class="stat-label">{{ card.label }}</div>
            <div class="stat-value">{{ card.value }}</div>
            <div v-if="card.compare !== undefined" class="stat-compare">
              较昨日
              <span :class="card.compare >= 0 ? 'up' : 'down'">
                {{ card.compare >= 0 ? '↑' : '↓' }} {{ Math.abs(card.compare) }}%
              </span>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="16">
      <el-col :xs="24" :lg="16">
        <div class="page-card">
          <div class="table-toolbar"><span class="title">近 7 日经营趋势</span></div>
          <EChart :option="trendOption" />
        </div>
      </el-col>
      <el-col :xs="24" :lg="8">
        <div class="page-card">
          <div class="table-toolbar"><span class="title">分类销量占比</span></div>
          <EChart :option="categoryOption" />
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="16">
      <el-col :xs="24" :lg="10">
        <div class="page-card">
          <div class="table-toolbar"><span class="title">热销商品 TOP10</span></div>
          <EChart :option="hotOption" height="360px" />
        </div>
      </el-col>
      <el-col :xs="24" :lg="14">
        <div class="page-card">
          <div class="table-toolbar">
            <span class="title">
              待接单
              <el-tag type="danger" round size="small">{{ data?.today.pendingCount ?? 0 }}</el-tag>
            </span>
            <el-button
              link
              type="primary"
              @click="$router.push('/order/list?status=pending_accept')"
            >
              查看全部
            </el-button>
          </div>
          <el-table :data="pendingOrders" height="360px">
            <el-table-column label="下单时间" prop="createdAt" width="160" />
            <el-table-column label="门店" prop="storeName" width="110" />
            <el-table-column label="商品" min-width="160" show-overflow-tooltip>
              <template #default="{ row }">
                {{
                  row.items.map((i: Order['items'][number]) => `${i.name}×${i.quantity}`).join('、')
                }}
              </template>
            </el-table-column>
            <el-table-column label="实付" width="90">
              <template #default="{ row }">{{ formatMoney(row.payAmount) }}</template>
            </el-table-column>
            <el-table-column label="操作" width="140" fixed="right">
              <template #default="{ row }">
                <OrderActions :order="row as Order" @done="load" />
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped lang="scss">
.stat-card {
  display: flex;
  gap: 16px;
  align-items: center;
}

.stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  color: #fff;
  border-radius: 12px;
}

.stat-label {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.stat-value {
  margin: 4px 0;
  font-size: 24px;
  font-weight: 600;
}

.stat-compare {
  font-size: 12px;
  color: var(--el-text-color-secondary);

  .up {
    color: var(--el-color-success);
  }

  .down {
    color: var(--el-color-danger);
  }
}
</style>
