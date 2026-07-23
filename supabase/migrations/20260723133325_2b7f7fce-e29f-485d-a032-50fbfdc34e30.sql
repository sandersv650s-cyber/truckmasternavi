
ALTER TABLE public.saved_routes
  ADD COLUMN IF NOT EXISTS truck_profile jsonb,
  ADD COLUMN IF NOT EXISTS avoid_features text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS completed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS vehicle_axle_count integer,
  ADD COLUMN IF NOT EXISTS vehicle_axle_weight_kg integer,
  ADD COLUMN IF NOT EXISTS vehicle_trailer_count integer,
  ADD COLUMN IF NOT EXISTS vehicle_hazardous boolean NOT NULL DEFAULT false;
