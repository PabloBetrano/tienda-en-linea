<script setup lang="ts">
import { LogIn, LogOut, Menu, Package, ShieldCheck, ShoppingBag, ShoppingCart, X } from 'lucide-vue-next'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import ExchangeRateBanner from '@/components/ui/ExchangeRateBanner.vue'
import { useAuthStore } from '@/stores/auth.store'
import { useCartStore } from '@/stores/cart.store'

const auth = useAuthStore()
const cart = useCartStore()
const router = useRouter()
const mobile = ref(false)

async function logout() {
  await auth.signOut()
  await router.push('/')
}
</script>

<template>
  <div class="min-h-screen bg-[#f9f9fb]">
    <header class="sticky top-0 z-30 border-b border-brand-700/8 bg-[#f9f9fb]/82 shadow-[0_1px_8px_rgba(0,0,0,0.04)] backdrop-blur-xl">
      <div class="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-12">
        <RouterLink to="/" class="flex items-center gap-2 text-lg font-semibold tracking-tight text-ink"><span class="grid size-9 place-items-center rounded-lg bg-brand-700 text-white"><ShoppingBag class="size-4" /></span>ATELIER</RouterLink>
        <nav class="hidden items-center gap-2 md:flex">
          <RouterLink to="/" class="rounded-full px-4 py-2 text-sm font-medium text-slate-600 hover:bg-brand-700/6">Inicio</RouterLink>
          <RouterLink to="/tienda" class="rounded-full bg-brand-700 px-4 py-2 text-sm font-medium text-white">Colección</RouterLink>
          <RouterLink v-if="auth.isAuthenticated" to="/tienda/mis-pedidos" class="rounded-full px-4 py-2 text-sm font-medium text-slate-600 hover:bg-brand-700/6"><Package class="mr-1 inline size-4" /> Mis pedidos</RouterLink>
          <RouterLink v-if="auth.isAdmin" to="/admin" class="rounded-full px-4 py-2 text-sm font-medium text-slate-600 hover:bg-brand-700/6"><ShieldCheck class="mr-1 inline size-4" /> Administración</RouterLink>
          <RouterLink to="/tienda/carrito" class="relative rounded-full bg-brand-700/6 p-3 text-brand-700" aria-label="Carrito"><ShoppingCart class="size-5" /><span v-if="cart.count" class="absolute -top-1 -right-1 grid size-5 place-items-center rounded-full bg-brand-700 text-xs font-bold text-white">{{ cart.count }}</span></RouterLink>
          <button v-if="auth.isAuthenticated" class="rounded-lg p-3 text-slate-600 hover:bg-slate-100" aria-label="Cerrar sesión" @click="logout"><LogOut class="size-5" /></button>
          <RouterLink v-else to="/ingresar" class="btn-secondary"><LogIn class="size-4" /> Ingresar</RouterLink>
        </nav>
        <button class="rounded-lg p-2 md:hidden" aria-label="Menú" @click="mobile = !mobile"><X v-if="mobile" /><Menu v-else /></button>
      </div>
      <nav v-if="mobile" class="border-t border-slate-100 px-4 py-3 md:hidden">
        <RouterLink to="/" class="block py-2">Inicio</RouterLink><RouterLink to="/tienda" class="block py-2">Productos</RouterLink><RouterLink to="/tienda/carrito" class="block py-2">Carrito ({{ cart.count }})</RouterLink><RouterLink v-if="auth.isAuthenticated" to="/tienda/mis-pedidos" class="block py-2">Mis pedidos</RouterLink><RouterLink v-if="auth.isAdmin" to="/admin" class="block py-2">Administración</RouterLink><RouterLink v-if="!auth.isAuthenticated" to="/ingresar" class="block py-2">Ingresar</RouterLink><button v-else class="py-2" @click="logout">Cerrar sesión</button>
      </nav>
    </header>
    <div v-if="auth.isAuthenticated" class="mx-auto max-w-7xl px-4 pt-4 sm:px-6 lg:px-12">
      <ExchangeRateBanner />
    </div>
    <RouterView />
    <footer class="mt-16 border-t border-brand-700/8 bg-[#f3f3f5]"><div class="mx-auto flex max-w-7xl flex-col justify-between gap-3 px-4 py-10 text-sm text-slate-500 sm:flex-row sm:px-6 lg:px-12"><p>© 2026 ATELIER Maison de Mode. Todos los derechos reservados.</p><p class="font-medium tracking-wide text-brand-700">Compra segura · Diseño consciente</p></div></footer>
  </div>
</template>
