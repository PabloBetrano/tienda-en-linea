<script setup lang="ts">
import { Mail } from 'lucide-vue-next'
import { ref } from 'vue'
import AuthLayout from '@/layouts/AuthLayout.vue'
import { authService } from '@/services/auth.service'
import { useToastStore } from '@/stores/toast.store'
import { getErrorMessage } from '@/utils/formatters'
const email=ref('');const sent=ref(false);const busy=ref(false);const toast=useToastStore();async function submit(){busy.value=true;try{await authService.resetPassword(email.value);sent.value=true}catch(e){toast.show('No se pudo enviar',getErrorMessage(e),'error')}finally{busy.value=false}}
</script>
<template><AuthLayout><div class="mb-5 grid size-12 place-items-center rounded-2xl bg-brand-100 text-brand-700"><Mail/></div><h1 class="text-3xl font-bold text-ink">Recupera tu acceso</h1><p class="mt-2 text-slate-500">Te enviaremos un enlace para establecer una nueva contraseña.</p><div v-if="sent" class="mt-7 rounded-xl bg-brand-50 p-4 text-brand-700">Si existe una cuenta para <strong>{{email}}</strong>, recibirás un correo en breve.</div><form v-else class="mt-7 space-y-5" @submit.prevent="submit"><div><label class="label">Correo electrónico</label><input v-model="email" class="field" type="email" required autocomplete="email"></div><button class="btn-primary w-full" :disabled="busy">Enviar enlace</button></form><RouterLink to="/ingresar" class="mt-6 block text-center font-semibold text-brand-700">Volver al ingreso</RouterLink></AuthLayout></template>
