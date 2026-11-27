<script setup lang="ts">
import { Download } from 'lucide-vue-next'
import { ref } from 'vue'
import ModalDialog from '@/components/ui/ModalDialog.vue'
import type { Categoria } from '@/types/database.types'
import type { ProductImportRequest } from '@/types/productImport.types'
import { parseProductWorkbook, PRODUCT_IMPORT_MAX_BYTES, PRODUCT_IMPORT_MAX_ROWS, type ProductImportReview } from '@/utils/productImport'
import { downloadProductCatalogs, downloadProductImportReview } from '@/utils/productImportDownloads'
import { getErrorMessage } from '@/utils/formatters'

const props = defineProps<{
  open: boolean
  categories: Categoria[]
  loadCategories: () => Promise<Categoria[]>
  confirmImport: (request: ProductImportRequest) => Promise<void>
}>()
const emit = defineEmits<{ close: [] }>()

const review = ref<ProductImportReview | null>(null)
const request = ref<ProductImportRequest | null>(null)
const fileName = ref('')
const message = ref('')
const reading = ref(false)
const importing = ref(false)
const downloading = ref(false)

function clearReview() {
  review.value = null
  request.value = null
  fileName.value = ''
  message.value = ''
}

function close() {
  if (!reading.value && !importing.value) emit('close')
}

async function selectFile(event: Event) {
  const input = event.currentTarget
  if (!(input instanceof globalThis.HTMLInputElement)) return
  const file = input.files?.[0]
  if (!file) return
  input.value = ''
  const previousRequest = request.value
  clearReview()
  fileName.value = file.name
  if (!file.name.toLowerCase().endsWith('.xlsx') || file.size > PRODUCT_IMPORT_MAX_BYTES) {
    message.value = 'Selecciona un archivo .xlsx de hasta 512 KiB.'
    return
  }

  reading.value = true
  try {
    const [bytes, categories] = await Promise.all([file.arrayBuffer(), props.loadCategories()])
    const result = await parseProductWorkbook(bytes, new Set(categories.map(({ slug }) => slug)))
    review.value = result
    if (!result.issues.length) {
      const items = result.rows.map(({ item }) => item)
      request.value = previousRequest && JSON.stringify(previousRequest.items) === JSON.stringify(items)
        ? previousRequest
        : { requestId: globalThis.crypto.randomUUID(), items }
    }
  } catch (error) {
    message.value = getErrorMessage(error)
  } finally {
    reading.value = false
  }
}

async function exportWorkbook(kind: 'catalogs' | 'review') {
  if (downloading.value) return
  downloading.value = true
  message.value = ''
  try {
    if (kind === 'catalogs') await downloadProductCatalogs(await props.loadCategories())
    else if (review.value) await downloadProductImportReview(review.value)
  } catch {
    message.value = 'No se pudo descargar el archivo Excel. Intenta de nuevo.'
  } finally {
    downloading.value = false
  }
}

async function confirm() {
  if (!request.value || importing.value) return
  importing.value = true
  message.value = ''
  try {
    await props.confirmImport(request.value)
    clearReview()
    emit('close')
  } catch (error) {
    message.value = getErrorMessage(error)
  } finally {
    importing.value = false
  }
}
</script>

<template>
  <ModalDialog :open="open" title="Importar productos" wide @close="close">
    <p class="text-sm text-slate-600">
      Descarga la plantilla, completa los productos y sube el archivo Excel para revisarlos.
      Puedes importar hasta {{ PRODUCT_IMPORT_MAX_ROWS }} productos. Cada fila crea un producto nuevo.
    </p>
    <div class="mt-4 flex flex-wrap items-center gap-3">
      <a href="/plantillas/importar-productos.xlsx" download class="btn-secondary">
        <Download class="size-4" />Plantilla Excel
      </a>
      <a href="/plantillas/instrucciones-importar-productos.txt" download class="btn-secondary">
        <Download class="size-4" />Instrucciones
      </a>
      <button type="button" class="btn-secondary" :disabled="downloading || reading || importing" @click="exportWorkbook('catalogs')">
        <Download class="size-4" />Catálogos de carga
      </button>
      <label class="btn-secondary cursor-pointer">
        Elegir archivo Excel
        <input
          type="file"
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          class="sr-only"
          :disabled="reading || importing"
          @change="selectFile"
        />
      </label>
    </div>
    <p class="mt-3 text-sm text-slate-600">
      Usa precios en colones sin separadores de miles. Deja el inventario vacío para usar 0.
      Escribe <code>true</code> en activo para publicar el producto o déjalo en blanco para crearlo inactivo.
      La descripción y el enlace HTTPS de la imagen son opcionales.
    </p>
    <details class="mt-3 rounded-xl bg-slate-50 p-3 text-sm">
      <summary class="cursor-pointer font-semibold">Identificadores de categorías</summary>
      <ul v-if="categories.length" class="mt-2 max-h-36 space-y-1 overflow-auto">
        <li v-for="category in categories" :key="category.id">
          {{ category.nombre }} (<code>{{ category.slug }}</code>)
        </li>
      </ul>
      <p v-else class="mt-2 text-slate-600">Crea una categoría antes de importar.</p>
    </details>
    <div class="mt-4 space-y-3">
      <p v-if="fileName" class="break-all text-sm font-medium">{{ fileName }}</p>
      <p v-if="reading" role="status" class="text-sm text-slate-600">Revisando el archivo…</p>
      <p v-if="message" role="alert" class="text-sm text-red-700">{{ message }}</p>
      <template v-if="review">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <h3 class="font-semibold text-ink">Detalle de prevalidación</h3>
          <button type="button" class="btn-secondary" :disabled="downloading || importing || reading" @click="exportWorkbook('review')">
            <Download class="size-4" />Descargar detalle Excel
          </button>
        </div>
        <p class="text-sm text-slate-600">La revisión no guarda productos. Corrige las filas marcadas antes de confirmar.</p>
        <p role="status" class="text-sm font-medium">
          {{ review.rows.length }} filas listas · {{ review.issues.length }} filas con errores
        </p>
        <ul v-if="review.issues.length" class="max-h-40 space-y-2 overflow-auto rounded-xl bg-red-50 p-3 text-sm text-red-800">
          <li v-for="issue in review.issues" :key="issue.line">
            <strong>Fila {{ issue.line }}<template v-if="issue.name"> · {{ issue.name }}</template></strong>
            {{ issue.messages.join(' ') }}
          </li>
        </ul>
        <div v-if="review.rows.length" class="table-wrap max-h-56 overflow-auto">
          <table class="data-table">
            <caption class="sr-only">Vista previa del lote</caption>
            <thead><tr><th>Fila de Excel</th><th>Producto</th><th>Categoría</th><th>Precio (CRC)</th><th>Stock</th><th>Estado</th><th>Descripción</th><th>Imagen</th></tr></thead>
            <tbody>
              <tr v-for="{ line, item } in review.rows" :key="line">
                <td>{{ line }}</td>
                <td class="break-words">{{ item.nombre }}</td>
                <td>{{ item.categoria_slug }}</td>
                <td>{{ item.precio }}</td>
                <td>{{ item.stock }}</td>
                <td>{{ item.activo ? 'Activo' : 'Inactivo' }}</td>
                <td><span class="block max-w-60 truncate" :title="item.descripcion ?? undefined">{{ item.descripcion || '—' }}</span></td>
                <td><span class="block max-w-52 truncate" :title="item.imagen_url ?? undefined">{{ item.imagen_url || '—' }}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </div>
    <div class="mt-5 flex flex-wrap justify-end gap-3">
      <button type="button" class="btn-secondary" :disabled="reading || importing" @click="close">Cerrar</button>
      <button type="button" class="btn-primary" :disabled="!request || reading || importing" @click="confirm">
        {{ importing ? 'Importando…' : 'Confirmar importación' }}
      </button>
    </div>
  </ModalDialog>
</template>
