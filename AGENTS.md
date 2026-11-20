# AGENTS.md — Tienda en Línea

## Sistema

Aplicación integral de comercio electrónico para clientes y administradores. Incluye autenticación, catálogo, categorías, inventario, carrito, pedidos, clientes y permisos. Supabase es la fuente de verdad; no se deben duplicar reglas críticas únicamente en el frontend.

## Tecnologías

Vue 3 (Composition API y `<script setup>`), TypeScript estricto, Vite, Tailwind CSS, Vue Router, Pinia, Zod, Lucide Vue y Supabase (`@supabase/supabase-js`). PostgreSQL, Auth y RLS residen en Supabase.

## Arquitectura

- `src/components`: UI reutilizable, sin acceso directo a datos.
- `src/views`: composición de páginas; delega persistencia a servicios.
- `src/layouts`: estructuras visuales de rutas.
- `src/services`: único punto de acceso a Supabase.
- `src/stores`: sesión y estado compartido del cliente.
- `src/router`: rutas, lazy loading y guards.
- `src/config`: configuración validada.
- `src/types`: contratos TypeScript, incluyendo base de datos.
- `src/validations`: esquemas Zod de entrada.
- `src/utils`: funciones puras.
- `supabase/migrations`: cambios versionados de base de datos.
- `supabase/functions`: operaciones privilegiadas ejecutadas en Supabase Edge Functions.

## Convenciones

- Componentes y vistas: `PascalCase.vue`; servicios, stores y utilidades: `camelCase` con sufijo funcional (`.service.ts`, `.store.ts`).
- Use Composition API y `<script setup lang="ts">`. No use `any`; modele tipos explícitos.
- Imports internos mediante `@/`. Mantenga funciones pequeñas y nombres en inglés para código; textos de interfaz en español.
- No mezcle consultas Supabase en componentes. Las vistas coordinan servicios, stores y presentación.
- Un módulo nuevo debe incluir tipos, validación, servicio, vista/componentes y ruta según corresponda.
- Reutilice componentes de `src/components/ui` antes de crear variantes.

## Supabase y seguridad

- Solo `VITE_SUPABASE_URL` y la clave `anon`/publicable pueden existir en el frontend. Nunca exponga `service_role`, claves secretas o credenciales PostgreSQL.
- Toda tabla expuesta debe tener RLS habilitado y políticas de mínimo privilegio. Los guards de Vue mejoran UX, pero RLS es la autorización real.
- No use `raw_user_meta_data` ni `user_metadata` para autorizar. El rol se almacena en `public.perfiles`; solo administradores pueden cambiarlo.
- Funciones `SECURITY DEFINER` deben fijar `search_path`, validar `auth.uid()` y tener permisos de ejecución revocados de `PUBLIC`.
- Los cambios DDL requieren una migración. No edite una migración aplicada: cree una nueva.
- Operaciones de múltiples pasos (p. ej. crear pedido y descontar stock) deben ser transaccionales mediante función SQL/Edge Function.
- La creación administrativa de usuarios debe pasar por `admin-create-client`; nunca importe una clave de servicio en Vue.
- Las tablas de gestión nuevas deben integrar `ExportButtons` con columnas explícitas y datos filtrados de la vista.

## Autenticación y autorización

- Inicialice la sesión una vez desde `auth.store.ts` y conserve el listener `onAuthStateChange` sin consultas asíncronas dentro del callback.
- Rutas `meta.auth` exigen sesión; `meta.admin` exige perfil administrador.
- Los clientes solo pueden consultar y modificar sus propios datos y pedidos. Los administradores gestionan catálogo, pedidos y perfiles.

## Errores y validación

- Valide entradas con Zod antes de llamar servicios.
- Los servicios lanzan errores; la vista los presenta mediante el store de notificaciones.
- No muestre secretos, tokens ni trazas internas. Mantenga mensajes comprensibles y preserve el error técnico en logs de desarrollo cuando sea necesario.
- Estados de carga, vacío, error y éxito son obligatorios en vistas con datos remotos.

## Calidad

Antes de entregar cambios ejecute:

```bash
npm run typecheck
npm run lint
npm run build
```

Pruebe manualmente registro/ingreso, guards de cliente y administrador, CRUD afectado y comportamiento móvil. Mantenga el lockfile versionado y dependencias fijadas. No elimine archivos o migraciones sin revisar referencias y alcance.
