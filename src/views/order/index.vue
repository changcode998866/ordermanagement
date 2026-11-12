<script setup lang="ts">
import { onMounted, ref, shallowRef } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { orderApi, storeApi } from '@/api'
import { useTable } from '@/composables/useTable'
import OrderActions from './components/OrderActions.vue'
import type { Order, OrderQuery, OrderStatus, Store } from '@/types/models'
import { ORDER_STATUS, PAY_METHOD, toOptions } from '@/utils/dict'
import { exportExcel } from '@/utils/excel'
import { formatMoney } from '@/utils/format'

const route = useRoute()

const { query, pagination, list, loading, load, search, reset } = useTable(
  (q) => orderApi.page(q),
  {
    keyword: '',
    status: '',
    storeId: undefined,
    startDate: '',
    endDate: '',
  } as OrderQuery,
  { immediate: false },
)

// 支持从其他页面带参跳转，如 /order/list?status=pending_accept
if (typeof route.query.status === 'string') query.status = route.query.status as OrderStatus
if (typeof route.query.keyword === 'string') query.keyword = route.query.keyword

const dateRange = ref<[string, string] | null>(null)
function onDateChange(value: [string, string] | null) {
  query.startDate = value?.[0] ?? ''
  query.endDate = value?.[1] ?? ''
}
function handleReset() {
  dateRange.value = null
  reset()
}

const stores = shallowRef<Store[]>([])
onMounted(async () => {
  load()
  stores.value = await storeApi.all()
})

const statusTabs = [{ value: '', label: '全部' }, ...toOptions(ORDER_STATUS)]

const itemsText = (order: Order) => order.items.map((i) => `${i.name}×${i.quantity}`).join('、')

const exporting = ref(false)
async function handleExport() {
  exporting.value = true
  try {
    const { list: rows } = await orderApi.page({ ...query, page: 1, pageSize: 10000 })
    if (!rows.length) return ElMessage.warning('没有可导出的数据')
    await exportExcel(
      rows,
      [
        { label: '订单号', value: (r) => r.orderNo },
        { label: '下单时间', value: (r) => r.createdAt },
        { label: '门店', value: (r) => r.storeName },
        { label: '顾客', value: (r) => r.customerName },
        { label: '手机号', value: (r) => r.customerPhone },
        { label: '收货地址', value: (r) => r.address },
        { label: '商品', value: itemsText },
        { label: '商品金额', value: (r) => r.goodsAmount },
        { label: '优惠', value: (r) => r.discountAmount },
        { label: '实付金额', value: (r) => r.payAmount },
        { label: '支付方式', value: (r) => PAY_METHOD[r.payMethod] },
        { label: '状态', value: (r) => ORDER_STATUS[r.status].label },
        { label: '骑手', value: (r) => r.riderName || '-' },
      ],
      `订单数据_${new Date().toLocaleDateString('sv')}`,
    )
    ElMessage.success(`已导出 ${rows.length} 条订单`)
  } finally {
    exporting.value = false
  }
}

function onActionDone(updated: Order) {
  // 状态筛选下，操作后订单可能不再属于当前列表，直接刷新
  if (query.status) return load()
  list.value = list.value.map((o) => (o.id === updated.id ? updated : o))
}
</script>

<template>
  <div>
    <div class="page-card">
      <el-form :model="query" inline class="search-form" @submit.prevent="search">
        <el-form-item label="关键词">
          <el-input v-model="query.keyword" placeholder="订单号 / 顾客 / 手机号" clearable />
        </el-form-item>
        <el-form-item label="门店">
          <el-select v-model="query.storeId" placeholder="全部门店" clearable>
            <el-option v-for="s in stores" :key="s.id" :label="s.name" :value="s.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="下单日期">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            value-format="YYYY-MM-DD"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 260px"
            @change="onDateChange"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" native-type="submit">查询</el-button>
          <el-button icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="page-card">
      <div class="table-toolbar">
        <el-radio-group v-model="query.status" @change="search">
          <el-radio-button v-for="tab in statusTabs" :key="tab.value" :value="tab.value">
            {{ tab.label }}
          </el-radio-button>
        </el-radio-group>
        <el-button
          v-permission="'order:export'"
          icon="Download"
          :loading="exporting"
          @click="handleExport"
        >
          导出 Excel
        </el-button>
      </div>

      <el-table v-loading="loading" :data="list" row-key="id">
        <el-table-column label="订单号" min-width="190">
          <template #default="{ row }">
            <el-link type="primary" @click="$router.push(`/order/detail/${row.id}`)">
              {{ row.orderNo }}
            </el-link>
            <div class="text-secondary">{{ row.createdAt }}</div>
          </template>
        </el-table-column>
        <el-table-column label="门店" prop="storeName" width="110" />
        <el-table-column label="顾客" width="130">
          <template #default="{ row }">
            <div>{{ row.customerName }}</div>
            <div class="text-secondary">{{ row.customerPhone }}</div>
          </template>
        </el-table-column>
        <el-table-column label="商品" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">{{ itemsText(row as Order) }}</template>
        </el-table-column>
        <el-table-column label="实付" width="100">
          <template #default="{ row }">
            <strong>{{ formatMoney(row.payAmount) }}</strong>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="ORDER_STATUS[row.status as OrderStatus].type" size="small">
              {{ ORDER_STATUS[row.status as OrderStatus].label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="骑手" width="90">
          <template #default="{ row }">{{ row.riderName || '-' }}</template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <OrderActions :order="row as Order" @done="onActionDone" />
            <el-button
              link
              type="primary"
              size="small"
              @click="$router.push(`/order/detail/${row.id}`)"
            >
              详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        class="table-pagination"
        :total="pagination.total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        @current-change="load"
        @size-change="search"
      />
    </div>
  </div>
</template>
