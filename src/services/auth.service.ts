import { supabase } from './supabase'

export const authService = {
  async countRegisteredUsers(): Promise<number> {
    const { data, error } = await supabase.rpc('contar_usuarios_registrados')
    if (error) throw error
    if (typeof data !== 'number' || !Number.isSafeInteger(data) || data < 0) {
      throw new Error('El total de usuarios no es válido.')
    }
    return data
  },
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  },
  async signUp(email: string, password: string, nombre: string, apellido: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nombre, apellido } },
    })
    if (error) throw error
    return data
  },
  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },
  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/actualizar-contrasena`,
    })
    if (error) throw error
  },
  async updatePassword(password: string) {
    const { error } = await supabase.auth.updateUser({ password })
    if (error) throw error
  },
}
