export type ExportCell = string | number | boolean | null | undefined

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

function safeFileName(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
}

export async function exportExcel(
  title: string,
  fileName: string,
  headers: string[],
  rows: ExportCell[][],
) {
  const { default: ExcelJS } = await import('exceljs')
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Tienda'
  workbook.created = new Date()
  const sheet = workbook.addWorksheet(title.slice(0, 31), {
    views: [{ state: 'frozen', ySplit: 3 }],
  })

  sheet.mergeCells(1, 1, 1, Math.max(headers.length, 1))
  const titleCell = sheet.getCell(1, 1)
  titleCell.value = title
  titleCell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 16 }
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF16221C' } }
  titleCell.alignment = { vertical: 'middle' }
  sheet.getRow(1).height = 30

  sheet.mergeCells(2, 1, 2, Math.max(headers.length, 1))
  sheet.getCell(2, 1).value = `Exportado: ${new Intl.DateTimeFormat('es-CR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date())}`
  sheet.getCell(2, 1).font = { italic: true, color: { argb: 'FF64748B' }, size: 10 }

  const headerRow = sheet.getRow(3)
  headerRow.values = headers
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0D8A57' } }
  headerRow.alignment = { vertical: 'middle' }
  headerRow.height = 24

  rows.forEach((row) => sheet.addRow(row.map((value) => value ?? '')))
  sheet.columns.forEach((column, index) => {
    const values = [headers[index] ?? '', ...rows.map((row) => String(row[index] ?? ''))]
    column.width = Math.min(42, Math.max(12, ...values.map((value) => value.length + 2)))
  })
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber > 3 && rowNumber % 2 === 0) {
      row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } }
    }
    row.alignment = { vertical: 'middle' }
  })
  sheet.autoFilter = { from: { row: 3, column: 1 }, to: { row: 3, column: headers.length } }

  const buffer = await workbook.xlsx.writeBuffer()
  downloadBlob(
    new Blob([buffer as BlobPart], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
    `${safeFileName(fileName)}.xlsx`,
  )
}

export async function exportPdf(
  title: string,
  fileName: string,
  headers: string[],
  rows: ExportCell[][],
) {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ])
  const landscape = headers.length > 5
  const doc = new jsPDF({ orientation: landscape ? 'landscape' : 'portrait', unit: 'mm' })
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(22, 34, 28)
  doc.text(title, 14, 18)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(100, 116, 139)
  doc.text(`Exportado: ${new Intl.DateTimeFormat('es-CR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date())}`, 14, 25)

  autoTable(doc, {
    startY: 31,
    head: [headers],
    body: rows.map((row) => row.map((value) => String(value ?? ''))),
    theme: 'striped',
    styles: { font: 'helvetica', fontSize: 8, cellPadding: 2.5, overflow: 'linebreak' },
    headStyles: { fillColor: [13, 138, 87], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [241, 245, 249] },
    margin: { top: 31, right: 10, bottom: 14, left: 10 },
    didDrawPage: (data) => {
      const pageCount = doc.getNumberOfPages()
      doc.setFontSize(8)
      doc.setTextColor(100, 116, 139)
      doc.text(
        `Página ${pageCount}`,
        data.settings.margin.left,
        doc.internal.pageSize.height - 7,
      )
    },
  })
  doc.save(`${safeFileName(fileName)}.pdf`)
}
