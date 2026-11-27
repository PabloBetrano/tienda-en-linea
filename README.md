# Tienda en Línea

Aplicación Vue 3 + TypeScript para administrar catálogo, inventario, clientes y pedidos, conectada a Supabase.

## Aplicación publicada

- Cloudflare Workers: https://tienda-en-linea-pablobetrano.control-odc-facturas.workers.dev
- Despliegue estático con fallback SPA para Vue Router.

## Funcionalidades

- Alta segura de clientes desde el panel administrativo mediante Edge Function.
- Registro transaccional de pedidos para clientes, con validación y descuento de inventario.
- Exportación de las tablas de productos, categorías, clientes y pedidos a Excel y PDF.
- Exportación del resumen administrativo y del historial de pedidos del cliente.

## Inicio rápido

1. Copia `.env.example` como `.env.local` y completa la URL y la clave publicable de Supabase.
2. Ejecuta la migración `supabase/migrations/20261119000100_initial_store.sql` en el proyecto.
   Aplica también las migraciones posteriores en orden y despliega `supabase/functions/admin-create-client`.
3. Instala dependencias con `npm install`.
4. Inicia con `npm run dev`.

El primer usuario se registra como `cliente`. Para habilitar el primer administrador, actualiza su rol desde el editor SQL de Supabase:

```sql
update public.perfiles set rol = 'administrador' where id = '<UUID_DEL_USUARIO>';
```

## Comandos

- `npm run dev`: entorno local.
- `npm run typecheck`: comprobación TypeScript.
- `npm run lint`: análisis estático.
- `npm run build`: compilación de producción.
- `npm run preview`: vista previa de `dist`.
- `npm run deploy:cloudflare`: compila y publica en Cloudflare Workers.

## Tipo de cambio USD/CRC

Después de iniciar sesión, la administración y la tienda muestran la compra y la venta por dólar, con la fecha de referencia en Costa Rica. Si la cotización del día todavía no está disponible, se identifica la última cotización recibida de los siete días anteriores.

- Para consultar directamente al Banco Central, configura `BCCR_API_TOKEN` en `.env.local` para desarrollo o entre las variables de entorno de Netlify para **Functions**. La función consulta los indicadores 317 (compra) y 318 (venta) del [SDDE del BCCR](https://gee.bccr.fi.cr/indicadoreseconomicos/Documentos/DocumentosMetodologiasNotasTecnicas/Estandar_API_SDDE.pdf). El token se usa en el servidor y se guarda sin el prefijo `VITE_`.
- Cuando falta el token o el BCCR no tiene datos del día, la función intenta consultar la [API pública de Hacienda](https://api.hacienda.go.cr/docs/). La interfaz indica qué servicio respondió.
- La ruta `/api/tipo-cambio` está disponible en los servidores locales de Vite y en Netlify Functions. En Cloudflare Workers estático se muestra el estado de cotización no disponible.

Consulta [AGENTS.md](./AGENTS.md) antes de modificar el proyecto.
