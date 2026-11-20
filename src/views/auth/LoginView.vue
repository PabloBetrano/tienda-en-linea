<script setup lang="ts">
import { Eye, EyeOff, LoaderCircle } from 'lucide-vue-next'
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AuthLayout from '@/layouts/AuthLayout.vue'
import { useAuthStore } from '@/stores/auth.store'
import { useToastStore } from '@/stores/toast.store'
import { getErrorMessage } from '@/utils/formatters'
import { loginSchema } from '@/validations/auth.schemas'

const auth=useAuthStore(); const toast=useToastStore(); const router=useRouter(); const route=useRoute(); const form=reactive({email:'',password:''}); const errors=ref<Record<string,string>>({}); const busy=ref(false); const show=ref(false)
async function submit(){ const result=loginSchema.safeParse(form); if(!result.success){errors.value=Object.fromEntries(result.error.issues.map(i=>[String(i.path[0]),i.message]));return} busy.value=true;errors.value={};try{await auth.signIn(form.email,form.password);toast.show('Bienvenido','Sesión iniciada correctamente.','success');await router.push(typeof route.query.redirect==='string'?route.query.redirect:(auth.isAdmin?'/admin':'/tienda'))}catch(e){toast.show('No fue posible ingresar',getErrorMessage(e),'error')}finally{busy.value=false} }
</script>
<template><AuthLayout><h1 class="text-3xl font-bold text-ink">Bienvenido de nuevo</h1><p class="mt-2 text-slate-500">Ingresa para administrar o consultar tus pedidos.</p><form class="mt-8 space-y-5" @submit.prevent="submit"><div><label class="label" for="email">Correo electrónico</label><input id="email" v-model="form.email" class="field" type="email" autocomplete="email" placeholder="nombre@correo.com"><p v-if="errors.email" class="mt-1 text-sm text-red-600">{{ errors.email }}</p></div><div><div class="flex items-center justify-between"><label class="label" for="password">Contraseña</label><RouterLink to="/recuperar" class="text-sm font-semibold text-brand-700">¿La olvidaste?</RouterLink></div><div class="relative"><input id="password" v-model="form.password" class="field pr-11" :type="show?'text':'password'" autocomplete="current-password" placeholder="••••••••"><button type="button" class="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400" aria-label="Mostrar contraseña" @click="show=!show"><EyeOff v-if="show" class="size-5"/><Eye v-else class="size-5"/></button></div><p v-if="errors.password" class="mt-1 text-sm text-red-600">{{ errors.password }}</p></div><button class="btn-primary w-full" :disabled="busy"><LoaderCircle v-if="busy" class="size-5 animate-spin"/>Ingresar</button></form><p class="mt-7 text-center text-slate-500">¿Aún no tienes cuenta? <RouterLink to="/registro" class="font-semibold text-brand-700">Crear cuenta</RouterLink></p></AuthLayout></template>
