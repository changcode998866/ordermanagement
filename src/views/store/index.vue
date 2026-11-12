<script setup lang="ts">
import type { FormRules } from 'element-plus'
import { storeApi } from '@/api'
import { confirmAction } from '@/composables/useConfirm'
import { useFormDialog } from '@/composables/useFormDialog'
import { useTable } from '@/composables/useTable'
import type { Store, StoreQuery } from '@/types/models'
import { formatMoney } from '@/utils/format'

type StoreForm = Omit<Store, 'id' | 'createdAt'>

const { query, pagination, list, loading, load, search, reset } = useTable(
  (q) => storeApi.page(q),
  { keyword: '', status: undefined } as StoreQuery,
)

const dialog = useFormDialog<StoreForm>({
  defaults: () => ({
    name: '',
    phone: '',
    address: '',
    openTime: '09:00',
    closeTime: '22:00',
    deliveryFee: 3,
    minOrderAmount: 20,
    deliveryRadius: 3,
    status: 1,
  }),
  create: (data) => storeApi.create(data),
  update: (id, data) => storeApi.update(id, data),
  onSuccess: load,
})
const { visible, submitting, formRef, form, isEdit } = dialog

const rules: FormRules<StoreForm> = {
  name: [{ required: true, message: '请输入门店名称', trigger: 'blur' }],
  phone: [{ required: true, message: '请输入联系电话', trigger: 'blur' }],
  address: [{ required: true, message: '请输入门店地址', trigger: 'blur' }],
}

async function toggleStatus(row: Store) {
  const next = row.status ? 0 : 1
  const ok = await confirmAction(
    next
      ? `确定将「${row.name}」设为营业中？`
      : `确定将「${row.name}」设为休息中？休息期间用户无法下单`,
    () => storeApi.update(row.id, { status: next }),
  )
  if (ok) load()
}

async function handleDelete(row: Store) {
  if (
    await confirmAction(`确定删除门店「${row.name}」？`, () => storeApi.remove(row.id), '删除成功')
  )
    load()
}
</script>

<template>
  <div>
    <div class="page-card">
      <el-form :model="query" inline class="search-form" @submit.prevent="search">
        <el-form-item label="门店">
          <el-input v-model="query.keyword" placeholder="名称 / 地址" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.status" placeholder="全部" clearable>
            <el-option label="营业中" :value="1" />
            <el-option label="休息中" :value="0" />
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
        <span class="title">门店列表</span>
        <el-button type="primary" icon="Plus" @click="dialog.open()">新增门店</el-button>
      </div>
      <el-table v-loading="loading" :data="list" row-key="id">
        <el-table-column label="门店名称" prop="name" min-width="130" />
        <el-table-column label="地址" prop="address" min-width="220" show-overflow-tooltip />
        <el-table-column label="电话" prop="phone" width="130" />
        <el-table-column label="营业时间" width="120">
          <template #default="{ row }">{{ row.openTime }} - {{ row.closeTime }}</template>
        </el-table-column>
        <el-table-column label="起送 / 配送费" width="130">
          <template #default="{ row }">
            {{ formatMoney(row.minOrderAmount) }} / {{ formatMoney(row.deliveryFee) }}
          </template>
        </el-table-column>
        <el-table-column label="配送范围" width="90">
          <template #default="{ row }">{{ row.deliveryRadius }} km</template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag
              :type="row.status ? 'success' : 'info'"
              class="clickable"
              @click="toggleStatus(row as Store)"
            >
              {{ row.status ? '营业中' : '休息中' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="130" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="dialog.open(row as Store)">编辑</el-button>
            <el-button link type="danger" @click="handleDelete(row as Store)">删除</el-button>
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

    <el-dialog v-model="visible" :title="isEdit ? '编辑门店' : '新增门店'" width="600px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="96px">
        <el-form-item label="门店名称" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="联系电话" prop="phone">
          <el-input v-model="form.phone" />
        </el-form-item>
        <el-form-item label="门店地址" prop="address">
          <el-input v-model="form.address" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="营业时间">
          <el-time-select
            v-model="form.openTime"
            start="00:00"
            step="00:30"
            end="23:30"
            style="width: 130px"
          />
          <span class="range-sep">至</span>
          <el-time-select
            v-model="form.closeTime"
            start="00:00"
            step="00:30"
            end="23:30"
            style="width: 130px"
          />
        </el-form-item>
        <el-form-item label="起送价">
          <el-input-number v-model="form.minOrderAmount" :min="0" :precision="2" />
        </el-form-item>
        <el-form-item label="配送费">
          <el-input-number v-model="form.deliveryFee" :min="0" :precision="2" />
        </el-form-item>
        <el-form-item label="配送范围">
          <el-input-number v-model="form.deliveryRadius" :min="1" :max="20" />
          <span class="range-sep">公里</span>
        </el-form-item>
        <el-form-item label="营业状态">
          <el-switch
            v-model="form.status"
            :active-value="1"
            :inactive-value="0"
            active-text="营业中"
            inactive-text="休息中"
          />
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
.range-sep {
  margin: 0 10px;
  color: var(--el-text-color-secondary);
}

.clickable {
  cursor: pointer;
}
</style>
