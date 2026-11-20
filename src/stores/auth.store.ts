import type { Session, User } from '@supabase/supabase-js'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { authService } from '@/services/auth.service'
import { profilesService } from '@/services/profiles.service'
import { supabase } from '@/services/supabase'
import type { Perfil } from '@/types/database.types'

export const useAuthStore = defineStore('auth', () => {
  const session = ref<Session | null>(null)
  const user = ref<User | null>(null)
  const profile = ref<Perfil | null>(null)
  const loading = ref(true)
  const initialized = ref(false)
  const isAuthenticated = computed(() => Boolean(session.value))
  const isAdmin = computed(() => profile.value?.rol === 'administrador')

  async function loadProfile() {
    profile.value = user.value ? await profilesService.get(user.value.id) : null
  }
  async function initialize() {
    if (initialized.value) return
    loading.value = true
    const { data } = await supabase.auth.getSession()
    session.value = data.session
    user.value = data.session?.user ?? null
    if (user.value) await loadProfile().catch(() => { profile.value = null })
    supabase.auth.onAuthStateChange((_event, nextSession) => {
      session.value = nextSession
      user.value = nextSession?.user ?? null
      window.setTimeout(() => loadProfile().catch(() => { profile.value = null }), 0)
    })
    initialized.value = true
    loading.value = false
  }
  async function signIn(email: string, password: string) {
    const data = await authService.signIn(email, password)
    session.value = data.session
    user.value = data.user
    await loadProfile()
  }
  async function signOut() {
    await authService.signOut()
    session.value = null
    user.value = null
    profile.value = null
  }
  return { session, user, profile, loading, initialized, isAuthenticated, isAdmin, initialize, signIn, signOut, loadProfile }
})
