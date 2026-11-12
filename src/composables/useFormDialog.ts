import { computed, nextTick, reactive, ref } from 'vue'
import { cloneDeep, pick } from 'lodash-es'
import { ElMessage, type FormInstance } from 'element-plus'

/** 新增/编辑弹窗通用逻辑 */
export function useFormDialog<T extends object>(options: {
  defaults: () => T
  create: (data: T) => Promise<unknown>
  update: (id: number, data: T) => Promise<unknown>
  onSuccess?: () => void
}) {
  const visible = ref(false)
  const submitting = ref(false)
  const editingId = ref<number | null>(null)
  const formRef = ref<FormInstance>()
  const form = reactive(options.defaults()) as T
  const isEdit = computed(() => editingId.value !== null)

  async function open(row?: Partial<T> & { id: number }) {
    const defaults = options.defaults()
    editingId.value = row?.id ?? null
    Object.assign(form, defaults, row ? cloneDeep(pick(row, Object.keys(defaults))) : {})
    visible.value = true
    await nextTick()
    formRef.value?.clearValidate()
  }

  async function submit() {
    await formRef.value?.validate()
    submitting.value = true
    try {
      const data = cloneDeep(form) as T
      if (editingId.value !== null) await options.update(editingId.value, data)
      else await options.create(data)
      ElMessage.success(isEdit.value ? '保存成功' : '新增成功')
      visible.value = false
      options.onSuccess?.()
    } finally {
      submitting.value = false
    }
  }

  return { visible, submitting, formRef, form, isEdit, open, submit }
}
