<script setup lang="ts">
import { X } from 'lucide-vue-next'
defineProps<{ open: boolean; title: string; wide?: boolean }>()
defineEmits<{ close: [] }>()
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" @click.self="$emit('close')">
      <section class="card max-h-[90vh] w-full overflow-y-auto p-5 sm:p-6" :class="wide ? 'max-w-3xl' : 'max-w-lg'" role="dialog" aria-modal="true" :aria-label="title">
        <header class="mb-5 flex items-center justify-between gap-4"><h2 class="text-xl font-bold text-ink">{{ title }}</h2><button class="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Cerrar" @click="$emit('close')"><X class="size-5" /></button></header>
        <slot />
      </section>
    </div>
  </Teleport>
</template>
