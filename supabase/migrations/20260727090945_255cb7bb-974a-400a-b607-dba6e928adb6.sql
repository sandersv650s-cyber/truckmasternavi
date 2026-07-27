
REVOKE EXECUTE ON FUNCTION public.is_admin(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_blocked_pair(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_convoy_member(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_conversation_participant(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.conversation_has_block(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.purge_expired_convoy_locations() FROM anon, authenticated;
