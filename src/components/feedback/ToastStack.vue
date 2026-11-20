<script setup lang="ts">
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-vue-next'
import { useToastStore } from '@/stores/toast.store'

const toast = useToastStore()
const icon = { success: CheckCircle2, error: AlertCircle, info: Info }
</script>

<template>
  <div class="fixed top-4 right-4 z-60 flex w-[calc(100%-2rem)] max-w-sm flex-col gap-3" aria-live="polite">
    <TransitionGroup name="toast">
      <div v-for="item in toast.messages" :key="item.id" class="card flex gap-3 p-4 shadow-lg">
        <component :is="icon[item.kind]" class="mt-0.5 size-5 shrink-0" :class="item.kind === 'error' ? 'text-red-600' : item.kind === 'success' ? 'text-brand-600' : 'text-blue-600'" />
        <div class="min-w-0 flex-1"><p class="font-semibold text-slate-900">{{ item.title }}</p><p v-if="item.message" class="mt-0.5 text-sm text-slate-500">{{ item.message }}</p></div>
        <button class="self-start text-slate-400 hover:text-slate-700" aria-label="Cerrar" @click="toast.remove(item.id)"><X class="size-4" /></button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-enter-active,.toast-leave-active{transition:all .2s ease}.toast-enter-from,.toast-leave-to{opacity:0;transform:translateY(-8px)}
</style>
