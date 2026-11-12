<script setup lang="ts">
import type { FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import { categoryApi } from '@/api'
import { confirmAction } from '@/composables/useConfirm'
import { useFormDialog } from '@/composables/useFormDialog'
import { useTable } from '@/composables/useTable'
import { useUserStore } from '@/stores/user'
import type { Category, EnableStatus } from '@/types/models'

type CategoryForm = Pick<Category, 'name' | 'sort' | 'status'>

const { pagination, list, loading, load } = useTable(
  (q) => categoryApi.page(q),
  {},
  { pageSize: 20 },
)
const canEdit = useUserStore().hasPermission('category:edit')

const dialog = useFormDialog<CategoryForm>({
  defaults: () => ({ name: '', sort: list.value.length + 1, status: 1 }),
  create: (data) => categoryApi.create(data),
  update: (id, data) => categoryApi.update(id, data),
  onSuccess: load,
})
const { visible, submitting, formRef, form, isEdit } = dialog

const rules: FormRules<CategoryForm> = {
  name: [{ required: true, message: '请输入分类名称', trigger: 'blur' }],
}

async function toggleStatus(row: Category, status: EnableStatus) {
  await categoryApi.update(row.id, { status })
  ElMessage.success(status ? '已启用' : '已停用')
  load()
}

async function handleDelete(row: Category) {
  if (
    await confirmAction(
      `确定删除分类「${row.name}」？`,
      () => categoryApi.remove(row.id),
      '删除成功',
    )
  )
    load()
}
</script>

<template>
  <div class="page-card">
    <div class="table-toolbar">
      <span class="title">商品分类</span>
      <el-button v-permission="'category:edit'" type="primary" icon="Plus" @click="dialog.open()">
        新增分类
      </el-button>
    </div>
    <el-alert
      type="info"
      :closable="false"
      title="排序值越小越靠前，用户端点餐页的分类导航将按此顺序展示。停用后该分类下商品在用户端不可见。"
      style="margin-bottom: 14px"
    />
    <el-table v-loading="loading" :data="list" row-key="id">
      <el-table-column label="排序" prop="sort" width="80" />
      <el-table-column label="分类名称" prop="name" min-width="160" />
      <el-table-column label="商品数" prop="productCount" width="100" />
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-switch
            :model-value="row.status"
            :active-value="1"
            :inactive-value="0"
            :disabled="!canEdit"
            @change="toggleStatus(row as Category, $event as EnableStatus)"
          />
        </template>
      </el-table-column>
      <el-table-column label="创建时间" prop="createdAt" width="180" />
      <el-table-column label="操作" width="140" fixed="right">
        <template #default="{ row }">
          <el-button
            v-permission="'category:edit'"
            link
            type="primary"
            @click="dialog.open(row as Category)"
          >
            编辑
          </el-button>
          <el-button
            v-permission="'category:delete'"
            link
            type="danger"
            @click="handleDelete(row as Category)"
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
      hide-on-single-page
      @current-change="load"
    />

    <el-dialog v-model="visible" :title="isEdit ? '编辑分类' : '新增分类'" width="460px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="分类名称" prop="name">
          <el-input v-model="form.name" maxlength="10" show-word-limit />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sort" :min="0" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="form.status" :active-value="1" :inactive-value="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="dialog.submit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>
