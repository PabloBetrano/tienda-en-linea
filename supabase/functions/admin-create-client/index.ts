import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2.119.2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Método no permitido' }, 405)

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) return json({ error: 'No autenticado' }, 401)

    const url = Deno.env.get('SUPABASE_URL') ?? ''
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const token = authHeader.slice(7)
    const caller = createClient(url, anonKey, { global: { headers: { Authorization: authHeader } } })
    const { data: userData, error: userError } = await caller.auth.getUser(token)
    if (userError || !userData.user) return json({ error: 'Sesión inválida' }, 401)

    const { data: profile, error: profileError } = await caller
      .from('perfiles')
      .select('rol')
      .eq('id', userData.user.id)
      .single()
    if (profileError || profile?.rol !== 'administrador') {
      return json({ error: 'Se requiere rol administrador' }, 403)
    }

    const body = await req.json()
    const email = String(body.email ?? '').trim().toLowerCase()
    const password = String(body.password ?? '')
    const nombre = String(body.nombre ?? '').trim()
    const apellido = String(body.apellido ?? '').trim()
    const telefono = String(body.telefono ?? '').trim()
    if (!/^\S+@\S+\.\S+$/.test(email) || password.length < 8 || nombre.length < 2 || apellido.length < 2) {
      return json({ error: 'Datos de cliente inválidos' }, 422)
    }

    const admin = createClient(url, serviceKey, { auth: { persistSession: false } })
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { nombre, apellido },
    })
    if (createError) return json({ error: createError.message }, 400)

    const { error: updateError } = await admin
      .from('perfiles')
      .update({ nombre, apellido, email, telefono: telefono || null })
      .eq('id', created.user.id)
    if (updateError) {
      console.error('No se pudo actualizar el perfil del cliente', {
        code: updateError.code,
        message: updateError.message,
        details: updateError.details,
        hint: updateError.hint,
      })
      await admin.auth.admin.deleteUser(created.user.id)
      return json({ error: 'No se pudo completar el perfil del cliente', code: updateError.code }, 500)
    }

    return json({ id: created.user.id, email: created.user.email }, 201)
  } catch (error) {
    console.error('Error inesperado al crear el cliente', error)
    return json({ error: error instanceof Error ? error.message : 'Error inesperado' }, 500)
  }
})
