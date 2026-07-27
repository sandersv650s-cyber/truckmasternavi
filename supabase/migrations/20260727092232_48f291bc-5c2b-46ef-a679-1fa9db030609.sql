REVOKE EXECUTE ON FUNCTION public.is_admin(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_moderator(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_staff(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_blocked_pair(uuid, uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_convoy_member(uuid, uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_conversation_participant(uuid, uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.conversation_has_block(uuid, uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.purge_expired_convoy_locations() FROM anon, public;

GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_moderator(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_blocked_pair(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_convoy_member(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_conversation_participant(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.conversation_has_block(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.purge_expired_convoy_locations() TO service_role;