<script setup lang="ts">
import { Search, ShoppingBag } from 'lucide-vue-next'
import { computed, onMounted, ref } from 'vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import ExportButtons from '@/components/ui/ExportButtons.vue'
import { catalogService } from '@/services/catalog.service'
import { useCartStore } from '@/stores/cart.store'
import { useToastStore } from '@/stores/toast.store'
import type { Categoria, Producto } from '@/types/database.types'
import { formatCurrency, getErrorMessage } from '@/utils/formatters'

const products = ref<Producto[]>([])
const categories = ref<Categoria[]>([])
const loading = ref(true)
const search = ref('')
const category = ref(0)
const cart = useCartStore()
const toast = useToastStore()

const filtered = computed(() => products.value.filter((product) =>
  (!category.value || product.categoria_id === category.value)
  && product.nombre.toLowerCase().includes(search.value.toLowerCase()),
))
const exportRows = computed(() => filtered.value.map((product) => [product.id, product.nombre, product.categorias?.nombre ?? '', product.descripcion ?? '', Number(product.precio), product.stock]))

function add(product: Producto) {
  cart.add(product)
  toast.show('Agregado a la bolsa', product.nombre, 'success')
}

onMounted(async () => {
  try {
    [products.value, categories.value] = await Promise.all([catalogService.listProducts(false), catalogService.listCategories()])
  } catch (error) {
    toast.show('No se pudo cargar el catálogo', getErrorMessage(error), 'error')
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <main class="min-h-screen bg-[#f9f9fb]">
    <section class="border-b border-brand-700/8 bg-[#f3f3f5]">
      <div class="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-12 lg:py-16">
        <div class="grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-end">
          <div>
            <p class="text-sm font-semibold tracking-[0.16em] text-brand-600">PRÊT-À-PORTER · COLECCIÓN 2026</p>
            <h1 class="mt-3 text-4xl font-semibold tracking-[-0.03em] text-ink sm:text-5xl lg:text-6xl">Catálogo Arquitectónico</h1>
          </div>
          <p class="max-w-xl text-base leading-7 text-slate-600">Prendas seleccionadas con líneas limpias, materiales nobles y la elegancia serena de los tonos botánicos y neutros minerales.</p>
        </div>
      </div>
    </section>

    <section class="sticky top-16 z-20 border-b border-brand-700/8 bg-[#f9f9fb]/90 backdrop-blur-xl">
      <div class="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-12">
        <div class="flex gap-2 overflow-x-auto pb-2" aria-label="Categorías">
          <button class="shrink-0 rounded-full px-5 py-2 text-sm font-medium transition" :class="category === 0 ? 'bg-brand-700 text-white' : 'bg-white text-slate-600 hover:bg-brand-700/6'" @click="category = 0">Todo</button>
          <button v-for="item in categories" :key="item.id" class="shrink-0 rounded-full px-5 py-2 text-sm font-medium transition" :class="category === item.id ? 'bg-brand-700 text-white' : 'bg-white text-slate-600 hover:bg-brand-700/6'" @click="category = item.id">{{ item.nombre }}</button>
        </div>
        <div class="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label class="relative w-full sm:max-w-sm"><span class="sr-only">Buscar productos</span><Search class="absolute top-1/2 left-4 size-4 -translate-y-1/2 text-slate-400" /><input v-model="search" class="field pl-11" placeholder="Buscar en la colección" /></label>
          <div class="flex items-center justify-between gap-4"><p class="text-sm text-slate-500"><strong class="font-semibold text-ink">{{ filtered.length }}</strong> piezas disponibles</p><ExportButtons title="Catálogo de productos" file-name="catalogo-productos" :headers="['ID', 'Producto', 'Categoría', 'Descripción', 'Precio (CRC)', 'Stock']" :rows="exportRows" /></div>
        </div>
      </div>
    </section>

    <section class="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-12 lg:py-14">
      <div v-if="loading" class="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        <div v-for="number in 6" :key="number" class="animate-pulse"><div class="aspect-[3/4] rounded-[2rem] bg-[#eeeef0]"></div><div class="mt-5 h-5 rounded bg-[#eeeef0]"></div><div class="mt-2 h-4 w-1/2 rounded bg-[#eeeef0]"></div></div>
      </div>
      <EmptyState v-else-if="!filtered.length" title="No encontramos piezas" message="Prueba con otro término o selecciona otra categoría." />
      <div v-else class="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
        <article v-for="product in filtered" :key="product.id" class="group overflow-hidden rounded-[2rem] bg-white transition duration-300 hover:bg-[#f3f3f5]">
          <div class="relative aspect-[3/4] overflow-hidden bg-[#eeeef0]">
            <img v-if="product.imagen_url" :src="product.imagen_url" :alt="product.nombre" class="size-full object-cover transition duration-700 group-hover:scale-[1.03]" />
            <div v-else class="grid size-full place-items-center bg-gradient-to-br from-brand-50 to-[#e2e2e4] text-8xl font-semibold text-brand-700/15">{{ product.nombre.charAt(0) }}</div>
            <span v-if="product.stock > 0 && product.stock <= 5" class="absolute top-4 left-4 rounded-full bg-brand-700 px-3 py-1.5 text-xs font-semibold text-white">EDICIÓN LIMITADA</span>
            <span v-else-if="product.stock > 5" class="absolute top-4 left-4 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-brand-700 backdrop-blur">NUEVO</span>
          </div>
          <div class="p-5">
            <div class="flex items-start justify-between gap-4"><div><p class="text-xs font-semibold tracking-[0.08em] text-brand-600">{{ product.categorias?.nombre || 'ATELIER' }}</p><h2 class="mt-2 text-xl font-medium tracking-tight text-ink">{{ product.nombre }}</h2></div><strong class="whitespace-nowrap text-lg font-medium text-ink">{{ formatCurrency(product.precio) }}</strong></div>
            <p class="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-slate-500">{{ product.descripcion || 'Una pieza contemporánea seleccionada para la colección.' }}</p>
            <div class="mt-5 flex items-center justify-between gap-4"><span class="text-xs font-medium text-slate-500">{{ product.stock ? `${product.stock} unidades` : 'Agotado' }}</span><button class="btn-primary min-h-10 px-5 text-sm" :disabled="product.stock === 0" @click="add(product)"><ShoppingBag class="size-4" />{{ product.stock ? 'Añadir a bolsa' : 'Agotado' }}</button></div>
          </div>
        </article>
      </div>
    </section>
  </main>
</template>
