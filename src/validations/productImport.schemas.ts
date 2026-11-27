import { z } from 'zod'

const pricePattern = /^[0-9]{1,10}(?:[.,][0-9]{1,2})?$/
const stockPattern = /^[0-9]{1,10}$/
const secureImagePattern = /^https:\/\/[a-zA-Z0-9][a-zA-Z0-9.-]*(?::[0-9]{1,5})?(?:[/?#][^\s\\]*)?$/

function isSecureImageUrl(value: string) {
  return secureImagePattern.test(value) && URL.canParse(value)
}

export const productImportRowSchema = z.object({
  nombre: z.string().refine((value) => [...value].length >= 2 && [...value].length <= 150, {
    message: 'El nombre debe tener entre 2 y 150 caracteres.',
  }),
  categoria_slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Usa el identificador de una categoría existente.'),
  precio: z.string().regex(pricePattern, 'Usa un precio de 0 a 9999999999,99 con hasta dos decimales.').transform((value) => value.replace(',', '.')),
  stock: z.string().transform((value) => value || '0')
    .pipe(z.string().regex(stockPattern, 'El inventario debe ser un número entero de 0 a 2147483647.'))
    .transform(Number).pipe(z.number().max(2147483647, 'El inventario supera 2147483647.')),
  activo: z.enum(['', 'true', 'false'], { error: 'Usa true o false en activo, o déjalo en blanco.' })
    .transform((value) => value === 'true'),
  descripcion: z.string().refine((value) => [...value].length <= 2000, 'La descripción admite hasta 2000 caracteres.')
    .transform((value) => value || null),
  imagen_url: z.string().max(2048, 'La URL de la imagen admite hasta 2048 caracteres.')
    .refine((value) => !value || isSecureImageUrl(value), 'La imagen debe usar una URL HTTPS válida.')
    .transform((value) => value || null),
})
