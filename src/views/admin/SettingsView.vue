<script setup lang="ts">
import { Save } from 'lucide-vue-next'
import { reactive } from 'vue'
import { profilesService } from '@/services/profiles.service'
import { useAuthStore } from '@/stores/auth.store'
import { useToastStore } from '@/stores/toast.store'
import { getErrorMessage } from '@/utils/formatters'
const auth=useAuthStore();const toast=useToastStore();const form=reactive({nombre:auth.profile?.nombre??'',apellido:auth.profile?.apellido??'',telefono:auth.profile?.telefono??''});async function save(){if(!auth.user)return;try{await profilesService.update(auth.user.id,{...form,apellido:form.apellido||null,telefono:form.telefono||null});await auth.loadProfile();toast.show('Perfil actualizado','','success')}catch(e){toast.show('No se pudo guardar',getErrorMessage(e),'error')}}
</script>
<template><div><h2 class="page-title">Configuración</h2><p class="page-copy">Administra la información de tu perfil.</p><form class="card mt-7 max-w-2xl space-y-5 p-6" @submit.prevent="save"><h3 class="text-lg font-bold text-ink">Perfil personal</h3><div class="grid gap-4 sm:grid-cols-2"><div><label class="label">Nombre</label><input v-model="form.nombre" class="field" required></div><div><label class="label">Apellido</label><input v-model="form.apellido" class="field"></div></div><div><label class="label">Teléfono</label><input v-model="form.telefono" class="field" type="tel"></div><div><label class="label">Correo</label><input :value="auth.user?.email" class="field bg-slate-50" disabled></div><button class="btn-primary"><Save class="size-4"/>Guardar cambios</button></form></div></template>
