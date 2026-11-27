import type { Categoria } from '@/types/database.types'
import { downloadBlob, exportExcel, type ExportCell } from '@/utils/exporters'
import type { ProductImportReview } from '@/utils/productImport'

export async function downloadProductCatalogs(categories: Categoria[]) {
  const { default: ExcelJS } = await import('exceljs')
  const workbook = new ExcelJS.Workbook()
  const sheets = [
    {
      name: 'Categorías',
      rows: [['categoria_slug', 'Categoría'], ...categories.map(({ slug, nombre }) => [slug, nombre])],
    },
    {
      name: 'Estados',
      rows: [['Valor de activo', 'Resultado'], ['true', 'Visible en la tienda'], ['false', 'Inactivo'], ['En blanco', 'Inactivo']],
    },
  ]
  for (const { name, rows } of sheets) {
    const sheet = workbook.addWorksheet(name, { views: [{ state: 'frozen', ySplit: 1 }] })
    sheet.addRows(rows)
    sheet.getColumn(1).width = 28
    sheet.getColumn(2).width = 30
    const header = sheet.getRow(1)
    header.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF114632' } }
  }
  const buffer = await workbook.xlsx.writeBuffer()
  downloadBlob(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), 'catalogos-de-carga.xlsx')
}

export async function downloadProductImportReview(review: ProductImportReview) {
  const rows: ExportCell[][] = [
    ...review.rows.map(({ line, item }) => [
      line, 'Lista', item.nombre, item.categoria_slug, Number(item.precio), item.stock,
      item.activo ? 'Activo' : 'Inactivo', item.descripcion, item.imagen_url, '',
    ]),
    ...review.issues.map(({ line, name, category, messages }) => [
      line, 'Corregir', name, category, '', '', '', '', '', messages.join(' '),
    ]),
  ]
  rows.sort((first, second) => Number(first[0]) - Number(second[0]))
  await exportExcel('Prevalidación de productos', 'prevalidacion-productos', [
    'Fila de Excel', 'Resultado', 'Producto', 'Categoría', 'Precio (CRC)',
    'Stock', 'Estado', 'Descripción', 'Imagen', 'Detalle',
  ], rows)
}
