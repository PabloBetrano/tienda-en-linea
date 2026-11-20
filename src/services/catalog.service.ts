import { supabase } from './supabase'
import type { Categoria, Producto } from '@/types/database.types'

export const catalogService = {
  async listCategories() {
    const { data, error } = await supabase.from('categorias').select('*').order('nombre')
    if (error) throw error
    return data as Categoria[]
  },
  async saveCategory(category: Pick<Categoria, 'nombre' | 'slug'>, id?: number) {
    const query = id
      ? supabase.from('categorias').update(category).eq('id', id)
      : supabase.from('categorias').insert(category)
    const { error } = await query
    if (error) throw error
  },
  async deleteCategory(id: number) {
    const { error } = await supabase.from('categorias').delete().eq('id', id)
    if (error) throw error
  },
  async listProducts(includeInactive = true) {
    let query = supabase.from('productos').select('*, categorias(nombre)').order('creado_en', { ascending: false })
    if (!includeInactive) query = query.eq('activo', true)
    const { data, error } = await query
    if (error) throw error
    return data as unknown as Producto[]
  },
  async saveProduct(product: Omit<Producto, 'id' | 'creado_en' | 'categorias'>, id?: number) {
    const query = id
      ? supabase.from('productos').update(product).eq('id', id)
      : supabase.from('productos').insert(product)
    const { error } = await query
    if (error) throw error
  },
  async deleteProduct(id: number) {
    const { error } = await supabase.from('productos').delete().eq('id', id)
    if (error) throw error
  },
}
