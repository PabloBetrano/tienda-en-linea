<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import ExportButtons from '@/components/ui/ExportButtons.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import { ordersService } from '@/services/orders.service'
import { useToastStore } from '@/stores/toast.store'
import type { Pedido } from '@/types/database.types'
import { formatCurrency, formatDate, getErrorMessage } from '@/utils/formatters'
const orders = ref<Pedido[]>([]); const loading = ref(true); const toast = useToastStore()
const exportRows = computed(() => orders.value.map((order) => [order.id, formatDate(order.creado_en), order.detalle_pedido?.reduce((sum, line) => sum + line.cantidad, 0) ?? 0, Number(order.total), order.estado]))
onMounted(async () => { try { orders.value = await ordersService.listOrders(true) } catch (error) { toast.show('No se pudieron cargar los pedidos', getErrorMessage(error), 'error') } finally { loading.value = false } })
</script>
<template><main class="mx-auto max-w-5xl px-4 py-10 sm:px-6"><div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><h1 class="page-title">Mis pedidos</h1><p class="page-copy">Consulta el estado y detalle de tus compras.</p></div><ExportButtons title="Mis pedidos" file-name="mis-pedidos" :headers="['Pedido', 'Fecha', 'Artículos', 'Total (CRC)', 'Estado']" :rows="exportRows" /></div><div v-if="loading" class="mt-8 text-slate-500">Cargando pedidos...</div><EmptyState v-else-if="!orders.length" class="mt-8" title="Aún no tienes pedidos" message="Tu historial aparecerá aquí cuando completes tu primera compra."><RouterLink to="/tienda" class="btn-primary">Explorar tienda</RouterLink></EmptyState><div v-else class="mt-8 space-y-5"><article v-for="order in orders" :key="order.id" class="card overflow-hidden"><header class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50 px-5 py-4"><div><h2 class="font-bold text-ink">Pedido #{{ order.id }}</h2><p class="text-sm text-slate-500">{{ formatDate(order.creado_en) }}</p></div><StatusBadge :value="order.estado" /></header><div class="divide-y divide-slate-100 px-5"><div v-for="line in order.detalle_pedido" :key="line.id" class="flex items-center justify-between gap-3 py-3"><span>{{ line.cantidad }} × {{ line.productos?.nombre }}</span><strong>{{ formatCurrency(Number(line.precio_unitario) * line.cantidad) }}</strong></div></div><footer class="flex justify-between border-t border-slate-100 px-5 py-4 font-bold"><span>Total</span><span>{{ formatCurrency(order.total) }}</span></footer></article></div></main></template>
