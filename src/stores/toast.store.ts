import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ToastKind, ToastMessage } from '@/types/ui.types'

export const useToastStore = defineStore('toast', () => {
  const messages = ref<ToastMessage[]>([])
  let sequence = 0
  function show(title: string, message = '', kind: ToastKind = 'info') {
    const id = ++sequence
    messages.value.push({ id, title, message, kind })
    window.setTimeout(() => remove(id), 4500)
  }
  function remove(id: number) { messages.value = messages.value.filter((item) => item.id !== id) }
  return { messages, show, remove }
})
