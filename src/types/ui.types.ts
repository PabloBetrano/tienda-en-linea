export type ToastKind = 'success' | 'error' | 'info'

export interface ToastMessage {
  id: number
  title: string
  message?: string
  kind: ToastKind
}

export interface CartItem {
  producto: import('./database.types').Producto
  cantidad: number
}
