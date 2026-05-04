-- Add B/C license flags to members
ALTER TABLE public.members
  ADD COLUMN IF NOT EXISTS licenca_b boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS licenca_c boolean NOT NULL DEFAULT false;

-- Vehicle trips (potni nalogi)
CREATE TABLE IF NOT EXISTS public.vehicle_trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  vehicle_id uuid NOT NULL,
  datum date NOT NULL,
  relacija_od text NOT NULL,
  relacija_do text NOT NULL,
  km_stevec numeric,
  voznik text NOT NULL,
  opombe text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.vehicle_trips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view vehicle_trips"
  ON public.vehicle_trips FOR SELECT TO authenticated USING (true);

CREATE POLICY "Permitted can insert vehicle_trips"
  ON public.vehicle_trips FOR INSERT TO authenticated
  WITH CHECK ((auth.uid() = user_id) AND has_module_permission(auth.uid(), 'vehicles'));

CREATE POLICY "Permitted can update vehicle_trips"
  ON public.vehicle_trips FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin') OR ((auth.uid() = user_id) AND has_module_permission(auth.uid(), 'vehicles')));

CREATE POLICY "Permitted can delete vehicle_trips"
  ON public.vehicle_trips FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin') OR ((auth.uid() = user_id) AND has_module_permission(auth.uid(), 'vehicles')));

CREATE TRIGGER trg_vehicle_trips_updated
  BEFORE UPDATE ON public.vehicle_trips
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_vehicle_trips_vehicle ON public.vehicle_trips(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_trips_datum ON public.vehicle_trips(datum DESC);