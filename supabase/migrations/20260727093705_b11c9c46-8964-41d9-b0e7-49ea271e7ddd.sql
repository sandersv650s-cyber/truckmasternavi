-- Reporters must not read internal moderation notes / handler identity.
REVOKE SELECT ON public.reports FROM authenticated;
GRANT SELECT (id, reporter_id, reported_user_id, category, details, context_type, context_id,
              status, action_taken, handled_at, created_at, updated_at)
  ON public.reports TO authenticated;
GRANT INSERT, UPDATE ON public.reports TO authenticated;
GRANT ALL ON public.reports TO service_role;

-- Staff-only view exposing the full record (RLS of base table still applies).
CREATE OR REPLACE VIEW public.reports_staff
WITH (security_invoker = true) AS
  SELECT * FROM public.reports WHERE public.is_staff(auth.uid());

GRANT SELECT ON public.reports_staff TO authenticated;
GRANT ALL ON public.reports_staff TO service_role;

CREATE INDEX IF NOT EXISTS reports_reporter_created_idx
  ON public.reports (reporter_id, created_at DESC);