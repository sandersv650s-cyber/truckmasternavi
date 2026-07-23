CREATE TABLE public.alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category text NOT NULL,
  location text NOT NULL,
  text text NOT NULL,
  confirms_count integer NOT NULL DEFAULT 0,
  not_actual_count integer NOT NULL DEFAULT 0,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX alerts_created_at_idx ON public.alerts (created_at DESC);

GRANT SELECT ON public.alerts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.alerts TO authenticated;
GRANT ALL ON public.alerts TO service_role;

ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "alerts viewable by everyone" ON public.alerts FOR SELECT USING (true);
CREATE POLICY "authenticated create alerts" ON public.alerts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users delete own alerts" ON public.alerts FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "users update own alerts" ON public.alerts FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.alert_votes (
  alert_id uuid NOT NULL REFERENCES public.alerts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vote text NOT NULL CHECK (vote IN ('confirm','not_actual')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (alert_id, user_id)
);

GRANT SELECT ON public.alert_votes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.alert_votes TO authenticated;
GRANT ALL ON public.alert_votes TO service_role;

ALTER TABLE public.alert_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "votes viewable by everyone" ON public.alert_votes FOR SELECT USING (true);
CREATE POLICY "authenticated vote" ON public.alert_votes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users remove own vote" ON public.alert_votes FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "users change own vote" ON public.alert_votes FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.tg_alert_votes_count()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE delta_confirm int := 0; delta_not int := 0;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.vote = 'confirm' THEN delta_confirm := 1; ELSE delta_not := 1; END IF;
    UPDATE public.alerts SET confirms_count = confirms_count + delta_confirm, not_actual_count = not_actual_count + delta_not WHERE id = NEW.alert_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.vote = 'confirm' THEN delta_confirm := -1; ELSE delta_not := -1; END IF;
    UPDATE public.alerts SET confirms_count = GREATEST(0, confirms_count + delta_confirm), not_actual_count = GREATEST(0, not_actual_count + delta_not) WHERE id = OLD.alert_id;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.vote <> OLD.vote THEN
      IF NEW.vote = 'confirm' THEN
        UPDATE public.alerts SET confirms_count = confirms_count + 1, not_actual_count = GREATEST(0, not_actual_count - 1) WHERE id = NEW.alert_id;
      ELSE
        UPDATE public.alerts SET not_actual_count = not_actual_count + 1, confirms_count = GREATEST(0, confirms_count - 1) WHERE id = NEW.alert_id;
      END IF;
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END $$;

CREATE TRIGGER alert_votes_count_trg
AFTER INSERT OR UPDATE OR DELETE ON public.alert_votes
FOR EACH ROW EXECUTE FUNCTION public.tg_alert_votes_count();