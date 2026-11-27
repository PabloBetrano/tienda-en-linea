import { CsvError, parse } from 'csv-parse/browser/esm/sync'
import type { ProductImportItem } from '@/types/productImport.types'
import { productImportRowSchema } from '@/validations/productImport.schemas'

const headers = ['nombre', 'categoria_slug', 'precio', 'stock', 'activo', 'descripcion', 'imagen_url'] as const
export const PRODUCT_IMPORT_MAX_ROWS = 500
export const PRODUCT_IMPORT_MAX_BYTES = 512 * 1024

interface CsvRecord {
  record: string[]
  info: { lines: number }
}

interface ProductImportRow {
  line: number
  item: ProductImportItem
}

interface ProductImportIssue {
  line: number
  messages: string[]
}

export function parseProductCsv(text: string, categorySlugs: ReadonlySet<string>) {
  const firstLine = text.replace(/^\uFEFF/u, '').split(/\r?\n|\r/u, 1)[0] ?? ''
  const delimiter = firstLine.includes(';') ? ';' : ','
  let records: CsvRecord[]
  try {
    records = parse(text, {
      bom: true,
      delimiter,
      trim: true,
      skip_empty_lines: true,
      relax_column_count: true,
      info: true,
      max_record_size: 12000,
      to: PRODUCT_IMPORT_MAX_ROWS + 2,
    }) as unknown as CsvRecord[] // La opción `info` envuelve cada fila, aunque los tipos del lector no la distinguen.
  } catch (error) {
    const line = error instanceof CsvError && typeof error.lines === 'number' ? error.lines : null
    throw new Error(
      line ? `Formato CSV inválido cerca de la línea ${line}.` : 'El archivo CSV no tiene un formato válido.',
      { cause: error },
    )
  }

  const fileHeader = records[0]?.record
  if (fileHeader?.length !== headers.length || !headers.every((header, index) => fileHeader[index] === header)) {
    throw new Error('Las columnas no coinciden con la plantilla. Conserva los encabezados y su orden.')
  }
  if (records.length < 2) throw new Error('Agrega al menos un producto a la plantilla.')
  if (records.length > PRODUCT_IMPORT_MAX_ROWS + 1) {
    throw new Error(`El archivo admite hasta ${PRODUCT_IMPORT_MAX_ROWS} productos.`)
  }

  const rows: ProductImportRow[] = []
  const issues: ProductImportIssue[] = []
  for (const { record, info: { lines: line } } of records.slice(1)) {
    if (record.length !== headers.length) {
      issues.push({ line, messages: [`Se esperaban ${headers.length} columnas.`] })
      continue
    }
    const result = productImportRowSchema.safeParse(Object.fromEntries(
      headers.map((header, index) => [header, record[index]?.trim() ?? '']),
    ))
    if (!result.success) {
      issues.push({ line, messages: result.error.issues.map(({ message }) => message) })
      continue
    }
    if (!categorySlugs.has(result.data.categoria_slug)) {
      issues.push({ line, messages: ['La categoría no existe. Usa uno de los identificadores disponibles.'] })
      continue
    }
    rows.push({ line, item: result.data })
  }

  return { rows, issues }
}
