-- Conserva el correo en el perfil público para la gestión administrativa de clientes.
alter table public.perfiles add column if not exists email text;

update public.perfiles p
set email = lower(u.email)
from auth.users u
where u.id = p.id and p.email is null;

create unique index if not exists perfiles_email_unico
on public.perfiles (lower(email))
where email is not null;

create or replace function public.crear_perfil_nuevo_usuario()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.perfiles (id, nombre, apellido, email)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'nombre'), ''), split_part(new.email, '@', 1)),
    nullif(trim(new.raw_user_meta_data ->> 'apellido'), ''),
    lower(new.email)
  );
  return new;
end;
$$;

revoke all on function public.crear_perfil_nuevo_usuario() from public, anon, authenticated;
