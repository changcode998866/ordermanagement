<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import type { FormRules } from 'element-plus'
import { productApi } from '@/api'
import ImageUpload from '@/components/ImageUpload.vue'
import { useFormDialog } from '@/composables/useFormDialog'
import type { Category, Product } from '@/types/models'

defineProps<{ categories: Category[] }>()
const emit = defineEmits<{ success: [] }>()

const RichEditor = defineAsyncComponent(() => import('@/components/RichEditor.vue'))

type ProductForm = Omit<Product, 'id' | 'createdAt' | 'categoryName' | 'sales'>

const { visible, submitting, formRef, form, isEdit, open, submit } = useFormDialog<ProductForm>({
  defaults: () => ({
    name: '',
    categoryId: undefined as unknown as number,
    image: '',
    price: 0,
    originalPrice: 0,
    packingFee: 1,
    stock: 100,
    specs: [],
    description: '',
    status: 1,
  }),
  create: (data) => productApi.create(data),
  update: (id, data) => productApi.update(id, data),
  onSuccess: () => emit('success'),
})

const rules: FormRules<ProductForm> = {
  name: [{ required: true, message: '请输入商品名称', trigger: 'blur' }],
  categoryId: [{ required: true, message: '请选择分类', trigger: 'change' }],
  image: [{ required: true, message: '请上传商品图片', trigger: 'change' }],
  price: [
    { required: true, message: '请输入售价', trigger: 'blur' },
    { type: 'number', min: 0.01, message: '售价必须大于 0', trigger: 'blur' },
  ],
}

const addSpec = () => form.specs.push({ name: '', price: 0 })
const removeSpec = (index: number) => form.specs.splice(index, 1)

defineExpose({ open })
</script>

<template>
  <el-drawer
    v-model="visible"
    :title="isEdit ? '编辑商品' : '新增商品'"
    size="720px"
    destroy-on-close
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
      <el-form-item label="商品名称" prop="name">
        <el-input v-model="form.name" maxlength="30" show-word-limit />
      </el-form-item>
      <el-form-item label="所属分类" prop="categoryId">
        <el-select v-model="form.categoryId" placeholder="请选择分类" style="width: 240px">
          <el-option v-for="c in categories" :key="c.id" :label="c.name" :value="c.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="商品图片" prop="image">
        <ImageUpload v-model="form.image" />
      </el-form-item>
      <el-row>
        <el-col :span="12">
          <el-form-item label="售价" prop="price">
            <el-input-number v-model="form.price" :min="0" :precision="2" :step="1" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="划线价">
            <el-input-number v-model="form.originalPrice" :min="0" :precision="2" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="打包费">
            <el-input-number v-model="form.packingFee" :min="0" :precision="2" :step="0.5" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="库存">
            <el-input-number v-model="form.stock" :min="0" :precision="0" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item label="商品规格">
        <div class="specs">
          <div v-for="(spec, index) in form.specs" :key="index" class="spec-row">
            <el-input v-model="spec.name" placeholder="规格名，如：大份" style="width: 180px" />
            <span class="text-secondary">加价</span>
            <el-input-number
              v-model="spec.price"
              :min="0"
              :precision="2"
              controls-position="right"
            />
            <el-button link type="danger" icon="Delete" @click="removeSpec(index)" />
          </div>
          <el-button icon="Plus" @click="addSpec">添加规格</el-button>
        </div>
      </el-form-item>
      <el-form-item label="上架状态">
        <el-switch v-model="form.status" :active-value="1" :inactive-value="0" active-text="上架" />
      </el-form-item>
      <el-form-item label="商品详情">
        <RichEditor v-model="form.description" height="260px" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="submit">保存</el-button>
    </template>
  </el-drawer>
</template>

<style scoped lang="scss">
.specs {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: flex-start;
}

.spec-row {
  display: flex;
  gap: 10px;
  align-items: center;
}
</style>
