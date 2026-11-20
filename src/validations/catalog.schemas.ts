import { z } from 'zod'

export const categorySchema = z.object({
  nombre: z.string().trim().min(2, 'Ingrese un nombre'),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use un slug válido'),
})

export const productSchema = z.object({
  nombre: z.string().trim().min(2, 'Ingrese un nombre'),
  descripcion: z.string().trim().nullable(),
  categoria_id: z.number().int().positive('Seleccione una categoría'),
  precio: z.number().nonnegative('El precio no puede ser negativo'),
  stock: z.number().int().nonnegative('El inventario no puede ser negativo'),
  imagen_url: z.union([z.string().url('Ingrese una URL válida'), z.literal('')]).nullable(),
  activo: z.boolean(),
})

export const productImageSchema = z
  .instanceof(File)
  .refine((file) => ['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(file.type), 'Use una imagen JPEG, PNG, WebP o AVIF')
  .refine((file) => file.size <= 5 * 1024 * 1024, 'La imagen no puede superar 5 MB')
