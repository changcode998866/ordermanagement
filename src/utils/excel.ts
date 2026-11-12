export interface ExcelColumn<T> {
  label: string
  value: (row: T) => string | number
}

/** xlsx 体积较大，按需动态加载 */
export async function exportExcel<T>(rows: T[], columns: ExcelColumn<T>[], filename: string) {
  const XLSX = await import('xlsx')
  const data = rows.map((row) =>
    Object.fromEntries(columns.map((col) => [col.label, col.value(row)])),
  )
  const sheet = XLSX.utils.json_to_sheet(data, { header: columns.map((c) => c.label) })
  sheet['!cols'] = columns.map(() => ({ wch: 18 }))
  const book = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(book, sheet, 'Sheet1')
  XLSX.writeFile(book, `${filename}.xlsx`)
}
