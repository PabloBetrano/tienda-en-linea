import { z } from 'zod'

const bccrUrl = 'https://apim.bccr.fi.cr/SDDE/api/Bccr.GE.SDDE.Publico.Indicadores.API'
const haciendaUrl = 'https://api.hacienda.go.cr/indicadores/tc/dolar'
const costaRicaDate = new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Costa_Rica' })
const ratePoint = z.object({ fecha: z.iso.date(), valor: z.number().positive() })
const bccrSeries = z.object({
  estado: z.literal(true),
  datos: z.array(z.object({
    codigoIndicador: z.union([z.string(), z.number()]),
    series: z.array(z.object({
      fecha: z.iso.date(),
      valorDatoPorPeriodo: z.number().positive(),
    })),
  })),
})
const haciendaRates = z.object({ compra: ratePoint, venta: ratePoint })

async function fetchJson(url: string | URL, token?: string): Promise<unknown> {
  const headers = new Headers({ Accept: 'application/json' })
  if (token) headers.set('Authorization', `Bearer ${token}`)
  const response = await fetch(url, { headers, signal: AbortSignal.timeout(3500), redirect: 'error' })
  if (!response.ok) throw new Error('Exchange rate provider unavailable')
  return response.json()
}

async function getBccrSeries(code: number, start: string, end: string, token: string) {
  const url = new URL(`${bccrUrl}/indicadoresEconomicos/${code}/series`)
  url.search = new URLSearchParams({
    fechaInicio: start.replaceAll('-', '/'),
    fechaFin: end.replaceAll('-', '/'),
    idioma: 'ES',
  }).toString()
  const { datos } = bccrSeries.parse(await fetchJson(url, token))
  return datos.find(({ codigoIndicador }) => Number(codigoIndicador) === code)?.series ?? []
}

async function getBccrRate(start: string, today: string, token: string) {
  const [purchases, sales] = await Promise.all([
    getBccrSeries(317, start, today, token),
    getBccrSeries(318, start, today, token),
  ])
  const byDate = new Map(sales.map(({ fecha, valorDatoPorPeriodo }) => [fecha, valorDatoPorPeriodo]))
  const purchase = purchases
    .filter(({ fecha }) => fecha >= start && fecha <= today && byDate.has(fecha))
    .sort((left, right) => right.fecha.localeCompare(left.fecha))[0]
  const sell = purchase && byDate.get(purchase.fecha)
  if (sell === undefined) throw new Error('No matching BCCR rates')
  return {
    date: purchase.fecha,
    buy: purchase.valorDatoPorPeriodo,
    sell,
    source: 'BCCR',
  }
}

async function getHaciendaRate(start: string, today: string) {
  const { compra, venta } = haciendaRates.parse(await fetchJson(haciendaUrl))
  if (compra.fecha !== venta.fecha || compra.fecha < start || compra.fecha > today) {
    throw new Error('No matching Hacienda rates')
  }
  return { date: compra.fecha, buy: compra.valor, sell: venta.valor, source: 'Hacienda' }
}

export async function exchangeRateResponse(method: string, token?: string) {
  if (method !== 'GET') return new Response(null, { status: 405, headers: { Allow: 'GET' } })
  const now = Date.now()
  const today = costaRicaDate.format(now)
  const start = costaRicaDate.format(now - 7 * 24 * 60 * 60 * 1000)
  const direct = token ? await getBccrRate(start, today, token).catch(() => null) : null
  const backup = direct?.date === today ? null : await getHaciendaRate(start, today).catch(() => null)
  const rate = backup && (!direct || backup.date > direct.date) ? backup : direct

  if (!rate) {
    return Response.json({ error: 'Tipo de cambio no disponible.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } })
  }

  const maxAge = rate.date === today && (rate.source === 'BCCR' || !token) ? 300 : 60
  return Response.json(rate, { headers: { 'Cache-Control': `public, max-age=${maxAge}, s-maxage=${maxAge}` } })
}

export default function handler(request: Request) {
  return exchangeRateResponse(request.method, process.env.BCCR_API_TOKEN?.trim())
}
