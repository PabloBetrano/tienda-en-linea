export interface ProductImportItem {
  nombre: string
  categoria_slug: string
  precio: string
  stock: number
  activo: boolean
  descripcion: string | null
  imagen_url: string | null
}

export interface ProductImportRequest {
  requestId: string
  items: ProductImportItem[]
}
