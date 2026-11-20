<script setup lang="ts">
import { Plus, Search } from 'lucide-vue-next'
import { computed, onMounted, reactive, ref } from 'vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import ExportButtons from '@/components/ui/ExportButtons.vue'
import ModalDialog from '@/components/ui/ModalDialog.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import { profilesService } from '@/services/profiles.service'
import { useAuthStore } from '@/stores/auth.store'
import { useToastStore } from '@/stores/toast.store'
import type { Perfil, RolUsuario } from '@/types/database.types'
import { formatDate, getErrorMessage } from '@/utils/formatters'
import { customerSchema } from '@/validations/customer.schemas'

const profiles = ref<Perfil[]>([])
const search = ref('')
const modal = ref(false)
const busy = ref(false)
const errors = ref<Record<string, string>>({})
const toast = useToastStore()
const auth = useAuthStore()
const form = reactive({ nombre: '', apellido: '', email: '', telefono: '', password: '' })
const filtered = computed(() =>
  profiles.value.filter((profile) =>
    `${profile.nombre} ${profile.apellido ?? ''}`.toLowerCase().includes(search.value.toLowerCase()),
  ),
)
const exportRows = computed(() =>
  filtered.value.map((profile) => [
    profile.nombre,
    profile.apellido ?? '',
    profile.email ?? '',
    profile.telefono ?? '',
    profile.rol,
    formatDate(profile.creado_en),
    profile.id,
  ]),
)

async function load() {
  profiles.value = await profilesService.list()
}
function openCreate() {
  Object.assign(form, { nombre: '', apellido: '', email: '', telefono: '', password: '' })
  errors.value = {}
  modal.value = true
}
async function createClient() {
  const result = customerSchema.safeParse(form)
  if (!result.success) {
    errors.value = Object.fromEntries(result.error.issues.map((issue) => [String(issue.path[0]), issue.message]))
    return
  }
  busy.value = true
  try {
    await profilesService.createClient(result.data)
    toast.show('Cliente creado', `${result.data.nombre} ya puede ingresar a la tienda.`, 'success')
    modal.value = false
    await load()
  } catch (error) {
    toast.show('No se pudo crear el cliente', getErrorMessage(error), 'error')
  } finally {
    busy.value = false
  }
}
async function change(profile: Perfil, event: Event) {
  const rol = (event.target as HTMLSelectElement).value as RolUsuario
  try {
    await profilesService.updateRole(profile.id, rol)
    profile.rol = rol
    toast.show('Rol actualizado', '', 'success')
  } catch (error) {
    toast.show('No se pudo actualizar', getErrorMessage(error), 'error')
  }
}
onMounted(() => load().catch((error) => toast.show('Error', getErrorMessage(error), 'error')))
</script>

<template>
  <div>
    <div class="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
      <div><h2 class="page-title">Clientes y usuarios</h2><p class="page-copy">Crea clientes, consulta perfiles y administra permisos.</p></div>
      <div class="flex flex-wrap gap-2">
        <ExportButtons title="Clientes y usuarios" file-name="clientes-usuarios" :headers="['Nombre', 'Apellido', 'Correo', 'Teléfono', 'Rol', 'Registro', 'ID']" :rows="exportRows" />
        <button class="btn-primary" @click="openCreate"><Plus class="size-4" />Nuevo cliente</button>
      </div>
    </div>
    <label class="relative mt-7 block max-w-md"><Search class="absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-slate-400" /><input v-model="search" class="field pl-11" placeholder="Buscar por nombre..." /></label>
    <EmptyState v-if="!filtered.length" class="mt-7" title="No hay usuarios" message="Los perfiles registrados aparecerán aquí." />
    <div v-else class="table-wrap mt-7">
      <table class="data-table"><thead><tr><th>Usuario</th><th>Correo</th><th>Teléfono</th><th>Registro</th><th>Rol</th><th>Permisos</th></tr></thead><tbody>
        <tr v-for="profile in filtered" :key="profile.id">
          <td><div class="flex items-center gap-3"><span class="grid size-10 place-items-center rounded-full bg-brand-100 font-bold text-brand-700">{{ profile.nombre.charAt(0) }}</span><div><p class="font-semibold text-ink">{{ profile.nombre }} {{ profile.apellido }}</p><p class="max-w-44 truncate text-xs text-slate-400">{{ profile.id }}</p></div></div></td>
          <td>{{ profile.email || '—' }}</td><td>{{ profile.telefono || '—' }}</td><td class="text-sm text-slate-500">{{ formatDate(profile.creado_en) }}</td><td><StatusBadge :value="profile.rol" /></td>
          <td><select :value="profile.rol" class="field min-w-40 py-2 text-sm" :disabled="profile.id === auth.user?.id" @change="change(profile, $event)"><option value="cliente">Cliente</option><option value="administrador">Administrador</option></select></td>
        </tr>
      </tbody></table>
    </div>
    <ModalDialog :open="modal" title="Nuevo cliente" @close="modal = false">
      <form class="space-y-4" @submit.prevent="createClient">
        <div class="grid gap-4 sm:grid-cols-2"><div><label class="label">Nombre</label><input v-model="form.nombre" class="field" autocomplete="off" /><p v-if="errors.nombre" class="mt-1 text-sm text-red-600">{{ errors.nombre }}</p></div><div><label class="label">Apellido</label><input v-model="form.apellido" class="field" autocomplete="off" /><p v-if="errors.apellido" class="mt-1 text-sm text-red-600">{{ errors.apellido }}</p></div></div>
        <div><label class="label">Correo electrónico</label><input v-model="form.email" class="field" type="email" autocomplete="off" /><p v-if="errors.email" class="mt-1 text-sm text-red-600">{{ errors.email }}</p></div>
        <div><label class="label">Teléfono</label><input v-model="form.telefono" class="field" type="tel" autocomplete="off" /><p v-if="errors.telefono" class="mt-1 text-sm text-red-600">{{ errors.telefono }}</p></div>
        <div><label class="label">Contraseña temporal</label><input v-model="form.password" class="field" type="password" autocomplete="new-password" /><p v-if="errors.password" class="mt-1 text-sm text-red-600">{{ errors.password }}</p><p class="mt-1 text-xs text-slate-500">El cliente podrá cambiarla desde la recuperación de contraseña.</p></div>
        <div class="flex justify-end gap-3 pt-2"><button type="button" class="btn-secondary" @click="modal = false">Cancelar</button><button class="btn-primary" :disabled="busy">Crear cliente</button></div>
      </form>
    </ModalDialog>
  </div>
</template>
