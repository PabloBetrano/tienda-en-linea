<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import AuthLayout from '@/layouts/AuthLayout.vue'
import { authService } from '@/services/auth.service'
import { useToastStore } from '@/stores/toast.store'
import { getErrorMessage } from '@/utils/formatters'
const password=ref('');const busy=ref(false);const toast=useToastStore();const router=useRouter();async function submit(){if(password.value.length<8){toast.show('Contraseña muy corta','Use al menos 8 caracteres.','error');return}busy.value=true;try{await authService.updatePassword(password.value);toast.show('Contraseña actualizada','','success');await router.push('/tienda')}catch(e){toast.show('No se pudo actualizar',getErrorMessage(e),'error')}finally{busy.value=false}}
</script>
<template><AuthLayout><h1 class="text-3xl font-bold text-ink">Nueva contraseña</h1><p class="mt-2 text-slate-500">Elige una contraseña segura para tu cuenta.</p><form class="mt-7 space-y-5" @submit.prevent="submit"><div><label class="label">Nueva contraseña</label><input v-model="password" class="field" type="password" minlength="8" required autocomplete="new-password"></div><button class="btn-primary w-full" :disabled="busy">Guardar contraseña</button></form></AuthLayout></template>
