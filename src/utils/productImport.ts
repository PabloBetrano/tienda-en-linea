import { Unzip, UnzipInflate, zipSync } from 'fflate'
import type { CellValue, Row } from 'exceljs'
import type { ProductImportItem } from '@/types/productImport.types'
import { productImportCategorySlugPattern, productImportRowSchema } from '@/validations/productImport.schemas'

const headers = ['nombre', 'categoria_slug', 'precio', 'stock', 'activo', 'descripcion', 'imagen_url'] as const
export const PRODUCT_IMPORT_MAX_ROWS = 500
export const PRODUCT_IMPORT_MAX_BYTES = 512 * 1024
const MAX_EXPANDED_BYTES = 8 * 1024 * 1024
const MAX_ARCHIVE_ENTRIES = 48

export interface ProductImportReview {
  rows: { line: number; item: ProductImportItem }[]
  issues: { line: number; name: string; category: string; messages: string[] }[]
}

function checkWorksheetXml(xml: string) {
  const cells = xml.matchAll(/<(?:\w+:)?(?:row|c)\b[^>]*\br\s*=\s*["']([^"']+)["']/g)
  for (const [, address] of cells) {
    if (!/^(?:[A-Z]{1,2})?[1-9][0-9]{0,2}$/.test(address ?? '')) {
      throw new Error('La hoja contiene celdas fuera del rango admitido.')
    }
    const row = Number(address?.replace(/^[A-Z]+/, ''))
    if (row > PRODUCT_IMPORT_MAX_ROWS + 1) {
      throw new Error(`Usa las filas 2 a ${PRODUCT_IMPORT_MAX_ROWS + 1} de la plantilla.`)
    }
  }
}

function sanitizeArchive(bytes: ArrayBuffer) {
  if (bytes.byteLength > PRODUCT_IMPORT_MAX_BYTES) throw new Error('El archivo supera 512 KiB.')
  const input = new Uint8Array(bytes)
  if (input[0] !== 0x50 || input[1] !== 0x4b || input[2] !== 3 || input[3] !== 4) {
    throw new Error('El archivo no es un libro Excel .xlsx válido.')
  }
  const entries: Record<string, Uint8Array> = Object.create(null)
  const seen = new Set<string>()
  const decoder = new globalThis.TextDecoder('utf-8', { fatal: true })
  let expandedBytes = 0
  const unzip = new Unzip((file) => {
    const name = file.name
    const validName = name === '[Content_Types].xml' || /^[a-zA-Z0-9_./-]+$/.test(name)
    if (seen.size >= MAX_ARCHIVE_ENTRIES || (file.originalSize ?? 0) > MAX_EXPANDED_BYTES) {
      throw new Error('El libro excede el tamaño o la cantidad de archivos internos permitidos.')
    }
    if (
      seen.has(name) || !validName || name.startsWith('/')
      || name.split('/').some((part) => part === '.' || part === '..')
      || /^xl\/externalLinks\//i.test(name) || !/(?:\.xml|\.rels|\/)$/i.test(name)
    ) {
      throw new Error('Usa la plantilla sin macros, vínculos a otros libros ni archivos adjuntos.')
    }
    seen.add(name)
    const chunks: Uint8Array[] = []
    let length = 0
    file.ondata = (error, chunk, final) => {
      expandedBytes += chunk?.length ?? 0
      if (expandedBytes > MAX_EXPANDED_BYTES) throw new Error('El contenido del libro excede 8 MiB.')
      if (error) throw new Error('No se pudo abrir el archivo Excel.', { cause: error })
      chunks.push(chunk)
      length += chunk.length
      if (!final) return
      const entry = new Uint8Array(length)
      let offset = 0
      for (const part of chunks) {
        entry.set(part, offset)
        offset += part.length
      }
      entries[name] = entry
    }
    file.start()
  })
  unzip.register(UnzipInflate)
  // La entrada se procesa por bloques pequeños para limitar cada descompresión.
  for (let offset = 0; offset < input.length; offset += 2048) {
    unzip.push(input.subarray(offset, offset + 2048), offset + 2048 >= input.length)
  }
  const sheets = Object.keys(entries).filter((name) => /^xl\/worksheets\/sheet[0-9]+\.xml$/i.test(name))
  for (const [name, entry] of Object.entries(entries)) {
    const xml = decoder.decode(entry)
    if (/<!DOCTYPE|<!ENTITY/i.test(xml)) throw new Error('El libro contiene elementos XML no permitidos.')
    if (sheets.includes(name)) checkWorksheetXml(xml)
  }
  if (Object.keys(entries).length !== seen.size || !entries['xl/workbook.xml'] || sheets.length !== 1) {
    throw new Error('Usa un archivo .xlsx con una sola hoja llamada Productos.')
  }
  // ExcelJS solo recibe los archivos ya verificados y sin compresión.
  return zipSync(entries, { level: 0 }).buffer
}

function readCell(value: CellValue, field: (typeof headers)[number]): string | null {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string') return value.includes('\0') ? null : value.trim()
  if (typeof value === 'number' && (field === 'precio' || field === 'stock')) return String(value)
  if (typeof value === 'boolean' && field === 'activo') return String(value)
  if (field === 'imagen_url' && typeof value === 'object' && 'hyperlink' in value && value.text === value.hyperlink) {
    return value.hyperlink.trim()
  }
  return null
}

function hasExtraCells(row: Row) {
  let extra = false
  row.eachCell((_, column) => { if (column > headers.length) extra = true })
  return extra
}

export async function parseProductWorkbook(bytes: ArrayBuffer, categorySlugs: ReadonlySet<string>): Promise<ProductImportReview> {
  const archive = sanitizeArchive(bytes)
  const { default: ExcelJS } = await import('exceljs')
  const workbook = new ExcelJS.Workbook()
  try {
    await workbook.xlsx.load(archive, {
      ignoreNodes: ['cols', 'dimension', 'mergeCells', 'dataValidations', 'sheetViews', 'drawing', 'tableParts'],
    })
  } catch (error) {
    throw new Error('No se pudo leer el libro de Excel. Vuelve a descargar la plantilla.', { cause: error })
  }
  const sheet = workbook.getWorksheet('Productos')
  if (!sheet || workbook.worksheets.length !== 1) throw new Error('Conserva solo la hoja Productos.')

  const header = sheet.getRow(1)
  if (!headers.every((field, index) => header.getCell(index + 1).value === field) || hasExtraCells(header)) {
    throw new Error('Los encabezados no coinciden con la plantilla. Conserva las columnas y el orden.')
  }
  if (sheet.rowCount > PRODUCT_IMPORT_MAX_ROWS + 1) {
    throw new Error(`El libro admite hasta ${PRODUCT_IMPORT_MAX_ROWS} filas de carga.`)
  }

  const review: ProductImportReview = { rows: [], issues: [] }
  sheet.eachRow((row, line) => {
    if (line === 1) return
    const messages = hasExtraCells(row) ? ['La fila contiene columnas fuera de la plantilla.'] : []
    const invalidFields = new Set<string>()
    const values = Object.fromEntries(headers.map((field, index) => {
      const value = readCell(row.getCell(index + 1).value, field)
      if (value === null) {
        invalidFields.add(field)
        messages.push(`${field}: usa un valor directo del tipo indicado, sin fórmulas.`)
      }
      return [field, value ?? '']
    }))
    if (!messages.length && Object.values(values).every((value) => !value)) return
    const result = productImportRowSchema.safeParse(values)
    if (!result.success) {
      messages.push(...result.error.issues
        .filter(({ path }) => !invalidFields.has(String(path[0])))
        .map(({ message }) => message))
    }
    const category = values.categoria_slug ?? ''
    if (productImportCategorySlugPattern.test(category) && !categorySlugs.has(category)) {
      messages.push('La categoría no existe. Usa un identificador del catálogo de carga.')
    }
    if (messages.length) review.issues.push({ line, name: (values.nombre ?? '').slice(0, 150), category: category.slice(0, 150), messages })
    else if (result.success) review.rows.push({ line, item: result.data })
  })
  if (!review.rows.length && !review.issues.length) throw new Error('Agrega al menos un producto a la plantilla.')
  return review
}
