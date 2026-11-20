<script setup lang="ts">
import { Minus, Plus, Search, ShoppingCart } from 'lucide-vue-next'
import { computed, onMounted, reactive, ref } from 'vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import ExportButtons from '@/components/ui/ExportButtons.vue'
import ModalDialog from '@/components/ui/ModalDialog.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import { catalogService } from '@/services/catalog.service'
import { ordersService } from '@/services/orders.service'
import { profilesService } from '@/services/profiles.service'
import { useToastStore } from '@/stores/toast.store'
import type { EstadoPedido, Pedido, Perfil, Producto } from '@/types/database.types'
import { formatCurrency, formatDate, getErrorMessage } from '@/utils/formatters'

const orders = ref<Pedido[]>([])
const customers = ref<Perfil[]>([])
const products = ref<Producto[]>([])
const query = ref('')
const status = ref('')
const modal = ref(false)
const busy = ref(false)
const customerId = ref('')
const quantities = reactive<Record<number, number>>({})
const toast = useToastStore()
const states: EstadoPedido[] = ['pendiente', 'pagado', 'enviado', 'entregado', 'cancelado']
const filtered = computed(() =>
  orders.value.filter(
    (order) =>
      (!status.value || order.estado === status.value) &&
      (String(order.id).includes(query.value) ||
        `${order.perfiles?.nombre} ${order.perfiles?.apellido}`.toLowerCase().includes(query.value.toLowerCase())),
  ),
)
const selectedItems = computed(() =>
  Object.entries(quantities)
    .map(([id, cantidad]) => ({ producto_id: Number(id), cantidad }))
    .filter((item) => item.cantidad > 0),
)
const selectedTotal = computed(() =>
  selectedItems.value.reduce((sum, item) => {
    const product = products.value.find((entry) => entry.id === item.producto_id)
    return sum + Number(product?.precio ?? 0) * item.cantidad
  }, 0),
)
const exportRows = computed(() =>
  filtered.value.map((order) => [
    order.id,
    `${order.perfiles?.nombre ?? ''} ${order.perfiles?.apellido ?? ''}`.trim(),
    formatDate(order.creado_en),
    order.detalle_pedido?.reduce((sum, item) => sum + item.cantidad, 0) ?? 0,
    Number(order.total),
    order.estado,
  ]),
)

async function load() {
  const [orderData, profileData, productData] = await Promise.all([
    ordersService.listOrders(),
    profilesService.list(),
    catalogService.listProducts(false),
  ])
  orders.value = orderData
  customers.value = profileData.filter((profile) => profile.rol === 'cliente')
  products.value = productData.filter((product) => product.stock > 0)
}
function openCreate() {
  customerId.value = customers.value[0]?.id ?? ''
  Object.keys(quantities).forEach((key) => delete quantities[Number(key)])
  modal.value = true
}
function adjust(product: Producto, delta: number) {
  quantities[product.id] = Math.max(0, Math.min(product.stock, (quantities[product.id] ?? 0) + delta))
}
async function createOrder() {
  if (!customerId.value || !selectedItems.value.length) {
    toast.show('Pedido incompleto', 'Selecciona un cliente y al menos un producto.', 'error')
    return
  }
  busy.value = true
  try {
    const id = await ordersService.createAdminOrder(customerId.value, selectedItems.value)
    toast.show('Pedido registrado', `El pedido #${id} fue creado correctamente.`, 'success')
    modal.value = false
    await load()
  } catch (error) {
    toast.show('No se pudo registrar el pedido', getErrorMessage(error), 'error')
  } finally {
    busy.value = false
  }
}
async function change(order: Pedido, event: Event) {
  const next = (event.target as HTMLSelectElement).value as EstadoPedido
  try {
    await ordersService.updateStatus(order.id, next)
    order.estado = next
    toast.show('Estado actualizado', '', 'success')
  } catch (error) {
    toast.show('No se pudo actualizar', getErrorMessage(error), 'error')
  }
}
onMounted(() => load().catch((error) => toast.show('Error', getErrorMessage(error), 'error')))
</script>

<template>
  <div>
    <div class="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
      <div><h2 class="page-title">Pedidos</h2><p class="page-copy">Registra, procesa y da seguimiento a cada compra.</p></div>
      <div class="flex flex-wrap gap-2">
        <ExportButtons title="Pedidos" file-name="pedidos" :headers="['Pedido', 'Cliente', 'Fecha', 'Artículos', 'Total (CRC)', 'Estado']" :rows="exportRows" />
        <button class="btn-primary" :disabled="!customers.length || !products.length" @click="openCreate"><ShoppingCart class="size-4" />Registrar pedido</button>
      </div>
    </div>
    <div class="mt-7 flex flex-col gap-3 sm:flex-row"><label class="relative flex-1"><Search class="absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-slate-400" /><input v-model="query" class="field pl-11" placeholder="Buscar por número o cliente..." /></label><select v-model="status" class="field sm:w-56"><option value="">Todos los estados</option><option v-for="item in states" :key="item" :value="item" class="capitalize">{{ item }}</option></select></div>
    <EmptyState v-if="!filtered.length" class="mt-7" title="No hay pedidos" message="Los nuevos pedidos aparecerán aquí." />
    <div v-else class="table-wrap mt-7"><table class="data-table"><thead><tr><th>Pedido</th><th>Cliente</th><th>Fecha</th><th>Artículos</th><th>Total</th><th>Estado</th><th>Actualizar</th></tr></thead><tbody>
      <tr v-for="order in filtered" :key="order.id"><td class="font-bold">#{{ order.id }}</td><td>{{ order.perfiles?.nombre }} {{ order.perfiles?.apellido }}</td><td class="text-sm text-slate-500">{{ formatDate(order.creado_en) }}</td><td>{{ order.detalle_pedido?.reduce((sum, item) => sum + item.cantidad, 0) }}</td><td class="font-semibold">{{ formatCurrency(order.total) }}</td><td><StatusBadge :value="order.estado" /></td><td><select :value="order.estado" class="field min-w-38 py-2 text-sm capitalize" @change="change(order, $event)"><option v-for="item in states" :key="item" :value="item">{{ item }}</option></select></td></tr>
    </tbody></table></div>

    <ModalDialog :open="modal" title="Registrar pedido" wide @close="modal = false">
      <form class="space-y-5" @submit.prevent="createOrder">
        <div><label class="label">Cliente</label><select v-model="customerId" class="field"><option v-for="customer in customers" :key="customer.id" :value="customer.id">{{ customer.nombre }} {{ customer.apellido }}</option></select></div>
        <div><div class="mb-2 flex items-center justify-between"><label class="label mb-0">Productos</label><span class="text-sm text-slate-500">{{ selectedItems.length }} seleccionados</span></div><div class="max-h-80 space-y-2 overflow-y-auto rounded-xl border border-slate-200 p-2">
          <div v-for="product in products" :key="product.id" class="flex items-center justify-between gap-3 rounded-xl p-3 hover:bg-slate-50"><div class="min-w-0"><p class="font-semibold text-ink">{{ product.nombre }}</p><p class="text-sm text-slate-500">{{ formatCurrency(product.precio) }} · {{ product.stock }} disponibles</p></div><div class="flex shrink-0 items-center rounded-xl border border-slate-200"><button type="button" class="p-2" :disabled="!quantities[product.id]" @click="adjust(product, -1)"><Minus class="size-4" /></button><span class="w-9 text-center font-semibold">{{ quantities[product.id] ?? 0 }}</span><button type="button" class="p-2" :disabled="(quantities[product.id] ?? 0) >= product.stock" @click="adjust(product, 1)"><Plus class="size-4" /></button></div></div>
        </div></div>
        <div class="flex items-center justify-between rounded-xl bg-slate-50 p-4"><span class="font-semibold text-slate-600">Total estimado</span><strong class="text-xl text-ink">{{ formatCurrency(selectedTotal) }}</strong></div>
        <div class="flex justify-end gap-3"><button type="button" class="btn-secondary" @click="modal = false">Cancelar</button><button class="btn-primary" :disabled="busy || !selectedItems.length">Registrar pedido</button></div>
      </form>
    </ModalDialog>
  </div>
</template>
