ALTER TABLE public.terminals
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'community',
  ADD COLUMN IF NOT EXISTS is_example boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'unknown';

ALTER TABLE public.fuel_stations
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'community',
  ADD COLUMN IF NOT EXISTS is_example boolean NOT NULL DEFAULT false;

UPDATE public.terminals SET is_example = true, source = 'seed' WHERE created_at < now();
UPDATE public.fuel_stations SET is_example = true, source = 'seed' WHERE created_at < now();

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='terminals' AND policyname='Staff manage terminals') THEN
    CREATE POLICY "Staff manage terminals" ON public.terminals FOR ALL TO authenticated
      USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='terminal_hours' AND policyname='Staff manage terminal hours') THEN
    CREATE POLICY "Staff manage terminal hours" ON public.terminal_hours FOR ALL TO authenticated
      USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='fuel_stations' AND policyname='Staff manage fuel stations') THEN
    CREATE POLICY "Staff manage fuel stations" ON public.fuel_stations FOR ALL TO authenticated
      USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='fuel_prices' AND policyname='Staff manage fuel prices') THEN
    CREATE POLICY "Staff manage fuel prices" ON public.fuel_prices FOR ALL TO authenticated
      USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_fuel_prices_station_reported ON public.fuel_prices (station_id, reported_at DESC);
CREATE INDEX IF NOT EXISTS idx_terminal_hours_terminal ON public.terminal_hours (terminal_id, weekday);