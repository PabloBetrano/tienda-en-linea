-- Esquema inicial de la tienda. Diseñado para Supabase/PostgreSQL 17.
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create table public.perfiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre text not null check (char_length(trim(nombre)) between 2 and 100),
  apellido text,
  telefono text,
  rol text not null default 'cliente' check (rol in ('cliente', 'administrador')),
  creado_en timestamptz not null default now()
);

create table public.categorias (
  id bigint generated always as identity primary key,
  nombre text not null check (char_length(trim(nombre)) >= 2),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create table public.productos (
  id bigint generated always as identity primary key,
  categoria_id bigint not null references public.categorias(id) on update cascade,
  nombre text not null check (char_length(trim(nombre)) >= 2),
  descripcion text,
  precio numeric(12,2) not null check (precio >= 0),
  stock integer not null default 0 check (stock >= 0),
  imagen_url text,
  activo boolean not null default true,
  creado_en timestamptz not null default now()
);

create table public.pedidos (
  id bigint generated always as identity primary key,
  perfil_id uuid not null references public.perfiles(id),
  estado text not null default 'pendiente' check (estado in ('pendiente', 'pagado', 'enviado', 'entregado', 'cancelado')),
  total numeric(12,2) not null default 0 check (total >= 0),
  creado_en timestamptz not null default now()
);

create table public.detalle_pedido (
  id bigint generated always as identity primary key,
  pedido_id bigint not null references public.pedidos(id) on delete cascade,
  producto_id bigint not null references public.productos(id),
  cantidad integer not null check (cantidad > 0),
  precio_unitario numeric(12,2) not null check (precio_unitario >= 0),
  unique (pedido_id, producto_id)
);

create index idx_productos_categoria on public.productos(categoria_id);
create index idx_productos_activos on public.productos(activo) where activo;
create index idx_pedidos_perfil on public.pedidos(perfil_id);
create index idx_pedidos_estado on public.pedidos(estado);
create index idx_detalle_pedido on public.detalle_pedido(pedido_id);
create index idx_detalle_producto on public.detalle_pedido(producto_id);

create or replace function private.es_administrador()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.perfiles
    where id = (select auth.uid()) and rol = 'administrador'
  );
$$;
revoke all on function private.es_administrador() from public, anon;
grant execute on function private.es_administrador() to authenticated;

create or replace function public.crear_perfil_nuevo_usuario()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.perfiles (id, nombre, apellido)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'nombre'), ''), split_part(new.email, '@', 1)),
    nullif(trim(new.raw_user_meta_data ->> 'apellido'), '')
  );
  return new;
end;
$$;
revoke all on function public.crear_perfil_nuevo_usuario() from public, anon, authenticated;

create trigger trg_auth_nuevo_usuario
after insert on auth.users
for each row execute function public.crear_perfil_nuevo_usuario();

create or replace function private.proteger_rol_perfil()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.rol is distinct from old.rol and not private.es_administrador() then
    raise exception 'Solo un administrador puede modificar roles' using errcode = '42501';
  end if;
  return new;
end;
$$;
revoke all on function private.proteger_rol_perfil() from public, anon;
grant execute on function private.proteger_rol_perfil() to authenticated;

create trigger trg_proteger_rol_perfil
before update on public.perfiles
for each row execute function private.proteger_rol_perfil();

create or replace function public.crear_pedido(items jsonb)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  pedido_nuevo bigint;
  item jsonb;
  producto public.productos%rowtype;
  cantidad_solicitada integer;
  total_pedido numeric(12,2) := 0;
begin
  if (select auth.uid()) is null then
    raise exception 'Se requiere autenticación' using errcode = '42501';
  end if;
  if items is null or jsonb_typeof(items) <> 'array' or jsonb_array_length(items) = 0 then
    raise exception 'El pedido debe contener productos' using errcode = '22023';
  end if;
  if jsonb_array_length(items) > 50 then
    raise exception 'El pedido excede el máximo de productos' using errcode = '22023';
  end if;

  insert into public.pedidos (perfil_id) values ((select auth.uid())) returning id into pedido_nuevo;

  for item in select value from jsonb_array_elements(items)
  loop
    cantidad_solicitada := (item ->> 'cantidad')::integer;
    if cantidad_solicitada is null or cantidad_solicitada <= 0 then
      raise exception 'Cantidad inválida' using errcode = '22023';
    end if;
    select * into producto from public.productos
      where id = (item ->> 'producto_id')::bigint and activo
      for update;
    if not found then
      raise exception 'Producto no disponible' using errcode = 'P0001';
    end if;
    if producto.stock < cantidad_solicitada then
      raise exception 'Inventario insuficiente para %', producto.nombre using errcode = 'P0001';
    end if;
    update public.productos set stock = stock - cantidad_solicitada where id = producto.id;
    insert into public.detalle_pedido (pedido_id, producto_id, cantidad, precio_unitario)
      values (pedido_nuevo, producto.id, cantidad_solicitada, producto.precio);
    total_pedido := total_pedido + (producto.precio * cantidad_solicitada);
  end loop;
  update public.pedidos set total = total_pedido where id = pedido_nuevo;
  return pedido_nuevo;
exception
  when unique_violation then
    raise exception 'No repita un producto en el pedido' using errcode = '22023';
end;
$$;
revoke all on function public.crear_pedido(jsonb) from public, anon;
grant execute on function public.crear_pedido(jsonb) to authenticated;

alter table public.perfiles enable row level security;
alter table public.categorias enable row level security;
alter table public.productos enable row level security;
alter table public.pedidos enable row level security;
alter table public.detalle_pedido enable row level security;

create policy perfiles_leer_propio_o_admin on public.perfiles for select to authenticated
using ((select auth.uid()) = id or (select private.es_administrador()));
create policy perfiles_actualizar_propio_o_admin on public.perfiles for update to authenticated
using ((select auth.uid()) = id or (select private.es_administrador()))
with check ((select auth.uid()) = id or (select private.es_administrador()));

create policy categorias_lectura_publica on public.categorias for select to anon, authenticated using (true);
create policy categorias_admin_insertar on public.categorias for insert to authenticated with check ((select private.es_administrador()));
create policy categorias_admin_actualizar on public.categorias for update to authenticated using ((select private.es_administrador())) with check ((select private.es_administrador()));
create policy categorias_admin_eliminar on public.categorias for delete to authenticated using ((select private.es_administrador()));

create policy productos_publicos_activos on public.productos for select to anon, authenticated using (activo);
create policy productos_admin_leer_todos on public.productos for select to authenticated using ((select private.es_administrador()));
create policy productos_admin_insertar on public.productos for insert to authenticated with check ((select private.es_administrador()));
create policy productos_admin_actualizar on public.productos for update to authenticated using ((select private.es_administrador())) with check ((select private.es_administrador()));
create policy productos_admin_eliminar on public.productos for delete to authenticated using ((select private.es_administrador()));

create policy pedidos_leer_propios on public.pedidos for select to authenticated using ((select auth.uid()) = perfil_id);
create policy pedidos_admin_leer on public.pedidos for select to authenticated using ((select private.es_administrador()));
create policy pedidos_admin_actualizar on public.pedidos for update to authenticated using ((select private.es_administrador())) with check ((select private.es_administrador()));

create policy detalles_leer_propios on public.detalle_pedido for select to authenticated
using (exists (select 1 from public.pedidos where pedidos.id = detalle_pedido.pedido_id and pedidos.perfil_id = (select auth.uid())));
create policy detalles_admin_leer on public.detalle_pedido for select to authenticated using ((select private.es_administrador()));

grant select on public.categorias, public.productos to anon;
grant select, insert, update, delete on public.categorias, public.productos to authenticated;
grant select, update on public.perfiles, public.pedidos to authenticated;
grant select on public.detalle_pedido to authenticated;
grant usage, select on all sequences in schema public to authenticated;

insert into public.categorias (nombre, slug) values
  ('Ropa para mujer', 'ropa-mujer'),
  ('Ropa para hombre', 'ropa-hombre'),
  ('Accesorios', 'accesorios')
on conflict (slug) do nothing;
