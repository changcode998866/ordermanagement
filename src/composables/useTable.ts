import { reactive, ref, shallowRef } from 'vue'
import { cloneDeep } from 'lodash-es'
import type { PageQuery, PageResult } from '@/types/models'

/** 列表页通用逻辑：查询条件、分页、加载状态 */
export function useTable<T, Q extends object>(
  fetcher: (query: Q & PageQuery) => Promise<PageResult<T>>,
  initialQuery: Q,
  options: { immediate?: boolean; pageSize?: number } = {},
) {
  const query = reactive(cloneDeep(initialQuery)) as Q
  const pagination = reactive({ page: 1, pageSize: options.pageSize ?? 10, total: 0 })
  const list = shallowRef<T[]>([])
  const loading = ref(false)

  async function load() {
    loading.value = true
    try {
      const res = await fetcher({ ...query, page: pagination.page, pageSize: pagination.pageSize })
      list.value = res.list
      pagination.total = res.total
      // 删除最后一页的最后一条数据后回退一页
      if (!res.list.length && pagination.page > 1) {
        pagination.page--
        await load()
      }
    } finally {
      loading.value = false
    }
  }

  function search() {
    pagination.page = 1
    return load()
  }

  function reset() {
    Object.assign(query, cloneDeep(initialQuery))
    return search()
  }

  if (options.immediate !== false) load()

  return { query, pagination, list, loading, load, search, reset }
}
