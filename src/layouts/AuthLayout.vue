<script setup lang="ts">
import { ShoppingBag } from 'lucide-vue-next'
</script>
<template>
  <main class="grid min-h-screen lg:grid-cols-[1fr_1.05fr]">
    <section class="flex items-center justify-center bg-white px-5 py-10 sm:px-10"><div class="w-full max-w-md"><RouterLink to="/tienda" class="mb-10 inline-flex items-center gap-2 text-xl font-bold text-ink"><span class="grid size-10 place-items-center rounded-xl bg-brand-600 text-white"><ShoppingBag class="size-5" /></span>Tienda</RouterLink><slot /></div></section>
    <aside class="relative hidden overflow-hidden bg-ink p-14 text-white lg:flex lg:flex-col lg:justify-between"><div class="absolute -top-24 -right-24 size-96 rounded-full bg-brand-500/20 blur-3xl"></div><p class="relative text-sm font-semibold tracking-widest text-brand-100 uppercase">Comercio conectado</p><div class="relative"><h2 class="max-w-xl text-5xl leading-tight font-bold">Tu tienda, tus ventas y tu equipo en un solo lugar.</h2><p class="mt-6 max-w-lg text-lg leading-relaxed text-slate-300">Inventario, clientes y pedidos sincronizados en tiempo real con Supabase.</p></div><p class="relative text-sm text-slate-400">Plataforma segura · Datos centralizados · Gestión simple</p></aside>
  </main>
</template>
