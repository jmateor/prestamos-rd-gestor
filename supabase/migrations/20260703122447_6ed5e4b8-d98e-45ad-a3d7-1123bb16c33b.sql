
-- Revoke public EXECUTE on SECURITY DEFINER functions and grant only to authenticated/service_role as needed

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

REVOKE EXECUTE ON FUNCTION public.usuario_puede_operar(uuid, time, smallint) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.usuario_puede_operar(uuid, time, smallint) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.empresa_abierta(time, smallint) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.empresa_abierta(time, smallint) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_updated_at_column() TO service_role;

REVOKE EXECUTE ON FUNCTION public.generate_solicitud_numero() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.generate_solicitud_numero() TO service_role;

REVOKE EXECUTE ON FUNCTION public.generate_prestamo_numero() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.generate_prestamo_numero() TO service_role;

REVOKE EXECUTE ON FUNCTION public.generate_cita_numero() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.generate_cita_numero() TO service_role;
