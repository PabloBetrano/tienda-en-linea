import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import type { Producto } from '@/types/database.types'
import type { CartItem } from '@/types/ui.types'

const saved = localStorage.getItem('tienda-cart')

export const useCartStore = defineStore('cart', () => {
  const items = ref<CartItem[]>(saved ? JSON.parse(saved) : [])
  const count = computed(() => items.value.reduce((sum, item) => sum + item.cantidad, 0))
  const total = computed(() => items.value.reduce((sum, item) => sum + Number(item.producto.precio) * item.cantidad, 0))
  watch(items, (value) => localStorage.setItem('tienda-cart', JSON.stringify(value)), { deep: true })
  function add(producto: Producto) {
    const item = items.value.find((entry) => entry.producto.id === producto.id)
    if (item) item.cantidad = Math.min(item.cantidad + 1, producto.stock)
    else if (producto.stock > 0) items.value.push({ producto, cantidad: 1 })
  }
  function setQuantity(id: number, cantidad: number) {
    const item = items.value.find((entry) => entry.producto.id === id)
    if (item) item.cantidad = Math.max(1, Math.min(cantidad, item.producto.stock))
  }
  function remove(id: number) { items.value = items.value.filter((entry) => entry.producto.id !== id) }
  function clear() { items.value = [] }
  return { items, count, total, add, setQuantity, remove, clear }
})
