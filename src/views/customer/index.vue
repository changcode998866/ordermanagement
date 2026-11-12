<script setup lang="ts">
import { customerApi } from '@/api'
import { confirmAction } from '@/composables/useConfirm'
import { useTable } from '@/composables/useTable'
import type { Customer, CustomerQuery } from '@/types/models'
import { formatMoney } from '@/utils/format'

const { query, pagination, list, loading, load, search, reset } = useTable(
  (q) => customerApi.page(q),
  { keyword: '', status: undefined } as CustomerQuery,
)

async function toggleStatus(row: Customer) {
  const next = row.status ? 0 : 1
  const ok = await confirmAction(
    next
      ? `确定解除对「${row.nickname}」的限制？`
      : `确定拉黑「${row.nickname}」？拉黑后该用户将无法下单`,
    () => customerApi.update(row.id, { status: next }),
  )
  if (ok) load()
}
</script>

<template>
  <div>
    <div class="page-card">
      <el-form :model="query" inline class="search-form" @submit.prevent="search">
        <el-form-item label="用户">
          <el-input v-model="query.keyword" placeholder="昵称 / 手机号" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.status" placeholder="全部" clearable>
            <el-option label="正常" :value="1" />
            <el-option label="已拉黑" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" native-type="submit">查询</el-button>
          <el-button icon="Refresh" @click="reset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="page-card">
      <el-table v-loading="loading" :data="list" row-key="id">
        <el-table-column label="用户" min-width="180">
          <template #default="{ row }">
            <div class="user">
              <el-avatar :src="row.avatar" :size="36" />
              <div>
                <div>{{ row.nickname }}</div>
                <div class="text-secondary">ID: {{ row.id }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="手机号" prop="phone" width="140" />
        <el-table-column label="下单次数" prop="orderCount" width="110" sortable />
        <el-table-column label="累计消费" prop="totalSpent" width="130" sortable>
          <template #default="{ row }">{{ formatMoney(row.totalSpent) }}</template>
        </el-table-column>
        <el-table-column label="注册时间" prop="registeredAt" width="180" />
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.status ? 'success' : 'danger'" size="small">
              {{ row.status ? '正常' : '已拉黑' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button
              link
              type="primary"
              @click="$router.push({ path: '/order/list', query: { keyword: row.phone } })"
            >
              订单
            </el-button>
            <el-button
              v-permission="'customer:edit'"
              link
              :type="row.status ? 'danger' : 'success'"
              @click="toggleStatus(row as Customer)"
            >
              {{ row.status ? '拉黑' : '解除' }}
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
        layout="total, sizes, prev, pager, next"
        @current-change="load"
        @size-change="search"
      />
    </div>
  </div>
</template>

<style scoped>
.user {
  display: flex;
  gap: 10px;
  align-items: center;
}
</style>
