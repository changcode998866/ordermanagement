<script setup lang="ts">
import { computed, onMounted, shallowRef } from 'vue'
import { ElMessage, type FormRules } from 'element-plus'
import { riderApi } from '@/api'
import { confirmAction } from '@/composables/useConfirm'
import { useFormDialog } from '@/composables/useFormDialog'
import { useTable } from '@/composables/useTable'
import type { Rider, RiderQuery, RiderStatus } from '@/types/models'
import { RIDER_STATUS, toOptions } from '@/utils/dict'

type RiderForm = Pick<Rider, 'name' | 'phone' | 'status'>

const { query, pagination, list, loading, load, search, reset } = useTable(
  (q) => riderApi.page(q),
  { keyword: '', status: undefined } as RiderQuery,
)
const statusOptions = toOptions(RIDER_STATUS)

/* 顶部统计：拉取全部骑手计算状态分布 */
const allRiders = shallowRef<Rider[]>([])
async function loadSummary() {
  allRiders.value = (await riderApi.page({ page: 1, pageSize: 1000 })).list
}
onMounted(loadSummary)
const summary = computed(() =>
  statusOptions.map((o) => ({
    ...o,
    ...RIDER_STATUS[o.value],
    count: allRiders.value.filter((r) => r.status === o.value).length,
  })),
)
const todayTotal = computed(() => allRiders.value.reduce((s, r) => s + r.todayOrders, 0))

function refresh() {
  load()
  loadSummary()
}

const dialog = useFormDialog<RiderForm>({
  defaults: () => ({ name: '', phone: '', status: 'idle' }),
  create: (data) => riderApi.create(data),
  update: (id, data) => riderApi.update(id, data),
  onSuccess: refresh,
})
const { visible, submitting, formRef, form, isEdit } = dialog

const rules: FormRules<RiderForm> = {
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1\d{10}$/, message: '手机号格式不正确', trigger: 'blur' },
  ],
}

async function changeStatus(row: Rider, status: RiderStatus) {
  await riderApi.update(row.id, { status })
  ElMessage.success('状态已更新')
  refresh()
}

async function handleDelete(row: Rider) {
  if (
    await confirmAction(`确定删除骑手「${row.name}」？`, () => riderApi.remove(row.id), '删除成功')
  )
    refresh()
}
</script>

<template>
  <div>
    <el-row :gutter="16">
      <el-col v-for="item in summary" :key="item.value" :xs="12" :sm="6">
        <div class="page-card summary">
          <div class="text-secondary">{{ item.label }}骑手</div>
          <div class="summary-value">
            <el-tag :type="item.type" effect="dark" round size="small">{{ item.label }}</el-tag>
            {{ item.count }}
          </div>
        </div>
      </el-col>
      <el-col :xs="12" :sm="6">
        <div class="page-card summary">
          <div class="text-secondary">今日配送单量</div>
          <div class="summary-value">🛵 {{ todayTotal }}</div>
        </div>
      </el-col>
    </el-row>

    <div class="page-card">
      <el-form :model="query" inline class="search-form" @submit.prevent="search">
        <el-form-item label="骑手">
          <el-input v-model="query.keyword" placeholder="姓名 / 手机号" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.status" placeholder="全部" clearable>
            <el-option
              v-for="o in statusOptions"
              :key="o.value"
              :label="o.label"
              :value="o.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" native-type="submit">查询</el-button>
          <el-button icon="Refresh" @click="reset">重置</el-button>
        </el-form-item>
      </el-form>

      <div class="table-toolbar">
        <span class="title">骑手列表</span>
        <el-button v-permission="'rider:edit'" type="primary" icon="Plus" @click="dialog.open()">
          新增骑手
        </el-button>
      </div>
      <el-table v-loading="loading" :data="list" row-key="id">
        <el-table-column label="姓名" prop="name" width="120" />
        <el-table-column label="手机号" prop="phone" width="140" />
        <el-table-column label="状态" width="140">
          <template #default="{ row }">
            <el-select
              v-if="row.status !== 'busy'"
              :model-value="row.status"
              size="small"
              style="width: 100px"
              @change="changeStatus(row as Rider, $event as RiderStatus)"
            >
              <el-option label="空闲" value="idle" />
              <el-option label="离线" value="offline" />
            </el-select>
            <el-tag v-else :type="RIDER_STATUS.busy.type">{{ RIDER_STATUS.busy.label }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="今日单量" prop="todayOrders" width="100" sortable />
        <el-table-column label="累计单量" prop="totalOrders" width="100" sortable />
        <el-table-column label="评分" width="170">
          <template #default="{ row }">
            <el-rate :model-value="row.rating" disabled show-score allow-half />
          </template>
        </el-table-column>
        <el-table-column label="入职时间" prop="createdAt" min-width="170" />
        <el-table-column label="操作" width="130" fixed="right">
          <template #default="{ row }">
            <el-button
              v-permission="'rider:edit'"
              link
              type="primary"
              @click="dialog.open(row as Rider)"
              >编辑</el-button
            >
            <el-button
              v-permission="'rider:delete'"
              link
              type="danger"
              @click="handleDelete(row as Rider)"
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

    <el-dialog v-model="visible" :title="isEdit ? '编辑骑手' : '新增骑手'" width="440px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="70px">
        <el-form-item label="姓名" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="form.phone" maxlength="11" />
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
.summary-value {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-top: 8px;
  font-size: 26px;
  font-weight: 600;
}
</style>
