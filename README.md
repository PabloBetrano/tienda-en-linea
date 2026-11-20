# Tienda en Línea

Aplicación Vue 3 + TypeScript para administrar catálogo, inventario, clientes y pedidos, conectada a Supabase.

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

Consulta [AGENTS.md](./AGENTS.md) antes de modificar el proyecto.
