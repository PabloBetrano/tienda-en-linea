<script setup lang="ts">
import { PackageOpen } from 'lucide-vue-next'
defineProps<{ title: string; message: string }>()
</script>
<template><div class="card flex flex-col items-center px-6 py-14 text-center"><div class="mb-4 rounded-2xl bg-slate-100 p-4 text-slate-500"><PackageOpen class="size-7" /></div><h3 class="text-lg font-bold text-ink">{{ title }}</h3><p class="mt-1 max-w-md text-slate-500">{{ message }}</p><div class="mt-5"><slot /></div></div></template>
