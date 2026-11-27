create function public.contar_usuarios_registrados()
returns bigint
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)
  from auth.users as usuario
  where not usuario.is_anonymous
    and exists (
      select 1
      from auth.identities as identidad
      where identidad.user_id = usuario.id
    );
$$;

-- El login público solo puede consultar este agregado, sin acceso a las filas de Auth.
revoke all on function public.contar_usuarios_registrados() from public, anon, authenticated;
grant execute on function public.contar_usuarios_registrados() to anon, authenticated;
