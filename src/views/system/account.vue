<script setup lang="ts">
import type { FormItemRule, FormRules } from 'element-plus'
import { computed } from 'vue'
import { accountApi } from '@/api'
import { confirmAction } from '@/composables/useConfirm'
import { useFormDialog } from '@/composables/useFormDialog'
import { useTable } from '@/composables/useTable'
import { useUserStore } from '@/stores/user'
import type { Account, AccountQuery, Role } from '@/types/models'
import { ROLE, toOptions } from '@/utils/dict'

type AccountForm = Pick<Account, 'username' | 'nickname' | 'role' | 'status'> & { password: string }

const { query, pagination, list, loading, load, search, reset } = useTable(
  (q) => accountApi.page(q),
  { keyword: '', role: undefined } as AccountQuery,
)
const roleOptions = toOptions(ROLE)
const currentUserId = computed(() => useUserStore().userInfo?.id)

const dialog = useFormDialog<AccountForm>({
  defaults: () => ({ username: '', nickname: '', role: 'operator', status: 1, password: '' }),
  create: (data) => accountApi.create(data),
  update: (id, data) => accountApi.update(id, data),
  onSuccess: load,
})
const { visible, submitting, formRef, form, isEdit } = dialog

const rules = computed<FormRules<AccountForm>>(() => ({
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_]{4,16}$/, message: '4~16 位字母、数字或下划线', trigger: 'blur' },
  ],
  nickname: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  password: [
    { required: !isEdit.value, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少 6 位', trigger: 'blur' } as FormItemRule,
  ],
}))

async function handleDelete(row: Account) {
  if (
    await confirmAction(
      `确定删除账号「${row.username}」？`,
      () => accountApi.remove(row.id),
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
        <el-form-item label="账号">
          <el-input v-model="query.keyword" placeholder="用户名 / 姓名" clearable />
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="query.role" placeholder="全部角色" clearable>
            <el-option v-for="o in roleOptions" :key="o.value" :label="o.label" :value="o.value" />
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
        <span class="title">后台账号</span>
        <el-button type="primary" icon="Plus" @click="dialog.open()">新增账号</el-button>
      </div>
      <el-table v-loading="loading" :data="list" row-key="id">
        <el-table-column label="用户名" prop="username" width="140" />
        <el-table-column label="姓名" prop="nickname" min-width="140" />
        <el-table-column label="角色" width="120">
          <template #default="{ row }">
            <el-tag :type="row.role === 'admin' ? 'danger' : 'primary'" size="small">
              {{ ROLE[row.role as Role] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.status ? 'success' : 'info'" size="small">
              {{ row.status ? '正常' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="最近登录" width="180">
          <template #default="{ row }">{{ row.lastLoginAt || '从未登录' }}</template>
        </el-table-column>
        <el-table-column label="创建时间" prop="createdAt" width="180" />
        <el-table-column label="操作" width="130" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="dialog.open(row as Account)">编辑</el-button>
            <el-button
              link
              type="danger"
              :disabled="row.id === 1 || row.id === currentUserId"
              @click="handleDelete(row as Account)"
            >
              删除
            </el-button>
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

    <el-dialog v-model="visible" :title="isEdit ? '编辑账号' : '新增账号'" width="480px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" :disabled="isEdit" />
        </el-form-item>
        <el-form-item label="姓名" prop="nickname">
          <el-input v-model="form.nickname" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input
            v-model="form.password"
            type="password"
            show-password
            :placeholder="isEdit ? '留空则不修改' : '至少 6 位'"
          />
        </el-form-item>
        <el-form-item label="角色">
          <el-radio-group v-model="form.role">
            <el-radio v-for="o in roleOptions" :key="o.value" :value="o.value">{{
              o.label
            }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="状态">
          <el-switch
            v-model="form.status"
            :active-value="1"
            :inactive-value="0"
            active-text="正常"
            inactive-text="停用"
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
