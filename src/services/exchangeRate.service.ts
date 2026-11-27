import { z } from 'zod'

const exchangeRateSchema = z.object({
  date: z.iso.date(),
  buy: z.number().positive(),
  sell: z.number().positive(),
  source: z.enum(['BCCR', 'Hacienda']),
})

export type ExchangeRate = z.infer<typeof exchangeRateSchema>

export async function getExchangeRate(signal: AbortSignal): Promise<ExchangeRate> {
  const response = await fetch('/api/tipo-cambio', { signal, credentials: 'omit' })
  if (!response.ok) throw new Error('Tipo de cambio no disponible.')
  return exchangeRateSchema.parse(await response.json())
}
