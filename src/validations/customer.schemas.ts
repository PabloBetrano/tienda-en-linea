import { z } from 'zod'

export const customerSchema = z.object({
  nombre: z.string().trim().min(2, 'Ingrese el nombre'),
  apellido: z.string().trim().min(2, 'Ingrese el apellido'),
  email: z.string().trim().email('Ingrese un correo válido'),
  telefono: z.string().trim().max(30, 'El teléfono es demasiado largo').optional(),
  password: z.string().min(8, 'Use al menos 8 caracteres'),
})
