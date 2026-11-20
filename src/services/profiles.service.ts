import { FunctionsHttpError } from '@supabase/supabase-js'
import { supabase } from './supabase'
import type { Perfil, RolUsuario } from '@/types/database.types'

export const profilesService = {
  async get(id: string) {
    const { data, error } = await supabase.from('perfiles').select('*').eq('id', id).single()
    if (error) throw error
    return data as Perfil
  },
  async list() {
    const { data, error } = await supabase.from('perfiles').select('*').order('creado_en', { ascending: false })
    if (error) throw error
    return data as Perfil[]
  },
  async update(id: string, values: Partial<Pick<Perfil, 'nombre' | 'apellido' | 'telefono'>>) {
    const { error } = await supabase.from('perfiles').update(values).eq('id', id)
    if (error) throw error
  },
  async updateRole(id: string, rol: RolUsuario) {
    const { error } = await supabase.from('perfiles').update({ rol }).eq('id', id)
    if (error) throw error
  },
  async createClient(values: {
    nombre: string
    apellido: string
    email: string
    telefono?: string
    password: string
  }) {
    const { data, error } = await supabase.functions.invoke('admin-create-client', { body: values })
    if (error instanceof FunctionsHttpError) {
      const payload = await error.context.json().catch(() => null) as { error?: string } | null
      throw new Error(payload?.error || 'No se pudo crear el cliente.')
    }
    if (error) throw new Error('No fue posible conectar con el servicio de creación de clientes.')
    if (data?.error) throw new Error(data.error)
    return data as { id: string; email: string }
  },
}
