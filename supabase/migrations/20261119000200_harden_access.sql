-- Corrige advertencias del linter y consolida políticas de lectura equivalentes.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;

drop policy if exists productos_publicos_activos on public.productos;
drop policy if exists productos_admin_leer_todos on public.productos;
create policy productos_lectura on public.productos for select to anon
using (activo);
create policy productos_lectura_autenticada on public.productos for select to authenticated
using (activo or (select private.es_administrador()));

drop policy if exists pedidos_leer_propios on public.pedidos;
drop policy if exists pedidos_admin_leer on public.pedidos;
create policy pedidos_lectura on public.pedidos for select to authenticated
using ((select auth.uid()) = perfil_id or (select private.es_administrador()));

drop policy if exists detalles_leer_propios on public.detalle_pedido;
drop policy if exists detalles_admin_leer on public.detalle_pedido;
create policy detalles_lectura on public.detalle_pedido for select to authenticated
using (
  (select private.es_administrador())
  or exists (
    select 1 from public.pedidos
    where pedidos.id = detalle_pedido.pedido_id
      and pedidos.perfil_id = (select auth.uid())
  )
);
