
CREATE TABLE public.saved_routes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  waypoints JSONB NOT NULL DEFAULT '[]'::jsonb,
  distance_m INTEGER,
  duration_s INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_routes TO authenticated;
GRANT ALL ON public.saved_routes TO service_role;
ALTER TABLE public.saved_routes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_select" ON public.saved_routes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own_insert" ON public.saved_routes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_update" ON public.saved_routes FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_delete" ON public.saved_routes FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX saved_routes_user_idx ON public.saved_routes(user_id, updated_at DESC);
CREATE TRIGGER saved_routes_set_updated BEFORE UPDATE ON public.saved_routes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS vehicle_type TEXT,
  ADD COLUMN IF NOT EXISTS vehicle_height_cm INTEGER,
  ADD COLUMN IF NOT EXISTS vehicle_width_cm INTEGER,
  ADD COLUMN IF NOT EXISTS vehicle_length_cm INTEGER,
  ADD COLUMN IF NOT EXISTS vehicle_weight_kg INTEGER;
