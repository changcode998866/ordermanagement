<script setup lang="ts">
import { computed, ref, shallowRef } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { orderApi, riderApi } from '@/api'
import { useUserStore } from '@/stores/user'
import type { Order, OrderAction, Rider } from '@/types/models'

const props = withDefaults(defineProps<{ order: Order; size?: 'small' | 'default' }>(), {
  size: 'small',
})
const emit = defineEmits<{ done: [order: Order] }>()

const canOperate = computed(() => useUserStore().hasPermission('order:operate'))
const loading = ref(false)

async function run(action: OrderAction, extra: { riderId?: number; reason?: string } = {}) {
  loading.value = true
  try {
    const order = await orderApi.action(props.order.id, { action, ...extra })
    ElMessage.success('操作成功')
    emit('done', order)
  } finally {
    loading.value = false
  }
}

async function confirmRun(action: OrderAction, message: string) {
  try {
    await ElMessageBox.confirm(message, '提示', { type: 'warning' })
  } catch {
    return
  }
  await run(action)
}

async function promptRun(action: OrderAction, title: string) {
  let reason: string
  try {
    const res = await ElMessageBox.prompt('请输入原因（将通知用户）', title, {
      inputPlaceholder: '如：门店繁忙、食材售罄',
      inputValidator: (v) => !!v?.trim() || '请输入原因',
    })
    reason = res.value
  } catch {
    return
  }
  await run(action, { reason })
}

/* 派单 */
const dispatchVisible = ref(false)
const riders = shallowRef<Rider[]>([])
const riderId = ref<number>()
const ridersLoading = ref(false)

async function openDispatch() {
  dispatchVisible.value = true
  riderId.value = undefined
  ridersLoading.value = true
  try {
    riders.value = await riderApi.idle()
  } finally {
    ridersLoading.value = false
  }
}

async function submitDispatch() {
  if (!riderId.value) return ElMessage.warning('请选择骑手')
  await run('dispatch', { riderId: riderId.value })
  dispatchVisible.value = false
}
</script>

<template>
  <span v-if="canOperate" class="order-actions">
    <template v-if="order.status === 'pending_accept'">
      <el-button
        type="primary"
        :size="size"
        :loading="loading"
        @click="confirmRun('accept', '确认接单并开始制作？')"
      >
        接单
      </el-button>
      <el-button type="danger" :size="size" plain @click="promptRun('reject', '拒单')"
        >拒单</el-button
      >
    </template>
    <el-button
      v-else-if="order.status === 'preparing'"
      type="warning"
      :size="size"
      @click="openDispatch"
    >
      派单
    </el-button>
    <el-button
      v-else-if="order.status === 'delivering'"
      type="success"
      :size="size"
      :loading="loading"
      @click="confirmRun('complete', '确认订单已送达？')"
    >
      确认送达
    </el-button>
    <template v-else-if="order.status === 'refunding'">
      <el-button
        type="danger"
        :size="size"
        :loading="loading"
        @click="
          confirmRun('agreeRefund', `同意退款 ¥${order.payAmount.toFixed(2)}？款项将原路退回`)
        "
      >
        同意退款
      </el-button>
      <el-button :size="size" @click="promptRun('refuseRefund', '拒绝退款')">拒绝</el-button>
    </template>

    <el-dialog v-model="dispatchVisible" title="选择配送骑手" width="460px" append-to-body>
      <div v-loading="ridersLoading" class="rider-list">
        <el-empty
          v-if="!riders.length && !ridersLoading"
          description="暂无空闲骑手"
          :image-size="80"
        />
        <el-radio-group v-model="riderId">
          <el-radio v-for="r in riders" :key="r.id" :value="r.id" border class="rider-item">
            {{ r.name }}
            <span class="text-secondary"
              >{{ r.phone }} · 今日 {{ r.todayOrders }} 单 · ⭐{{ r.rating }}</span
            >
          </el-radio>
        </el-radio-group>
      </div>
      <template #footer>
        <el-button @click="dispatchVisible = false">取消</el-button>
        <el-button type="primary" :loading="loading" @click="submitDispatch">确认派单</el-button>
      </template>
    </el-dialog>
  </span>
</template>

<style scoped lang="scss">
.order-actions {
  display: inline-flex;
  gap: 6px;

  .el-button + .el-button {
    margin-left: 0;
  }
}

.rider-list {
  min-height: 120px;

  .el-radio-group {
    display: flex;
    flex-direction: column;
    gap: 10px;
    align-items: stretch;
  }
}

.rider-item {
  width: 100%;
  margin-right: 0;

  .text-secondary {
    margin-left: 8px;
    font-size: 12px;
  }
}
</style>
