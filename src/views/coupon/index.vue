<script setup lang="ts">
import { computed } from 'vue'
import dayjs from 'dayjs'
import { ElMessage, type FormRules } from 'element-plus'
import { couponApi } from '@/api'
import { confirmAction } from '@/composables/useConfirm'
import { useFormDialog } from '@/composables/useFormDialog'
import { useTable } from '@/composables/useTable'
import { useUserStore } from '@/stores/user'
import type { Coupon, CouponQuery, CouponType } from '@/types/models'
import { COUPON_TYPE, toOptions } from '@/utils/dict'
import type { TagType } from '@/utils/format'

type CouponForm = Pick<
  Coupon,
  'name' | 'type' | 'threshold' | 'value' | 'total' | 'startTime' | 'endTime' | 'enabled'
>

const { query, pagination, list, loading, load, search, reset } = useTable(
  (q) => couponApi.page(q),
  { keyword: '', type: undefined } as CouponQuery,
)
const canEdit = useUserStore().hasPermission('coupon:edit')
const typeOptions = toOptions(COUPON_TYPE)

const ruleText = (c: Pick<Coupon, 'type' | 'threshold' | 'value'>) => {
  if (c.type === 'discount')
    return `${c.threshold ? `满 ${c.threshold} 元` : '无门槛'}打 ${c.value} 折`
  if (c.type === 'no_threshold') return `无门槛减 ${c.value} 元`
  return `满 ${c.threshold} 减 ${c.value} 元`
}

function couponState(c: Coupon): { label: string; type: TagType } {
  if (!c.enabled) return { label: '已停用', type: 'info' }
  if (dayjs().isBefore(c.startTime)) return { label: '未开始', type: 'warning' }
  if (dayjs().isAfter(c.endTime)) return { label: '已结束', type: 'info' }
  return { label: '进行中', type: 'success' }
}

const dialog = useFormDialog<CouponForm>({
  defaults: () => ({
    name: '',
    type: 'full_reduction',
    threshold: 20,
    value: 5,
    total: 1000,
    startTime: dayjs().startOf('day').format('YYYY-MM-DD HH:mm:ss'),
    endTime: dayjs().add(30, 'day').endOf('day').format('YYYY-MM-DD HH:mm:ss'),
    enabled: true,
  }),
  create: (data) => couponApi.create(data),
  update: (id, data) => couponApi.update(id, data),
  onSuccess: load,
})
const { visible, submitting, formRef, form, isEdit } = dialog

const validity = computed({
  get: () => [form.startTime, form.endTime] as [string, string],
  set: (v: [string, string] | null) => {
    form.startTime = v?.[0] ?? ''
    form.endTime = v?.[1] ?? ''
  },
})

function onTypeChange(type: CouponType) {
  if (type === 'no_threshold') form.threshold = 0
  if (type === 'discount') form.value = 8.5
}

const rules: FormRules<CouponForm> = {
  name: [{ required: true, message: '请输入优惠券名称', trigger: 'blur' }],
  value: [
    {
      validator: (_rule, value: number, callback) => {
        if (form.type === 'discount' && (value <= 0 || value >= 10))
          callback(new Error('折扣需在 0~10 之间'))
        else if (form.type !== 'discount' && form.threshold && value >= form.threshold)
          callback(new Error('减免金额需小于使用门槛'))
        else callback()
      },
      trigger: 'change',
    },
  ],
  startTime: [{ required: true, message: '请选择有效期', trigger: 'change' }],
}

async function toggleEnabled(row: Coupon, enabled: boolean) {
  await couponApi.update(row.id, { enabled })
  ElMessage.success(enabled ? '已启用' : '已停用')
  load()
}

async function handleDelete(row: Coupon) {
  if (
    await confirmAction(
      `确定删除优惠券「${row.name}」？`,
      () => couponApi.remove(row.id),
      '删除成功',
    )
  )
    load()
}
</script>

<template>
  <div>
    <div class="page-card">
      <el-form :model="query" inline class="search-form" @submit.prevent="search">
        <el-form-item label="名称">
          <el-input v-model="query.keyword" placeholder="优惠券名称" clearable />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="query.type" placeholder="全部类型" clearable>
            <el-option v-for="o in typeOptions" :key="o.value" :label="o.label" :value="o.value" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" native-type="submit">查询</el-button>
          <el-button icon="Refresh" @click="reset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="page-card">
      <div class="table-toolbar">
        <span class="title">优惠券</span>
        <el-button v-permission="'coupon:edit'" type="primary" icon="Plus" @click="dialog.open()">
          新建优惠券
        </el-button>
      </div>
      <el-table v-loading="loading" :data="list" row-key="id">
        <el-table-column label="名称" prop="name" min-width="160" />
        <el-table-column label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="COUPON_TYPE[row.type as CouponType].type" size="small" effect="plain">
              {{ COUPON_TYPE[row.type as CouponType].label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="优惠规则" min-width="150">
          <template #default="{ row }">{{ ruleText(row as Coupon) }}</template>
        </el-table-column>
        <el-table-column label="领取 / 使用 / 总量" min-width="190">
          <template #default="{ row }">
            <div>{{ row.received }} / {{ row.used }} / {{ row.total }}</div>
            <el-progress
              :percentage="Math.round((row.received / row.total) * 100)"
              :stroke-width="6"
            />
          </template>
        </el-table-column>
        <el-table-column label="有效期" width="190">
          <template #default="{ row }">
            <div>{{ row.startTime.slice(0, 10) }} 至</div>
            <div>{{ row.endTime.slice(0, 10) }}</div>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="couponState(row as Coupon).type" size="small">{{
              couponState(row as Coupon).label
            }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="启用" width="80">
          <template #default="{ row }">
            <el-switch
              :model-value="row.enabled"
              :disabled="!canEdit"
              @change="toggleEnabled(row as Coupon, $event as boolean)"
            />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="130" fixed="right">
          <template #default="{ row }">
            <el-button
              v-permission="'coupon:edit'"
              link
              type="primary"
              @click="dialog.open(row as Coupon)"
              >编辑</el-button
            >
            <el-button
              v-permission="'coupon:delete'"
              link
              type="danger"
              @click="handleDelete(row as Coupon)"
              >删除</el-button
            >
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        v-model:current-page="pagination.page"
        class="table-pagination"
        :page-size="pagination.pageSize"
        :total="pagination.total"
        layout="total, prev, pager, next"
        @current-change="load"
      />
    </div>

    <el-dialog v-model="visible" :title="isEdit ? '编辑优惠券' : '新建优惠券'" width="560px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="96px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" maxlength="20" show-word-limit />
        </el-form-item>
        <el-form-item label="类型">
          <el-radio-group
            v-model="form.type"
            :disabled="isEdit"
            @change="onTypeChange($event as CouponType)"
          >
            <el-radio-button v-for="o in typeOptions" :key="o.value" :value="o.value">{{
              o.label
            }}</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="form.type !== 'no_threshold'" label="使用门槛">
          满 <el-input-number v-model="form.threshold" :min="0" class="inline-number" /> 元可用
        </el-form-item>
        <el-form-item :label="form.type === 'discount' ? '折扣' : '减免金额'" prop="value">
          <el-input-number
            v-model="form.value"
            :min="0"
            :precision="form.type === 'discount' ? 1 : 2"
            :step="form.type === 'discount' ? 0.5 : 1"
            class="inline-number"
          />
          {{ form.type === 'discount' ? '折' : '元' }}
        </el-form-item>
        <el-form-item label="发放总量">
          <el-input-number v-model="form.total" :min="1" :step="100" class="inline-number" /> 张
        </el-form-item>
        <el-form-item label="有效期" prop="startTime">
          <el-date-picker
            v-model="validity"
            type="datetimerange"
            value-format="YYYY-MM-DD HH:mm:ss"
            :default-time="[new Date(2000, 0, 1, 0, 0, 0), new Date(2000, 0, 1, 23, 59, 59)]"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
          />
        </el-form-item>
        <el-form-item label="预览">
          <el-tag type="danger" effect="dark">{{ ruleText(form) }}</el-tag>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="dialog.submit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.inline-number {
  margin: 0 8px;
}
</style>
