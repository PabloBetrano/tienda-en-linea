<script setup lang="ts">
defineProps<{ value: string }>()
const classes: Record<string, string> = { pendiente: 'bg-amber-100 text-amber-800', pagado: 'bg-blue-100 text-blue-800', enviado: 'bg-violet-100 text-violet-800', entregado: 'bg-emerald-100 text-emerald-800', cancelado: 'bg-red-100 text-red-800', administrador: 'bg-slate-900 text-white', cliente: 'bg-slate-100 text-slate-700' }
</script>
<template><span class="inline-flex rounded-full px-2.5 py-1 text-sm font-semibold capitalize" :class="classes[value] ?? 'bg-slate-100 text-slate-700'">{{ value }}</span></template>
