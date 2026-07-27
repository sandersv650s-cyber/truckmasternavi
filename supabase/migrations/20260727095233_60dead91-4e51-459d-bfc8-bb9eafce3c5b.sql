ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS vehicle_current_weight_kg integer,
  ADD COLUMN IF NOT EXISTS vehicle_max_permitted_weight_kg integer,
  ADD COLUMN IF NOT EXISTS vehicle_is_lzv boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS vehicle_has_exemption boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS vehicle_exemption_ref text,
  ADD COLUMN IF NOT EXISTS vehicle_exemption_expires date;

ALTER TABLE public.saved_routes
  ADD COLUMN IF NOT EXISTS is_lzv boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS vehicle_snapshot jsonb,
  ADD COLUMN IF NOT EXISTS lzv_verified boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.lzv_segments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  road text,
  city text,
  country text NOT NULL DEFAULT 'NL',
  geometry jsonb,
  direction text,
  is_connection_route boolean NOT NULL DEFAULT false,
  source text NOT NULL DEFAULT 'handmatig',
  dataset_version text,
  is_official boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.lzv_segments TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.lzv_segments TO authenticated;
GRANT ALL ON public.lzv_segments TO service_role;

ALTER TABLE public.lzv_segments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lzv_segments_select" ON public.lzv_segments
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "lzv_segments_insert_staff" ON public.lzv_segments
  FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "lzv_segments_update_staff" ON public.lzv_segments
  FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "lzv_segments_delete_staff" ON public.lzv_segments
  FOR DELETE TO authenticated USING (public.is_staff(auth.uid()));

CREATE TRIGGER set_lzv_segments_updated_at
  BEFORE UPDATE ON public.lzv_segments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();