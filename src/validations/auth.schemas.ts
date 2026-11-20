import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Ingrese un correo válido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
})

export const registerSchema = loginSchema.extend({
  nombre: z.string().trim().min(2, 'Ingrese su nombre'),
  apellido: z.string().trim().min(2, 'Ingrese su apellido'),
  password: z.string().min(8, 'Use al menos 8 caracteres'),
})
