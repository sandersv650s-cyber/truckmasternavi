-- 1. Role helpers
CREATE OR REPLACE FUNCTION public.is_moderator(_uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _uid AND role = 'moderator')
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _uid AND role IN ('admin','moderator'))
$$;

-- 2. Role management (admins only)
CREATE POLICY "admins assign roles" ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "admins revoke roles" ON public.user_roles FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()) AND NOT (user_id = auth.uid() AND role = 'admin'));
GRANT INSERT, DELETE ON public.user_roles TO authenticated;

-- 3. Reports: staff access + internal notes split
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS action_taken text;

DROP POLICY IF EXISTS "reporter or admin reads report" ON public.reports;
CREATE POLICY "reporter or staff reads report" ON public.reports FOR SELECT TO authenticated
  USING (auth.uid() = reporter_id OR public.is_staff(auth.uid()));
DROP POLICY IF EXISTS "admins update reports" ON public.reports;
CREATE POLICY "staff update reports" ON public.reports FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- reporters must never read internal notes column
REVOKE SELECT ON public.reports FROM authenticated;
GRANT SELECT (id, reporter_id, reported_user_id, category, details, context_type, context_id, status, action_taken, handled_at, created_at, updated_at) ON public.reports TO authenticated;
GRANT INSERT, UPDATE ON public.reports TO authenticated;

CREATE TABLE IF NOT EXISTS public.report_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  author_id uuid NOT NULL,
  note text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.report_notes TO authenticated;
GRANT ALL ON public.report_notes TO service_role;
ALTER TABLE public.report_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read report notes" ON public.report_notes FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));
CREATE POLICY "staff write report notes" ON public.report_notes FOR INSERT TO authenticated
  WITH CHECK (public.is_staff(auth.uid()) AND auth.uid() = author_id);
CREATE POLICY "admins delete report notes" ON public.report_notes FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));
CREATE INDEX IF NOT EXISTS report_notes_report_idx ON public.report_notes(report_id, created_at DESC);

-- 4. Staff moderation on profiles (suspend/unsuspend)
DROP POLICY IF EXISTS "admins update any profile" ON public.profiles;
CREATE POLICY "staff update any profile" ON public.profiles FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- 5. Audit log writes by staff
CREATE POLICY "staff write audit log" ON public.admin_audit_log FOR INSERT TO authenticated
  WITH CHECK (public.is_staff(auth.uid()) AND auth.uid() = admin_id);
DROP POLICY IF EXISTS "admins read audit log" ON public.admin_audit_log;
CREATE POLICY "staff read audit log" ON public.admin_audit_log FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));
GRANT INSERT ON public.admin_audit_log TO authenticated;

-- 6. Terminal exceptions
CREATE TABLE IF NOT EXISTS public.terminal_exceptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  terminal_id uuid NOT NULL REFERENCES public.terminals(id) ON DELETE CASCADE,
  date date NOT NULL,
  closed boolean NOT NULL DEFAULT true,
  opens time,
  closes time,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.terminal_exceptions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.terminal_exceptions TO authenticated;
GRANT ALL ON public.terminal_exceptions TO service_role;
ALTER TABLE public.terminal_exceptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "terminal exceptions public read" ON public.terminal_exceptions FOR SELECT USING (true);
CREATE POLICY "staff manage terminal exceptions" ON public.terminal_exceptions FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE INDEX IF NOT EXISTS terminal_exceptions_terminal_idx ON public.terminal_exceptions(terminal_id, date);

-- 7. Terminal correction suggestions
CREATE TABLE IF NOT EXISTS public.terminal_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  terminal_id uuid REFERENCES public.terminals(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  field text NOT NULL,
  suggestion text NOT NULL,
  status text NOT NULL DEFAULT 'new',
  reviewed_by uuid,
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.terminal_suggestions TO authenticated;
GRANT ALL ON public.terminal_suggestions TO service_role;
ALTER TABLE public.terminal_suggestions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own or staff read suggestions" ON public.terminal_suggestions FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_staff(auth.uid()));
CREATE POLICY "create own suggestion" ON public.terminal_suggestions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "staff review suggestions" ON public.terminal_suggestions FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "admins delete suggestions" ON public.terminal_suggestions FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));
CREATE TRIGGER terminal_suggestions_updated_at BEFORE UPDATE ON public.terminal_suggestions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX IF NOT EXISTS terminal_suggestions_status_idx ON public.terminal_suggestions(status, created_at DESC);

-- 8. Staff may also manage terminals and hours (moderators included)
CREATE POLICY "staff manage terminals" ON public.terminals FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "staff manage terminal hours" ON public.terminal_hours FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- 9. Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE public.convoy_members;

-- 10. Backfill owner admin role
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'admin'::app_role FROM auth.users u
WHERE lower(u.email) IN ('sandersv650@me.com','9ndr69pry5@privaterelay.appleid.com')
ON CONFLICT (user_id, role) DO NOTHING;