<script setup lang="ts">
import { computed, onMounted, ref, shallowRef } from 'vue'
import { useRoute } from 'vue-router'
import { orderApi } from '@/api'
import OrderActions from './components/OrderActions.vue'
import type { Order, OrderStatus } from '@/types/models'
import { ORDER_STATUS, PAY_METHOD } from '@/utils/dict'
import { formatMoney } from '@/utils/format'

const route = useRoute()
const order = shallowRef<Order>()
const loading = ref(true)

async function load() {
  loading.value = true
  try {
    order.value = await orderApi.detail(Number(route.params.id))
  } finally {
    loading.value = false
  }
}
onMounted(load)

const STEPS: OrderStatus[] = ['pending_accept', 'preparing', 'delivering', 'completed']
const STEP_TITLES = ['已支付', '商家接单', '骑手配送', '已送达']

const activeStep = computed(() => {
  const status = order.value?.status
  if (!status) return 0
  if (status === 'refunding' || status === 'refunded') return 4
  const index = STEPS.indexOf(status)
  return index >= 0 ? index + (status === 'completed' ? 1 : 0) : 0
})

const isAbnormal = computed(() =>
  ['cancelled', 'refunding', 'refunded', 'pending_payment'].includes(order.value?.status ?? ''),
)
</script>

<template>
  <div v-loading="loading">
    <template v-if="order">
      <div class="page-card">
        <div class="table-toolbar">
          <div class="title">
            订单 {{ order.orderNo }}
            <el-tag :type="ORDER_STATUS[order.status].type" class="status-tag">
              {{ ORDER_STATUS[order.status].label }}
            </el-tag>
          </div>
          <div>
            <OrderActions :order="order" size="default" @done="(o) => (order = o)" />
            <el-button icon="Back" @click="$router.back()">返回</el-button>
          </div>
        </div>
        <el-steps v-if="!isAbnormal" :active="activeStep" finish-status="success" align-center>
          <el-step v-for="title in STEP_TITLES" :key="title" :title="title" />
        </el-steps>
        <el-alert
          v-else
          :type="order.status === 'pending_payment' ? 'info' : 'error'"
          :closable="false"
          :title="order.logs[order.logs.length - 1]?.remark"
          :description="order.refundReason ? `退款原因：${order.refundReason}` : ''"
          show-icon
        />
      </div>

      <el-row :gutter="16">
        <el-col :xs="24" :lg="16">
          <div class="page-card">
            <el-descriptions title="订单信息" :column="2" border>
              <el-descriptions-item label="门店">{{ order.storeName }}</el-descriptions-item>
              <el-descriptions-item label="下单时间">{{ order.createdAt }}</el-descriptions-item>
              <el-descriptions-item label="顾客">
                {{ order.customerName }}（{{ order.customerPhone }}）
              </el-descriptions-item>
              <el-descriptions-item label="支付方式">{{
                PAY_METHOD[order.payMethod]
              }}</el-descriptions-item>
              <el-descriptions-item label="收货地址" :span="2">{{
                order.address
              }}</el-descriptions-item>
              <el-descriptions-item label="备注" :span="2">
                <span :class="{ 'text-danger': order.remark }">{{ order.remark || '无' }}</span>
              </el-descriptions-item>
              <el-descriptions-item label="配送骑手" :span="2">
                {{ order.riderName ? `${order.riderName}（${order.riderPhone}）` : '未派单' }}
              </el-descriptions-item>
            </el-descriptions>
          </div>

          <div class="page-card">
            <div class="table-toolbar"><span class="title">商品明细</span></div>
            <el-table :data="order.items">
              <el-table-column label="商品" min-width="200">
                <template #default="{ row }">
                  <div class="goods">
                    <el-image :src="row.image" class="goods-img" />
                    <div>
                      <div>{{ row.name }}</div>
                      <div v-if="row.spec" class="text-secondary">{{ row.spec }}</div>
                    </div>
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="单价" width="100">
                <template #default="{ row }">{{ formatMoney(row.price) }}</template>
              </el-table-column>
              <el-table-column label="数量" prop="quantity" width="80" />
              <el-table-column label="小计" width="100" align="right">
                <template #default="{ row }">{{ formatMoney(row.price * row.quantity) }}</template>
              </el-table-column>
            </el-table>
            <div class="amounts">
              <div><span>商品金额</span>{{ formatMoney(order.goodsAmount) }}</div>
              <div><span>打包费</span>{{ formatMoney(order.packingFee) }}</div>
              <div><span>配送费</span>{{ formatMoney(order.deliveryFee) }}</div>
              <div class="text-danger">
                <span>优惠</span>-{{ formatMoney(order.discountAmount) }}
              </div>
              <div class="total"><span>实付金额</span>{{ formatMoney(order.payAmount) }}</div>
            </div>
          </div>
        </el-col>

        <el-col :xs="24" :lg="8">
          <div class="page-card">
            <div class="table-toolbar"><span class="title">订单日志</span></div>
            <el-timeline>
              <el-timeline-item
                v-for="(log, i) in [...order.logs].reverse()"
                :key="i"
                :timestamp="log.time"
                :type="i === 0 ? 'primary' : undefined"
              >
                {{ log.remark }}
              </el-timeline-item>
            </el-timeline>
          </div>
        </el-col>
      </el-row>
    </template>
  </div>
</template>

<style scoped lang="scss">
.status-tag {
  margin-left: 8px;
  vertical-align: middle;
}

.goods {
  display: flex;
  gap: 10px;
  align-items: center;
}

.goods-img {
  width: 44px;
  height: 44px;
  border-radius: 6px;
}

.amounts {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: flex-end;
  margin-top: 16px;

  span {
    display: inline-block;
    width: 90px;
    color: var(--el-text-color-secondary);
  }

  .total {
    font-size: 18px;
    font-weight: 600;
    color: var(--el-color-primary);
  }
}
</style>
