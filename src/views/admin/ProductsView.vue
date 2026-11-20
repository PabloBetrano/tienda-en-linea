<script setup lang="ts">
import { Image, Pencil, Plus, Search, Trash2, Upload, X } from 'lucide-vue-next'
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import ExportButtons from '@/components/ui/ExportButtons.vue'
import ModalDialog from '@/components/ui/ModalDialog.vue'
import { catalogService } from '@/services/catalog.service'
import { productImagesService } from '@/services/productImages.service'
import { useToastStore } from '@/stores/toast.store'
import type { Categoria, Producto } from '@/types/database.types'
import { formatCurrency, formatDate, getErrorMessage } from '@/utils/formatters'
import { productImageSchema, productSchema } from '@/validations/catalog.schemas'

const products = ref<Producto[]>([])
const categories = ref<Categoria[]>([])
const search = ref('')
const modal = ref(false)
const editing = ref<Producto | null>(null)
const busy = ref(false)
const selectedImage = ref<globalThis.File | null>(null)
const localPreviewUrl = ref('')
const removeCurrentImage = ref(false)
const fileInput = ref<globalThis.HTMLInputElement | null>(null)
const toast = useToastStore()
const errors = ref<Record<string, string>>({})
const form = reactive({ nombre: '', descripcion: '', categoria_id: 0, precio: 0, stock: 0, imagen_url: '', activo: true })

const filtered = computed(() => products.value.filter((product) => product.nombre.toLowerCase().includes(search.value.toLowerCase())))
const exportRows = computed(() => filtered.value.map((product) => [product.id, product.nombre, product.categorias?.nombre ?? '', Number(product.precio), product.stock, product.activo ? 'Activo' : 'Inactivo', formatDate(product.creado_en)]))
const imagePreview = computed(() => localPreviewUrl.value || (!removeCurrentImage.value ? form.imagen_url : ''))

async function load() {
  [products.value, categories.value] = await Promise.all([catalogService.listProducts(), catalogService.listCategories()])
}

function releasePreview() {
  if (localPreviewUrl.value) globalThis.URL.revokeObjectURL(localPreviewUrl.value)
  localPreviewUrl.value = ''
}

function resetImageSelection() {
  releasePreview()
  selectedImage.value = null
  removeCurrentImage.value = false
  if (fileInput.value) fileInput.value.value = ''
}

function open(product?: Producto) {
  resetImageSelection()
  editing.value = product ?? null
  Object.assign(form, {
    nombre: product?.nombre ?? '',
    descripcion: product?.descripcion ?? '',
    categoria_id: product?.categoria_id ?? categories.value[0]?.id ?? 0,
    precio: Number(product?.precio ?? 0),
    stock: product?.stock ?? 0,
    imagen_url: product?.imagen_url ?? '',
    activo: product?.activo ?? true,
  })
  errors.value = {}
  modal.value = true
}

function close() {
  if (busy.value) return
  modal.value = false
  resetImageSelection()
}

function selectImage(event: Event) {
  const input = event.target as globalThis.HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  const result = productImageSchema.safeParse(file)
  if (!result.success) {
    errors.value.imagen = result.error.issues[0]?.message ?? 'Seleccione una imagen válida'
    input.value = ''
    return
  }

  releasePreview()
  selectedImage.value = result.data
  localPreviewUrl.value = globalThis.URL.createObjectURL(result.data)
  removeCurrentImage.value = false
  delete errors.value.imagen
}

function clearImage() {
  releasePreview()
  selectedImage.value = null
  removeCurrentImage.value = true
  if (fileInput.value) fileInput.value.value = ''
}

async function save() {
  const result = productSchema.safeParse({
    ...form,
    descripcion: form.descripcion || null,
    imagen_url: removeCurrentImage.value ? null : form.imagen_url || null,
  })
  if (!result.success) {
    errors.value = Object.fromEntries(result.error.issues.map((issue) => [String(issue.path[0]), issue.message]))
    return
  }

  busy.value = true
  let uploadedPath: string | null = null
  const previousImageUrl = editing.value?.imagen_url
  try {
    let imageUrl = result.data.imagen_url
    if (selectedImage.value) {
      const uploaded = await productImagesService.upload(selectedImage.value)
      uploadedPath = uploaded.path
      imageUrl = uploaded.publicUrl
    }

    await catalogService.saveProduct({ ...result.data, imagen_url: imageUrl }, editing.value?.id)

    if (previousImageUrl && previousImageUrl !== imageUrl) {
      try {
        await productImagesService.removeByPublicUrl(previousImageUrl)
      } catch (cleanupError) {
        globalThis.console.warn('No se pudo eliminar la imagen anterior del producto', cleanupError)
      }
    }

    toast.show('Producto guardado', selectedImage.value ? 'La imagen se almacenó en Supabase Storage.' : '', 'success')
    modal.value = false
    resetImageSelection()
    await load()
  } catch (error) {
    if (uploadedPath) {
      try {
        await productImagesService.removeByPath(uploadedPath)
      } catch (cleanupError) {
        globalThis.console.warn('No se pudo revertir la imagen cargada', cleanupError)
      }
    }
    toast.show('No se pudo guardar', getErrorMessage(error), 'error')
  } finally {
    busy.value = false
  }
}

async function remove(product: Producto) {
  if (!window.confirm(`¿Eliminar “${product.nombre}”?`)) return
  try {
    await catalogService.deleteProduct(product.id)
    try {
      await productImagesService.removeByPublicUrl(product.imagen_url)
    } catch (cleanupError) {
      globalThis.console.warn('No se pudo eliminar la imagen asociada', cleanupError)
      toast.show('Producto eliminado', 'La imagen no pudo eliminarse de Storage.', 'info')
    }
    await load()
  } catch (error) {
    toast.show('No se pudo eliminar', getErrorMessage(error), 'error')
  }
}

onMounted(() => load().catch((error) => toast.show('Error', getErrorMessage(error), 'error')))
onBeforeUnmount(releasePreview)
</script>

<template>
  <div>
    <div class="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
      <div><h2 class="page-title">Productos</h2><p class="page-copy">Controla catálogo, imágenes, precios e inventario.</p></div>
      <div class="flex flex-wrap gap-2"><ExportButtons title="Productos" file-name="productos" :headers="['ID', 'Producto', 'Categoría', 'Precio (CRC)', 'Stock', 'Estado', 'Creado']" :rows="exportRows" /><button class="btn-primary" @click="open()"><Plus class="size-4" />Nuevo producto</button></div>
    </div>

    <label class="relative mt-7 block max-w-md"><Search class="absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-slate-400" /><input v-model="search" class="field pl-11" placeholder="Buscar producto..." /></label>
    <EmptyState v-if="!filtered.length" class="mt-7" title="No hay productos" message="Agrega productos para comenzar a vender." />
    <div v-else class="table-wrap mt-7">
      <table class="data-table"><thead><tr><th>Producto</th><th>Categoría</th><th>Precio</th><th>Stock</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>
        <tr v-for="product in filtered" :key="product.id">
          <td><div class="flex items-center gap-3"><div class="grid size-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-slate-100 text-slate-400"><img v-if="product.imagen_url" :src="product.imagen_url" :alt="product.nombre" class="size-full object-cover" /><Image v-else class="size-5" /></div><span class="font-semibold text-ink">{{ product.nombre }}</span></div></td>
          <td>{{ product.categorias?.nombre }}</td><td class="font-semibold">{{ formatCurrency(product.precio) }}</td><td><span :class="product.stock <= 5 ? 'font-bold text-amber-700' : ''">{{ product.stock }}</span></td><td><span class="rounded-full px-2.5 py-1 text-sm font-semibold" :class="product.activo ? 'bg-brand-100 text-brand-700' : 'bg-slate-100 text-slate-500'">{{ product.activo ? 'Activo' : 'Inactivo' }}</span></td>
          <td><div class="flex gap-1"><button class="rounded-lg p-2 hover:bg-slate-100" aria-label="Editar" @click="open(product)"><Pencil class="size-4" /></button><button class="rounded-lg p-2 hover:bg-red-50 hover:text-red-600" aria-label="Eliminar" @click="remove(product)"><Trash2 class="size-4" /></button></div></td>
        </tr>
      </tbody></table>
    </div>

    <ModalDialog :open="modal" :title="editing ? 'Editar producto' : 'Nuevo producto'" wide @close="close">
      <form class="grid gap-4 sm:grid-cols-2" @submit.prevent="save">
        <div class="sm:col-span-2"><label class="label">Nombre</label><input v-model="form.nombre" class="field" /><p v-if="errors.nombre" class="mt-1 text-sm text-red-600">{{ errors.nombre }}</p></div>
        <div><label class="label">Categoría</label><select v-model="form.categoria_id" class="field"><option v-for="category in categories" :key="category.id" :value="category.id">{{ category.nombre }}</option></select><p v-if="errors.categoria_id" class="mt-1 text-sm text-red-600">{{ errors.categoria_id }}</p></div>
        <div><label class="label">Precio (₡)</label><input v-model.number="form.precio" class="field" type="number" min="0" step="0.01" /><p v-if="errors.precio" class="mt-1 text-sm text-red-600">{{ errors.precio }}</p></div>
        <div><label class="label">Inventario</label><input v-model.number="form.stock" class="field" type="number" min="0" /><p v-if="errors.stock" class="mt-1 text-sm text-red-600">{{ errors.stock }}</p></div>
        <label class="flex items-center gap-3 self-end pb-2"><input v-model="form.activo" type="checkbox" class="size-5 accent-brand-600" />Producto visible en la tienda</label>

        <div class="sm:col-span-2">
          <label class="label">Imagen del producto</label>
          <div class="grid gap-4 rounded-3xl border border-dashed border-brand-700/25 bg-brand-50/40 p-4 sm:grid-cols-[180px_1fr]">
            <div class="relative aspect-[4/5] overflow-hidden rounded-2xl bg-white shadow-sm">
              <img v-if="imagePreview" :src="imagePreview" alt="Vista previa del producto" class="size-full object-cover" />
              <div v-else class="grid size-full place-items-center text-center text-slate-400"><div><Image class="mx-auto size-8" /><p class="mt-2 text-sm">Sin imagen</p></div></div>
              <button v-if="imagePreview" type="button" class="absolute top-2 right-2 grid size-9 place-items-center rounded-full bg-white/90 text-slate-700 shadow backdrop-blur" aria-label="Quitar imagen" @click="clearImage"><X class="size-4" /></button>
            </div>
            <div class="flex flex-col justify-center">
              <Upload class="size-7 text-brand-700" />
              <p class="mt-3 font-semibold text-ink">Selecciona una imagen desde tu computadora</p>
              <p class="mt-1 text-sm leading-6 text-slate-500">JPEG, PNG, WebP o AVIF. Tamaño máximo: 5 MB. Se almacenará en Supabase Storage.</p>
              <label class="btn-secondary mt-4 w-fit cursor-pointer"><Upload class="size-4" />{{ imagePreview ? 'Cambiar imagen' : 'Elegir imagen' }}<input ref="fileInput" class="sr-only" type="file" accept="image/jpeg,image/png,image/webp,image/avif" @change="selectImage" /></label>
              <p v-if="selectedImage" class="mt-3 truncate text-sm font-medium text-brand-700">{{ selectedImage.name }}</p>
              <p v-if="errors.imagen" class="mt-2 text-sm text-red-600">{{ errors.imagen }}</p>
            </div>
          </div>
        </div>

        <div class="sm:col-span-2"><label class="label">Descripción</label><textarea v-model="form.descripcion" class="field min-h-24"></textarea></div>
        <div class="flex justify-end gap-3 pt-2 sm:col-span-2"><button type="button" class="btn-secondary" :disabled="busy" @click="close">Cancelar</button><button class="btn-primary" :disabled="busy">{{ busy ? 'Guardando...' : 'Guardar producto' }}</button></div>
      </form>
    </ModalDialog>
  </div>
</template>
