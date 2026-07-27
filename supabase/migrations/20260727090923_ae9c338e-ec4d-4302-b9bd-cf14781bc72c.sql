
-- ============ helpers ============
CREATE OR REPLACE FUNCTION public.is_admin(_uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _uid AND role = 'admin')
$$;

-- ============ profiles: suspension ============
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS suspended_at timestamptz,
  ADD COLUMN IF NOT EXISTS suspended_reason text;

CREATE POLICY "admins update any profile" ON public.profiles
  FOR UPDATE TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- ============ user blocks ============
CREATE TABLE public.user_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id uuid NOT NULL,
  blocked_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (blocker_id, blocked_id),
  CHECK (blocker_id <> blocked_id)
);
GRANT SELECT, INSERT, DELETE ON public.user_blocks TO authenticated;
GRANT ALL ON public.user_blocks TO service_role;
ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "see own blocks" ON public.user_blocks FOR SELECT TO authenticated
  USING (auth.uid() = blocker_id OR auth.uid() = blocked_id OR public.is_admin(auth.uid()));
CREATE POLICY "create own blocks" ON public.user_blocks FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = blocker_id);
CREATE POLICY "delete own blocks" ON public.user_blocks FOR DELETE TO authenticated
  USING (auth.uid() = blocker_id);

CREATE OR REPLACE FUNCTION public.is_blocked_pair(_a uuid, _b uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_blocks
    WHERE (blocker_id = _a AND blocked_id = _b) OR (blocker_id = _b AND blocked_id = _a)
  )
$$;

-- ============ convoys ============
CREATE TABLE public.convoys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  leader_id uuid NOT NULL,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'planned',
  from_location text,
  to_location text,
  planned_route jsonb,
  invite_code text NOT NULL UNIQUE DEFAULT upper(substr(replace(gen_random_uuid()::text,'-',''),1,6)),
  starts_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.convoy_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  convoy_id uuid NOT NULL REFERENCES public.convoys(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'member',
  sharing_location boolean NOT NULL DEFAULT false,
  sharing_until timestamptz,
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (convoy_id, user_id)
);
CREATE TABLE public.convoy_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  convoy_id uuid NOT NULL REFERENCES public.convoys(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  speed_kmh numeric,
  heading numeric,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (convoy_id, user_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.convoys TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.convoy_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.convoy_locations TO authenticated;
GRANT ALL ON public.convoys, public.convoy_members, public.convoy_locations TO service_role;

ALTER TABLE public.convoys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.convoy_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.convoy_locations ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_convoy_member(_convoy uuid, _uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.convoy_members WHERE convoy_id = _convoy AND user_id = _uid)
$$;

CREATE POLICY "convoys visible to authenticated" ON public.convoys FOR SELECT TO authenticated USING (true);
CREATE POLICY "create own convoy" ON public.convoys FOR INSERT TO authenticated WITH CHECK (auth.uid() = leader_id);
CREATE POLICY "leader or admin updates convoy" ON public.convoys FOR UPDATE TO authenticated
  USING (auth.uid() = leader_id OR public.is_admin(auth.uid()))
  WITH CHECK (auth.uid() = leader_id OR public.is_admin(auth.uid()));
CREATE POLICY "leader or admin deletes convoy" ON public.convoys FOR DELETE TO authenticated
  USING (auth.uid() = leader_id OR public.is_admin(auth.uid()));

CREATE POLICY "members visible to convoy members" ON public.convoy_members FOR SELECT TO authenticated
  USING (public.is_convoy_member(convoy_id, auth.uid()) OR public.is_admin(auth.uid()) OR user_id = auth.uid());
CREATE POLICY "join convoy as self" ON public.convoy_members FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update own membership" ON public.convoy_members FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "leave or leader removes" ON public.convoy_members FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR public.is_admin(auth.uid())
    OR EXISTS (SELECT 1 FROM public.convoys c WHERE c.id = convoy_id AND c.leader_id = auth.uid()));

CREATE POLICY "locations visible to convoy members" ON public.convoy_locations FOR SELECT TO authenticated
  USING (expires_at > now() AND public.is_convoy_member(convoy_id, auth.uid()));
CREATE POLICY "share own location" ON public.convoy_locations FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND public.is_convoy_member(convoy_id, auth.uid()));
CREATE POLICY "update own location" ON public.convoy_locations FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete own location" ON public.convoy_locations FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.tg_convoy_leader_member()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.convoy_members (convoy_id, user_id, role)
  VALUES (NEW.id, NEW.leader_id, 'leader')
  ON CONFLICT (convoy_id, user_id) DO NOTHING;
  RETURN NEW;
END $$;
CREATE TRIGGER convoy_leader_member AFTER INSERT ON public.convoys
  FOR EACH ROW EXECUTE FUNCTION public.tg_convoy_leader_member();

CREATE TRIGGER convoys_updated_at BEFORE UPDATE ON public.convoys
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.purge_expired_convoy_locations()
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  DELETE FROM public.convoy_locations WHERE expires_at < now();
$$;

-- ============ chat ============
CREATE TABLE public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL DEFAULT 'direct',
  title text,
  convoy_id uuid REFERENCES public.convoys(id) ON DELETE CASCADE,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.conversation_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  last_read_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (conversation_id, user_id)
);
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX messages_conversation_idx ON public.messages (conversation_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversation_participants TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.messages TO authenticated;
GRANT ALL ON public.conversations, public.conversation_participants, public.messages TO service_role;

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_conversation_participant(_conv uuid, _uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.conversation_participants WHERE conversation_id = _conv AND user_id = _uid)
$$;

CREATE OR REPLACE FUNCTION public.conversation_has_block(_conv uuid, _uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.conversation_participants p
    JOIN public.user_blocks b
      ON (b.blocker_id = _uid AND b.blocked_id = p.user_id)
      OR (b.blocked_id = _uid AND b.blocker_id = p.user_id)
    WHERE p.conversation_id = _conv AND p.user_id <> _uid
  )
$$;

CREATE POLICY "participants see conversation" ON public.conversations FOR SELECT TO authenticated
  USING (public.is_conversation_participant(id, auth.uid()) OR public.is_admin(auth.uid()));
CREATE POLICY "create conversation" ON public.conversations FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);
CREATE POLICY "creator updates conversation" ON public.conversations FOR UPDATE TO authenticated
  USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);
CREATE POLICY "creator deletes conversation" ON public.conversations FOR DELETE TO authenticated
  USING (auth.uid() = created_by OR public.is_admin(auth.uid()));

CREATE POLICY "see participants of own conversations" ON public.conversation_participants FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_conversation_participant(conversation_id, auth.uid()) OR public.is_admin(auth.uid()));
CREATE POLICY "add participants" ON public.conversation_participants FOR INSERT TO authenticated
  WITH CHECK (
    NOT public.is_blocked_pair(auth.uid(), user_id)
    AND (
      user_id = auth.uid()
      OR EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND c.created_by = auth.uid())
      OR public.is_conversation_participant(conversation_id, auth.uid())
    )
  );
CREATE POLICY "update own participation" ON public.conversation_participants FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "leave conversation" ON public.conversation_participants FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "participants read messages" ON public.messages FOR SELECT TO authenticated
  USING (public.is_conversation_participant(conversation_id, auth.uid()) OR public.is_admin(auth.uid()));
CREATE POLICY "participants send messages" ON public.messages FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND public.is_conversation_participant(conversation_id, auth.uid())
    AND NOT public.conversation_has_block(conversation_id, auth.uid())
  );
CREATE POLICY "delete own message" ON public.messages FOR DELETE TO authenticated
  USING (auth.uid() = sender_id OR public.is_admin(auth.uid()));

ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.convoy_locations;

-- ============ reports ============
CREATE TABLE public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL,
  reported_user_id uuid,
  category text NOT NULL,
  details text,
  context_type text,
  context_id uuid,
  status text NOT NULL DEFAULT 'open',
  admin_notes text,
  handled_by uuid,
  handled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.reports TO authenticated;
GRANT ALL ON public.reports TO service_role;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reporter or admin reads report" ON public.reports FOR SELECT TO authenticated
  USING (auth.uid() = reporter_id OR public.is_admin(auth.uid()));
CREATE POLICY "create own report" ON public.reports FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "admins update reports" ON public.reports FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER reports_updated_at BEFORE UPDATE ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ fuel prices ============
CREATE TABLE public.fuel_stations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  brand text,
  address text,
  city text,
  country text,
  road text,
  lat double precision,
  lng double precision,
  truck_suitable boolean NOT NULL DEFAULT true,
  has_adblue boolean NOT NULL DEFAULT false,
  open_hours text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.fuel_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  station_id uuid NOT NULL REFERENCES public.fuel_stations(id) ON DELETE CASCADE,
  fuel_type text NOT NULL DEFAULT 'diesel',
  price_eur numeric(6,3) NOT NULL,
  source text NOT NULL DEFAULT 'manual',
  is_demo boolean NOT NULL DEFAULT true,
  reported_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX fuel_prices_station_idx ON public.fuel_prices (station_id, reported_at DESC);
GRANT SELECT ON public.fuel_stations, public.fuel_prices TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.fuel_stations, public.fuel_prices TO authenticated;
GRANT ALL ON public.fuel_stations, public.fuel_prices TO service_role;
ALTER TABLE public.fuel_stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fuel_prices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fuel stations public read" ON public.fuel_stations FOR SELECT USING (true);
CREATE POLICY "fuel prices public read" ON public.fuel_prices FOR SELECT USING (true);
CREATE POLICY "admins manage stations" ON public.fuel_stations FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "admins manage prices" ON public.fuel_prices FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER fuel_stations_updated_at BEFORE UPDATE ON public.fuel_stations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ terminals / distribution centers ============
CREATE TABLE public.terminals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL DEFAULT 'dc',
  address text,
  postal_code text,
  city text,
  country text NOT NULL DEFAULT 'NL',
  lat double precision,
  lng double precision,
  phone text,
  email text,
  website text,
  facilities text[] NOT NULL DEFAULT '{}',
  wait_time_notes text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.terminal_hours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  terminal_id uuid NOT NULL REFERENCES public.terminals(id) ON DELETE CASCADE,
  weekday smallint NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  opens time,
  closes time,
  closed boolean NOT NULL DEFAULT false,
  UNIQUE (terminal_id, weekday)
);
GRANT SELECT ON public.terminals, public.terminal_hours TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.terminals, public.terminal_hours TO authenticated;
GRANT ALL ON public.terminals, public.terminal_hours TO service_role;
ALTER TABLE public.terminals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.terminal_hours ENABLE ROW LEVEL SECURITY;
CREATE POLICY "terminals public read" ON public.terminals FOR SELECT USING (true);
CREATE POLICY "terminal hours public read" ON public.terminal_hours FOR SELECT USING (true);
CREATE POLICY "admins manage terminals" ON public.terminals FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "admins manage terminal hours" ON public.terminal_hours FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER terminals_updated_at BEFORE UPDATE ON public.terminals
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ audit log ============
CREATE TABLE public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  action text NOT NULL,
  target_type text,
  target_id text,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.admin_audit_log TO authenticated;
GRANT ALL ON public.admin_audit_log TO service_role;
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins read audit log" ON public.admin_audit_log FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

-- ============ user_roles: allow admins to read/manage ============
CREATE POLICY "admins read all roles" ON public.user_roles FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

-- ============ grant admin to owner account ============
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role FROM auth.users
WHERE lower(email) IN ('9ndr69pry5@privaterelay.appleid.com', 'sandersv650@me.com')
ON CONFLICT (user_id, role) DO NOTHING;

CREATE OR REPLACE FUNCTION public.grant_owner_admin_role()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.email IS NOT NULL
     AND lower(NEW.email) IN ('sandersv650@me.com', '9ndr69pry5@privaterelay.appleid.com')
     AND NEW.email_confirmed_at IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;
