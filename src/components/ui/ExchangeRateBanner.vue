<script setup lang="ts">
import { ArrowLeftRight } from 'lucide-vue-next'
import { onMounted, onUnmounted, ref } from 'vue'
import { getExchangeRate, type ExchangeRate } from '@/services/exchangeRate.service'

const rate = ref<ExchangeRate>()
const unavailable = ref(false)
const controller = new globalThis.AbortController()
const currency = new Intl.NumberFormat('es-CR', {
  style: 'currency',
  currency: 'CRC',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})
const date = new Intl.DateTimeFormat('es-CR', { dateStyle: 'medium', timeZone: 'UTC' })
const costaRicaDate = new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Costa_Rica' })

onMounted(async () => {
  try {
    rate.value = await getExchangeRate(controller.signal)
  } catch {
    if (!controller.signal.aborted) unavailable.value = true
  }
})
onUnmounted(() => controller.abort())
</script>

<template>
  <section aria-label="Tipo de cambio del dólar" class="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
    <p class="flex items-center gap-2 font-semibold text-ink">
      <ArrowLeftRight aria-hidden="true" class="size-4 text-brand-700" />
      Tipo de cambio USD/CRC
    </p>
    <div role="status" class="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-slate-600">
      <template v-if="rate">
        <span>Compra <strong class="ml-0.5 text-ink tabular-nums">{{ currency.format(rate.buy) }}</strong></span>
        <span>Venta <strong class="ml-0.5 text-ink tabular-nums">{{ currency.format(rate.sell) }}</strong></span>
        <span class="text-xs">
          {{ rate.date === costaRicaDate.format() ? 'Hoy' : 'Último dato disponible' }}
          · <time :datetime="rate.date">{{ date.format(new Date(rate.date)) }}</time>
          · {{ rate.source === 'BCCR' ? 'BCCR' : 'Ministerio de Hacienda' }}
        </span>
      </template>
      <span v-else>{{ unavailable ? 'No disponible en este momento' : 'Consultando cotización…' }}</span>
    </div>
  </section>
</template>
