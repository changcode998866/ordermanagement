<script setup lang="ts">
import { onMounted, ref, shallowRef, useTemplateRef } from 'vue'
import { ElMessage } from 'element-plus'
import { categoryApi, productApi } from '@/api'
import { confirmAction } from '@/composables/useConfirm'
import { useTable } from '@/composables/useTable'
import { useUserStore } from '@/stores/user'
import ProductForm from './components/ProductForm.vue'
import type { Category, EnableStatus, Product, ProductQuery } from '@/types/models'
import { formatMoney } from '@/utils/format'

const LOW_STOCK = 10

const { query, pagination, list, loading, load, search, reset } = useTable(
  (q) => productApi.page(q),
  { keyword: '', categoryId: undefined, status: undefined } as ProductQuery,
)

const categories = shallowRef<Category[]>([])
onMounted(async () => {
  categories.value = await categoryApi.all()
})

const formRef = useTemplateRef<InstanceType<typeof ProductForm>>('form')
const canEdit = useUserStore().hasPermission('product:edit')

async function toggleStatus(row: Product, status: EnableStatus) {
  await productApi.update(row.id, { status })
  ElMessage.success(status ? '已上架' : '已下架')
  load()
}

const selected = ref<Product[]>([])
async function batchStatus(status: EnableStatus) {
  const ids = selected.value.map((p) => p.id)
  await confirmAction(`确定将选中的 ${ids.length} 个商品${status ? '上架' : '下架'}？`, () =>
    productApi.batchStatus(ids, status),
  )
  load()
}

async function handleDelete(row: Product) {
  if (
    await confirmAction(
      `确定删除商品「${row.name}」？`,
      () => productApi.remove(row.id),
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
        <el-form-item label="商品名称">
          <el-input v-model="query.keyword" placeholder="请输入商品名称" clearable />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="query.categoryId" placeholder="全部分类" clearable>
            <el-option v-for="c in categories" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.status" placeholder="全部" clearable>
            <el-option label="上架" :value="1" />
            <el-option label="下架" :value="0" />
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
        <div v-permission="'product:edit'">
          <el-button type="primary" icon="Plus" @click="formRef?.open()">新增商品</el-button>
          <el-button :disabled="!selected.length" @click="batchStatus(1)">批量上架</el-button>
          <el-button :disabled="!selected.length" @click="batchStatus(0)">批量下架</el-button>
        </div>
      </div>

      <el-table v-loading="loading" :data="list" row-key="id" @selection-change="selected = $event">
        <el-table-column v-if="canEdit" type="selection" width="45" />
        <el-table-column label="商品" min-width="220">
          <template #default="{ row }">
            <div class="goods">
              <el-image
                :src="row.image"
                class="goods-img"
                :preview-src-list="[row.image]"
                preview-teleported
              />
              <div>
                <div class="goods-name">{{ row.name }}</div>
                <div class="text-secondary">
                  {{
                    row.specs.length
                      ? row.specs.map((s: Product['specs'][number]) => s.name).join(' / ')
                      : '无规格'
                  }}
                </div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="分类" prop="categoryName" width="110" />
        <el-table-column label="售价" width="140">
          <template #default="{ row }">
            <span class="text-danger">{{ formatMoney(row.price) }}</span>
            <span v-if="row.originalPrice > row.price" class="text-line-through">
              {{ formatMoney(row.originalPrice) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="库存" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.stock === 0" type="danger" size="small">售罄</el-tag>
            <span v-else :class="{ 'text-danger': row.stock < LOW_STOCK }">{{ row.stock }}</span>
          </template>
        </el-table-column>
        <el-table-column label="销量" prop="sales" width="90" sortable />
        <el-table-column label="上架" width="90">
          <template #default="{ row }">
            <el-switch
              :model-value="row.status"
              :active-value="1"
              :inactive-value="0"
              :disabled="!canEdit"
              @change="toggleStatus(row as Product, $event as EnableStatus)"
            />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="130" fixed="right">
          <template #default="{ row }">
            <el-button
              v-permission="'product:edit'"
              link
              type="primary"
              @click="formRef?.open(row as Product)"
            >
              编辑
            </el-button>
            <el-button
              v-permission="'product:delete'"
              link
              type="danger"
              @click="handleDelete(row as Product)"
            >
              删除
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

    <ProductForm ref="form" :categories="categories" @success="load" />
  </div>
</template>

<style scoped lang="scss">
.goods {
  display: flex;
  gap: 12px;
  align-items: center;
}

.goods-img {
  flex-shrink: 0;
  width: 52px;
  height: 52px;
  border-radius: 6px;
}

.goods-name {
  font-weight: 500;
}
</style>
