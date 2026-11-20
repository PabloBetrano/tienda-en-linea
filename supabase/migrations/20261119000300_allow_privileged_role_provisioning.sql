-- Permite aprovisionar roles desde cuentas internas de Supabase sin debilitar el acceso del cliente.
create or replace function private.proteger_rol_perfil()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.rol is distinct from old.rol
     and current_user not in ('postgres', 'service_role', 'supabase_admin')
     and not private.es_administrador() then
    raise exception 'Solo un administrador puede modificar roles' using errcode = '42501';
  end if;
  return new;
end;
$$;

revoke all on function private.proteger_rol_perfil() from public, anon;
grant execute on function private.proteger_rol_perfil() to authenticated;
