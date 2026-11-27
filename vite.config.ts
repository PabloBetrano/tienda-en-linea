import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig, loadEnv, type Connect, type Plugin } from 'vite'
import { exchangeRateResponse } from './netlify/functions/tipo-cambio.mts'

function localExchangeRate(token?: string): Plugin {
  const middleware: Connect.NextHandleFunction = async (request, response, next) => {
    if (request.url?.split('?')[0] !== '/api/tipo-cambio') return next()
    try {
      const result = await exchangeRateResponse(request.method ?? 'GET', token)
      response.writeHead(result.status, Object.fromEntries(result.headers))
      response.end(await result.text())
    } catch (error) {
      next(error)
    }
  }
  return {
    name: 'local-exchange-rate',
    configureServer: (server) => { server.middlewares.use(middleware) },
    configurePreviewServer: (server) => { server.middlewares.use(middleware) },
  }
}

export default defineConfig(({ mode }) => ({
  plugins: [vue(), tailwindcss(), localExchangeRate(loadEnv(mode, process.cwd(), 'BCCR_').BCCR_API_TOKEN?.trim())],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
}))
