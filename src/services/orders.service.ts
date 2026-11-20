import { supabase } from './supabase'
import type { EstadoPedido, Pedido } from '@/types/database.types'

export const ordersService = {
  async listOrders(ownOnly = false) {
    let query = supabase
      .from('pedidos')
      .select('*, perfiles(nombre, apellido), detalle_pedido(*, productos(nombre, imagen_url))')
      .order('creado_en', { ascending: false })
    if (ownOnly) {
      const { data } = await supabase.auth.getUser()
      if (data.user) query = query.eq('perfil_id', data.user.id)
    }
    const { data, error } = await query
    if (error) throw error
    return data as unknown as Pedido[]
  },
  async updateStatus(id: number, estado: EstadoPedido) {
    const { error } = await supabase.from('pedidos').update({ estado }).eq('id', id)
    if (error) throw error
  },
  async createOrder(items: { producto_id: number; cantidad: number }[]) {
    const { data, error } = await supabase.rpc('crear_pedido', { items })
    if (error) throw error
    return data
  },
  async createAdminOrder(perfilDestino: string, items: { producto_id: number; cantidad: number }[]) {
    const { data, error } = await supabase.rpc('crear_pedido_admin', {
      perfil_destino: perfilDestino,
      items,
    })
    if (error) throw error
    return data
  },
}
