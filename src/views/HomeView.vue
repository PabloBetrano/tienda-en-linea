<script setup lang="ts">
import { Check, Gem, Heart, LogIn, Menu, ShieldCheck, Shirt, ShoppingBag, ShoppingCart, Sparkles, Truck, X } from 'lucide-vue-next'
import { computed, onMounted, ref } from 'vue'
import { catalogService } from '@/services/catalog.service'
import { useAuthStore } from '@/stores/auth.store'
import { useCartStore } from '@/stores/cart.store'
import { useToastStore } from '@/stores/toast.store'
import type { Producto } from '@/types/database.types'
import { formatCurrency, getErrorMessage } from '@/utils/formatters'

const auth = useAuthStore()
const cart = useCartStore()
const toast = useToastStore()
const products = ref<Producto[]>([])
const loading = ref(true)
const mobileMenuOpen = ref(false)
const featuredProducts = computed(() => products.value.slice(0, 4))

function addToCart(product: Producto) {
  cart.add(product)
  toast.show('Agregado al carrito', product.nombre, 'success')
}

onMounted(async () => {
  try {
    products.value = await catalogService.listProducts(false)
  } catch (error) {
    toast.show('No se pudieron cargar los productos destacados', getErrorMessage(error), 'error')
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="min-h-screen overflow-hidden bg-[#f9f9fb] text-ink">
    <header class="fixed inset-x-0 top-0 z-50 border-b border-brand-700/8 bg-[#f9f9fb]/82 shadow-[0_1px_8px_rgba(0,0,0,0.04)] backdrop-blur-xl">
      <div class="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-12">
        <RouterLink to="/" class="flex items-center gap-3" aria-label="Tienda, inicio">
          <span class="grid size-9 place-items-center rounded-lg bg-ink text-white"><ShoppingBag class="size-4" /></span>
          <span class="text-lg font-semibold tracking-tight">ATELIER</span>
        </RouterLink>
        <nav class="hidden items-center gap-8 text-sm font-semibold lg:flex" aria-label="Navegación principal">
          <a href="#coleccion" class="transition hover:text-brand-600">Colección</a>
          <a href="#beneficios" class="transition hover:text-brand-600">Por qué elegirnos</a>
          <a href="#destacados" class="transition hover:text-brand-600">Destacados</a>
          <RouterLink to="/tienda" class="transition hover:text-brand-600">Ver catálogo</RouterLink>
        </nav>
        <div class="hidden items-center gap-2 lg:flex">
          <RouterLink :to="auth.isAdmin ? '/admin' : auth.isAuthenticated ? '/tienda/mis-pedidos' : '/ingresar'" class="rounded-full px-4 py-2.5 text-sm font-semibold transition hover:bg-white">
            <LogIn class="mr-1 inline size-4" /> {{ auth.isAuthenticated ? 'Mi cuenta' : 'Ingresar' }}
          </RouterLink>
          <RouterLink to="/tienda/carrito" class="relative grid size-11 place-items-center rounded-full bg-ink text-white" aria-label="Abrir carrito">
            <ShoppingCart class="size-5" /><span v-if="cart.count" class="absolute -top-1 -right-1 grid size-5 place-items-center rounded-full bg-brand-500 text-xs font-bold">{{ cart.count }}</span>
          </RouterLink>
        </div>
        <button class="grid size-11 place-items-center rounded-full bg-white lg:hidden" aria-label="Abrir menú" @click="mobileMenuOpen = !mobileMenuOpen"><X v-if="mobileMenuOpen" class="size-5" /><Menu v-else class="size-5" /></button>
      </div>
      <nav v-if="mobileMenuOpen" class="border-t border-brand-700/8 bg-[#f9f9fb] px-4 py-5 lg:hidden" aria-label="Navegación móvil">
        <div class="mx-auto grid max-w-7xl gap-1">
          <a href="#coleccion" class="rounded-xl px-3 py-3 font-semibold hover:bg-white" @click="mobileMenuOpen = false">Colección</a>
          <a href="#beneficios" class="rounded-xl px-3 py-3 font-semibold hover:bg-white" @click="mobileMenuOpen = false">Por qué elegirnos</a>
          <a href="#destacados" class="rounded-xl px-3 py-3 font-semibold hover:bg-white" @click="mobileMenuOpen = false">Destacados</a>
          <RouterLink to="/tienda" class="rounded-xl px-3 py-3 font-semibold hover:bg-white" @click="mobileMenuOpen = false">Ver catálogo</RouterLink>
          <div class="mt-3 grid grid-cols-2 gap-3"><RouterLink :to="auth.isAuthenticated ? '/tienda/mis-pedidos' : '/ingresar'" class="btn-secondary">Mi cuenta</RouterLink><RouterLink to="/tienda/carrito" class="btn-primary"><ShoppingCart class="size-4" /> Carrito ({{ cart.count }})</RouterLink></div>
        </div>
      </nav>
    </header>

    <main>
      <section class="relative min-h-[760px] pt-16 lg:min-h-[860px]">
        <img src="/images/hero-fashion.png" alt="Nueva colección de moda en tonos naturales y verde" class="absolute inset-0 size-full object-cover object-[66%_center]" />
        <div class="absolute inset-0 bg-[#002413]/70"></div>
        <div class="absolute inset-0 bg-gradient-to-r from-[#002413]/95 via-[#002413]/55 to-transparent"></div>
        <div class="relative mx-auto flex min-h-[696px] max-w-7xl items-end px-4 py-20 text-white sm:px-6 lg:min-h-[796px] lg:px-12 lg:py-28">
          <div class="max-w-2xl">
            <div class="mb-6 inline-flex items-center gap-2 rounded-full bg-white/12 px-4 py-2 text-xs font-semibold tracking-[0.12em] backdrop-blur"><Sparkles class="size-4 text-brand-100" /> COLECCIÓN PRIMAVERA / VERANO 2026</div>
            <h1 class="max-w-2xl text-5xl leading-[1.03] font-semibold tracking-[-0.04em] sm:text-6xl lg:text-7xl">Bio-Seda Esmeralda.</h1>
            <p class="mt-5 max-w-2xl text-lg leading-8 text-brand-100 sm:text-2xl">La elegancia en su estado más puro. Una colección contemporánea inspirada en la serenidad del bosque.</p>
            <div class="mt-9 flex flex-col gap-3 sm:flex-row">
              <RouterLink to="/tienda" class="inline-flex min-h-13 items-center justify-center rounded-full bg-brand-100 px-7 py-3 font-semibold text-ink transition hover:bg-white">Descubrir colección</RouterLink>
              <a href="#destacados" class="inline-flex min-h-13 items-center justify-center rounded-full bg-white/12 px-7 py-3 font-semibold text-white backdrop-blur transition hover:bg-white/20">Ver piezas clave</a>
            </div>
            <div class="mt-10 flex flex-wrap gap-x-7 gap-y-3 text-sm font-semibold text-brand-100"><span class="flex items-center gap-2"><Check class="size-4" /> Compra segura</span><span class="flex items-center gap-2"><Check class="size-4" /> Atención personalizada</span></div>
          </div>
        </div>
      </section>

      <section id="beneficios" class="scroll-mt-20 border-y border-slate-200 bg-white">
        <div class="mx-auto grid max-w-7xl divide-y divide-slate-200 px-4 sm:px-6 md:grid-cols-3 md:divide-x md:divide-y-0 lg:px-8">
          <article class="flex gap-4 py-8 md:px-8 md:first:pl-0"><Truck class="mt-1 size-6 shrink-0 text-brand-600" /><div><h2 class="font-bold">Entrega coordinada</h2><p class="mt-1 text-sm leading-6 text-slate-500">Te acompañamos para que recibas tu pedido con tranquilidad.</p></div></article>
          <article class="flex gap-4 py-8 md:px-8"><ShieldCheck class="mt-1 size-6 shrink-0 text-brand-600" /><div><h2 class="font-bold">Compra protegida</h2><p class="mt-1 text-sm leading-6 text-slate-500">Tu cuenta y tus pedidos se gestionan de forma segura.</p></div></article>
          <article class="flex gap-4 py-8 md:px-8 md:last:pr-0"><Heart class="mt-1 size-6 shrink-0 text-brand-600" /><div><h2 class="font-bold">Selección con intención</h2><p class="mt-1 text-sm leading-6 text-slate-500">Piezas elegidas para sumar estilo a tu guardarropa.</p></div></article>
        </div>
      </section>

      <section id="coleccion" class="mx-auto max-w-7xl scroll-mt-20 px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div class="mb-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p class="text-sm font-semibold tracking-[0.16em] text-brand-600">INGENIERÍA TEXTIL ATELIER</p><h2 class="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">Materiales del futuro. Diseñados hoy.</h2></div><RouterLink to="/tienda" class="font-semibold text-brand-700">Ver todo el catálogo</RouterLink></div>
        <div class="grid gap-5 md:grid-cols-3">
          <RouterLink to="/tienda" class="group relative min-h-96 overflow-hidden rounded-[2rem] bg-[#dce8dd] p-8"><div class="absolute -right-12 -bottom-16 size-64 rounded-full bg-brand-600/20 transition duration-500 group-hover:scale-125"></div><Shirt class="absolute right-8 bottom-8 size-32 text-brand-700/20 transition group-hover:scale-110" /><p class="text-xs font-black tracking-widest text-brand-700">ESENCIALES</p><h3 class="mt-4 text-3xl font-black">Tu base,<br />tu estilo</h3><span class="absolute bottom-8 left-8 font-bold">Explorar colección</span></RouterLink>
          <RouterLink to="/tienda" class="group relative min-h-96 overflow-hidden rounded-[2rem] bg-[#eeeef0] p-8"><div class="absolute -right-12 -bottom-16 size-64 rounded-full bg-brand-700/8 transition duration-500 group-hover:scale-125"></div><Gem class="absolute right-8 bottom-8 size-32 text-brand-700/15 transition group-hover:scale-110" /><p class="text-xs font-black tracking-widest text-brand-700/70">DETALLES</p><h3 class="mt-4 text-3xl font-black">El toque<br />perfecto</h3><span class="absolute bottom-8 left-8 font-bold">Explorar accesorios</span></RouterLink>
          <RouterLink to="/tienda" class="group relative min-h-96 overflow-hidden rounded-[2rem] bg-[#0b3b24] p-8 text-white"><div class="absolute -right-12 -bottom-16 size-64 rounded-full bg-white/5 transition duration-500 group-hover:scale-125"></div><Sparkles class="absolute right-8 bottom-8 size-32 text-white/10 transition group-hover:scale-110" /><p class="text-xs font-black tracking-widest text-brand-100/70">NOVEDADES</p><h3 class="mt-4 text-3xl font-black">Lo nuevo<br />llegó</h3><span class="absolute bottom-8 left-8 font-bold text-brand-100">Explorar novedades</span></RouterLink>
        </div>
      </section>

      <section id="destacados" class="scroll-mt-20 bg-white py-20 lg:py-28">
        <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div class="mb-12"><p class="text-sm font-semibold tracking-[0.16em] text-brand-600">SELECCIÓN DE TEMPORADA</p><h2 class="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">Piezas clave</h2><p class="mt-4 max-w-2xl text-lg text-slate-500">Siluetas atemporales y tonos botánicos seleccionados para tu guardarropa.</p></div>
          <div v-if="loading" class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"><div v-for="number in 4" :key="number" class="animate-pulse"><div class="aspect-[4/5] rounded-3xl bg-slate-100"></div><div class="mt-4 h-5 rounded bg-slate-100"></div></div></div>
          <div v-else-if="featuredProducts.length" class="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            <article v-for="product in featuredProducts" :key="product.id" class="group"><div class="relative aspect-[4/5] overflow-hidden rounded-3xl bg-[#f1f3ef]"><img v-if="product.imagen_url" :src="product.imagen_url" :alt="product.nombre" class="size-full object-cover transition duration-500 group-hover:scale-105" /><div v-else class="grid size-full place-items-center bg-gradient-to-br from-brand-50 to-slate-200 text-7xl font-black text-brand-700/15">{{ product.nombre.charAt(0) }}</div><button class="absolute right-4 bottom-4 grid size-12 place-items-center rounded-full bg-white shadow-lg transition hover:bg-brand-100" :disabled="product.stock === 0" :aria-label="`Agregar ${product.nombre} al carrito`" @click="addToCart(product)"><ShoppingCart class="size-5" /></button></div><p class="mt-5 text-xs font-bold tracking-widest text-brand-700">{{ product.categorias?.nombre || 'COLECCIÓN' }}</p><div class="mt-2 flex items-start justify-between gap-3"><h3 class="font-bold">{{ product.nombre }}</h3><strong class="whitespace-nowrap">{{ formatCurrency(product.precio) }}</strong></div><p class="mt-2 text-sm text-slate-500">{{ product.stock ? `${product.stock} disponibles` : 'Agotado temporalmente' }}</p></article>
          </div>
          <div v-else class="rounded-3xl bg-slate-50 px-6 py-16 text-center"><ShoppingBag class="mx-auto size-10 text-brand-600" /><h3 class="mt-4 text-xl font-bold">Muy pronto, nuevos favoritos</h3><p class="mt-2 text-slate-500">Estamos preparando productos para esta colección.</p></div>
          <div class="mt-12 text-center"><RouterLink to="/tienda" class="inline-flex min-h-12 items-center rounded-full border border-ink px-7 py-3 font-bold transition hover:bg-ink hover:text-white">Explorar todos los productos</RouterLink></div>
        </div>
      </section>

      <section class="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-12 lg:py-28"><div class="relative overflow-hidden rounded-[2.5rem] bg-ink px-6 py-16 text-center text-white sm:px-12 lg:py-24"><div class="absolute -top-32 -left-32 size-96 rounded-full bg-brand-500/15 blur-3xl"></div><div class="relative mx-auto max-w-3xl"><p class="text-sm font-black tracking-[0.2em] text-brand-100">SERVICIO PRIVADO DE ATELIER</p><h2 class="mt-5 text-4xl font-semibold tracking-tight sm:text-6xl">Encuentra algo que se sienta tan bien como se ve.</h2><p class="mx-auto mt-5 max-w-xl text-lg leading-8 text-slate-300">Explora la colección completa, añade tus piezas a la bolsa y gestiona tus pedidos desde tu cuenta.</p><RouterLink to="/tienda" class="mt-8 inline-flex min-h-13 items-center rounded-full bg-brand-100 px-8 py-3 font-bold text-ink transition hover:bg-white">Comprar ahora</RouterLink></div></div></section>
    </main>

    <footer class="border-t border-brand-700/8 bg-[#f3f3f5]"><div class="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.5fr_1fr_1fr] lg:px-12"><div><RouterLink to="/" class="flex items-center gap-3"><span class="grid size-10 place-items-center rounded-lg bg-ink text-white"><ShoppingBag class="size-5" /></span><span class="text-lg font-semibold">ATELIER</span></RouterLink><p class="mt-4 max-w-sm text-sm leading-6 text-slate-500">Moda contemporánea inspirada en materiales nobles, líneas limpias y tonos botánicos.</p></div><div><h2 class="font-bold">Boutique Atelier</h2><div class="mt-4 grid gap-3 text-sm text-slate-500"><RouterLink to="/tienda">Catálogo</RouterLink><a href="#coleccion">Colecciones</a><a href="#destacados">Novedades</a></div></div><div><h2 class="font-bold">Atención al cliente</h2><div class="mt-4 grid gap-3 text-sm text-slate-500"><RouterLink to="/ingresar">Ingresar</RouterLink><RouterLink to="/registro">Crear cuenta</RouterLink><RouterLink to="/tienda/mis-pedidos">Mis pedidos</RouterLink></div></div></div><div class="border-t border-brand-700/8"><div class="mx-auto flex max-w-7xl flex-col justify-between gap-2 px-4 py-6 text-xs text-slate-400 sm:flex-row sm:px-6 lg:px-12"><p>© 2026 ATELIER Maison de Mode. Todos los derechos reservados.</p><p class="tracking-wide text-brand-700">PARIS · MILANO · MADRID · SAN JOSÉ</p></div></div></footer>
  </div>
</template>
