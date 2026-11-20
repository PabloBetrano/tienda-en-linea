export type RolUsuario = 'cliente' | 'administrador'
export type EstadoPedido = 'pendiente' | 'pagado' | 'enviado' | 'entregado' | 'cancelado'

export interface Perfil {
  id: string
  email: string | null
  nombre: string
  apellido: string | null
  telefono: string | null
  rol: RolUsuario
  creado_en: string
}

export interface Categoria {
  id: number
  nombre: string
  slug: string
}

export interface Producto {
  id: number
  categoria_id: number
  nombre: string
  descripcion: string | null
  precio: number
  stock: number
  imagen_url: string | null
  activo: boolean
  creado_en: string
  categorias?: Pick<Categoria, 'nombre'> | null
}

export interface Pedido {
  id: number
  perfil_id: string
  estado: EstadoPedido
  total: number
  creado_en: string
  perfiles?: Pick<Perfil, 'nombre' | 'apellido'> | null
  detalle_pedido?: DetallePedido[]
}

export interface DetallePedido {
  id: number
  pedido_id: number
  producto_id: number
  cantidad: number
  precio_unitario: number
  productos?: Pick<Producto, 'nombre' | 'imagen_url'> | null
}

type Table<Row, Insert, Update> = {
  Row: Row
  Insert: Insert
  Update: Update
  Relationships: []
}

export interface Database {
  public: {
    Tables: {
      perfiles: Table<Perfil, Omit<Perfil, 'creado_en'> & { creado_en?: string }, Partial<Omit<Perfil, 'id' | 'creado_en'>>>
      categorias: Table<Categoria, Omit<Categoria, 'id'> & { id?: number }, Partial<Omit<Categoria, 'id'>>>
      productos: Table<Producto, Omit<Producto, 'id' | 'creado_en' | 'categorias'> & { id?: number; creado_en?: string }, Partial<Omit<Producto, 'id' | 'creado_en' | 'categorias'>>>
      pedidos: Table<Pedido, Omit<Pedido, 'id' | 'creado_en' | 'perfiles' | 'detalle_pedido'> & { id?: number; creado_en?: string }, Partial<Pick<Pedido, 'estado'>>>
      detalle_pedido: Table<DetallePedido, Omit<DetallePedido, 'id' | 'productos'> & { id?: number }, Partial<Omit<DetallePedido, 'id' | 'productos'>>>
    }
    Views: Record<string, never>
    Functions: {
      crear_pedido: {
        Args: { items: { producto_id: number; cantidad: number }[] }
        Returns: number
      }
      crear_pedido_admin: {
        Args: { perfil_destino: string; items: { producto_id: number; cantidad: number }[] }
        Returns: number
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
