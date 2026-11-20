import { z } from 'zod'

const envSchema = z.object({
  VITE_SUPABASE_URL: z.string().url('VITE_SUPABASE_URL debe ser una URL válida'),
  VITE_SUPABASE_ANON_KEY: z.string().min(1, 'Falta VITE_SUPABASE_ANON_KEY'),
})

const result = envSchema.safeParse(import.meta.env)

export const env = result.success
  ? result.data
  : {
      VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || 'https://invalid.local',
      VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || 'missing-key',
    }

export const envError = result.success
  ? null
  : result.error.issues.map((issue) => issue.message).join('. ')
