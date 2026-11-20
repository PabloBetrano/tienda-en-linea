-- Evita evaluar permisos administrativos en actualizaciones que no cambian el rol.
-- PostgREST conserva `authenticator` como current_user para llamadas con service_role,
-- por lo que también se considera el rol JWT de la solicitud privilegiada.
create or replace function private.proteger_rol_perfil()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  request_role text := nullif(current_setting('request.jwt.claim.role', true), '');
begin
  if new.rol is distinct from old.rol then
    if current_user not in ('postgres', 'service_role', 'supabase_admin')
       and coalesce(request_role, '') <> 'service_role'
       and not private.es_administrador() then
      raise exception 'Solo un administrador puede modificar roles' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

revoke all on function private.proteger_rol_perfil() from public, anon;
grant execute on function private.proteger_rol_perfil() to authenticated;
