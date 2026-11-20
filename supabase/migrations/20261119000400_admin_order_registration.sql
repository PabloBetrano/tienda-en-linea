-- Permite que un administrador registre un pedido para un cliente seleccionado.
create or replace function public.crear_pedido_admin(
  perfil_destino uuid,
  items jsonb
)
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
  if (select auth.uid()) is null or not private.es_administrador() then
    raise exception 'Se requiere rol administrador' using errcode = '42501';
  end if;
  if not exists (
    select 1 from public.perfiles where id = perfil_destino and rol = 'cliente'
  ) then
    raise exception 'El cliente seleccionado no existe' using errcode = '22023';
  end if;
  if items is null or jsonb_typeof(items) <> 'array' or jsonb_array_length(items) = 0 then
    raise exception 'El pedido debe contener productos' using errcode = '22023';
  end if;
  if jsonb_array_length(items) > 50 then
    raise exception 'El pedido excede el máximo de productos' using errcode = '22023';
  end if;

  insert into public.pedidos (perfil_id)
  values (perfil_destino)
  returning id into pedido_nuevo;

  for item in select value from jsonb_array_elements(items)
  loop
    cantidad_solicitada := (item ->> 'cantidad')::integer;
    if cantidad_solicitada is null or cantidad_solicitada <= 0 then
      raise exception 'Cantidad inválida' using errcode = '22023';
    end if;
    select * into producto
    from public.productos
    where id = (item ->> 'producto_id')::bigint and activo
    for update;
    if not found then
      raise exception 'Producto no disponible' using errcode = 'P0001';
    end if;
    if producto.stock < cantidad_solicitada then
      raise exception 'Inventario insuficiente para %', producto.nombre using errcode = 'P0001';
    end if;

    update public.productos
    set stock = stock - cantidad_solicitada
    where id = producto.id;
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

revoke all on function public.crear_pedido_admin(uuid, jsonb) from public, anon;
grant execute on function public.crear_pedido_admin(uuid, jsonb) to authenticated;
