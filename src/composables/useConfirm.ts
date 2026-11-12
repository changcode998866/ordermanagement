import { ElMessage, ElMessageBox } from 'element-plus'

/** 二次确认后执行操作，取消时静默 */
export async function confirmAction(
  message: string,
  action: () => Promise<unknown>,
  successText = '操作成功',
) {
  try {
    await ElMessageBox.confirm(message, '提示', { type: 'warning' })
  } catch {
    return false
  }
  await action()
  ElMessage.success(successText)
  return true
}
