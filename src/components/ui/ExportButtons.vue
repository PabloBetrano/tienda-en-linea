<script setup lang="ts">
import { FileSpreadsheet, FileText, LoaderCircle } from 'lucide-vue-next'
import { ref } from 'vue'
import { useToastStore } from '@/stores/toast.store'
import { exportExcel, exportPdf, type ExportCell } from '@/utils/exporters'
import { getErrorMessage } from '@/utils/formatters'

const props = defineProps<{
  title: string
  fileName: string
  headers: string[]
  rows: ExportCell[][]
}>()
const busy = ref<'excel' | 'pdf' | null>(null)
const toast = useToastStore()

async function run(format: 'excel' | 'pdf') {
  if (!props.rows.length) {
    toast.show('No hay datos para exportar', '', 'info')
    return
  }
  busy.value = format
  try {
    if (format === 'excel') await exportExcel(props.title, props.fileName, props.headers, props.rows)
    else await exportPdf(props.title, props.fileName, props.headers, props.rows)
    toast.show('Archivo generado', `La exportación ${format === 'excel' ? 'Excel' : 'PDF'} está lista.`, 'success')
  } catch (error) {
    toast.show('No se pudo exportar', getErrorMessage(error), 'error')
  } finally {
    busy.value = null
  }
}
</script>

<template>
  <div class="flex flex-wrap gap-2">
    <button class="btn-secondary min-h-10 px-3 text-sm" :disabled="Boolean(busy)" @click="run('excel')">
      <LoaderCircle v-if="busy === 'excel'" class="size-4 animate-spin" />
      <FileSpreadsheet v-else class="size-4 text-emerald-700" />
      Excel
    </button>
    <button class="btn-secondary min-h-10 px-3 text-sm" :disabled="Boolean(busy)" @click="run('pdf')">
      <LoaderCircle v-if="busy === 'pdf'" class="size-4 animate-spin" />
      <FileText v-else class="size-4 text-red-600" />
      PDF
    </button>
  </div>
</template>
