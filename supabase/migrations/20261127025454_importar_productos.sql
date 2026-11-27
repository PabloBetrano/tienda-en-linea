-- Registro privado para que un reintento del mismo lote no cree duplicados.
create table private.importaciones_productos (
  administrador_id uuid not null references auth.users(id) on delete cascade,
  solicitud_id uuid not null,
  huella bytea not null,
  cantidad integer not null check (cantidad between 1 and 500),
  creado_en timestamptz not null default now(),
  primary key (administrador_id, solicitud_id)
);

alter table private.importaciones_productos enable row level security;
revoke all on private.importaciones_productos from public, anon, authenticated;

create function public.importar_productos(solicitud_id uuid, productos jsonb)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  administrador uuid := auth.uid();
  cantidad integer;
  huella bytea;
  lote_previo private.importaciones_productos%rowtype;
  fila jsonb;
  posicion bigint;
  categoria bigint;
  precio_texto text;
  stock_texto text;
  url_imagen text;
begin
  if administrador is null or not private.es_administrador() then
    raise exception 'Se requiere rol administrador' using errcode = '42501';
  end if;

  if solicitud_id is null or productos is null or jsonb_typeof(productos) <> 'array' then
    raise exception 'El lote no tiene un formato válido' using errcode = '22023';
  end if;

  cantidad := jsonb_array_length(productos);
  if cantidad not between 1 and 500 or octet_length(productos::text) > 1048576 then
    raise exception 'El lote supera el tamaño permitido o no contiene productos' using errcode = '22023';
  end if;

  huella := sha256(convert_to(productos::text, 'UTF8'));
  insert into private.importaciones_productos (administrador_id, solicitud_id, huella, cantidad)
  values (administrador, solicitud_id, huella, cantidad)
  on conflict on constraint importaciones_productos_pkey do nothing;

  if not found then
    select * into strict lote_previo
    from private.importaciones_productos as lote
    where lote.administrador_id = administrador and lote.solicitud_id = importar_productos.solicitud_id;
    if lote_previo.huella <> huella then
      raise exception 'La solicitud ya corresponde a otro lote' using errcode = '22023';
    end if;
    return lote_previo.cantidad;
  end if;

  for fila, posicion in select value, ordinality from jsonb_array_elements(productos) with ordinality
  loop
    if jsonb_typeof(fila) <> 'object' then
      raise exception 'Producto %: se esperaba una fila válida', posicion using errcode = '22023';
    end if;
    if (fila - array['nombre','categoria_slug','precio','stock','activo','descripcion','imagen_url']) <> '{}'::jsonb
      or jsonb_typeof(fila -> 'nombre') is distinct from 'string'
      or jsonb_typeof(fila -> 'categoria_slug') is distinct from 'string'
      or jsonb_typeof(fila -> 'precio') is distinct from 'string'
      or jsonb_typeof(fila -> 'stock') is distinct from 'number'
      or jsonb_typeof(fila -> 'activo') is distinct from 'boolean'
      or coalesce(jsonb_typeof(fila -> 'descripcion'), 'null') not in ('string', 'null')
      or coalesce(jsonb_typeof(fila -> 'imagen_url'), 'null') not in ('string', 'null') then
      raise exception 'Producto %: hay columnas o tipos no permitidos', posicion using errcode = '22023';
    end if;

    if char_length(btrim(fila ->> 'nombre')) not between 2 and 150
      or char_length(coalesce(fila ->> 'descripcion', '')) > 2000 then
      raise exception 'Producto %: revisa el nombre o la descripción', posicion using errcode = '22023';
    end if;

    precio_texto := fila ->> 'precio';
    stock_texto := fila ->> 'stock';
    if precio_texto !~ '^[0-9]{1,10}([.][0-9]{1,2})?$' then
      raise exception 'Producto %: el precio debe ser positivo o cero y tener hasta dos decimales', posicion using errcode = '22023';
    end if;
    if stock_texto !~ '^[0-9]{1,10}$' then
      raise exception 'Producto %: el inventario debe ser un entero positivo o cero', posicion using errcode = '22023';
    end if;
    if stock_texto::bigint > 2147483647 then
      raise exception 'Producto %: el inventario supera 2147483647', posicion using errcode = '22023';
    end if;

    url_imagen := fila ->> 'imagen_url';
    if url_imagen is not null and (
      char_length(url_imagen) > 2048
      or url_imagen !~ '^https://[a-zA-Z0-9][a-zA-Z0-9.-]*(:[0-9]{1,5})?([/?#][^[:space:]\\]*)?$'
    ) then
      raise exception 'Producto %: la imagen debe usar una URL HTTPS válida', posicion using errcode = '22023';
    end if;

    select id into categoria from public.categorias
    where slug = fila ->> 'categoria_slug'
    for key share;
    if not found then
      raise exception 'Producto %: la categoría no existe', posicion using errcode = '22023';
    end if;

    insert into public.productos (categoria_id, nombre, descripcion, precio, stock, imagen_url, activo)
    values (
      categoria, btrim(fila ->> 'nombre'), nullif(btrim(fila ->> 'descripcion'), ''),
      precio_texto::numeric, stock_texto::integer, url_imagen, (fila ->> 'activo')::boolean
    );
  end loop;

  return cantidad;
end;
$$;

revoke all on function public.importar_productos(uuid, jsonb) from public, anon, authenticated;
grant execute on function public.importar_productos(uuid, jsonb) to authenticated;
