-- 1) Add level column to user_module_permissions
ALTER TABLE public.user_module_permissions
  ADD COLUMN IF NOT EXISTS level text NOT NULL DEFAULT 'edit'
  CHECK (level IN ('view','edit'));

-- Allow admins to update permission level
DROP POLICY IF EXISTS "Admins can update module permissions" ON public.user_module_permissions;
CREATE POLICY "Admins can update module permissions"
  ON public.user_module_permissions FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 2) Helper: does a user have at least the requested level for a module?
CREATE OR REPLACE FUNCTION public.has_module_access(_user_id uuid, _module text, _level text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'admin')
    OR EXISTS (
      SELECT 1 FROM public.user_module_permissions
      WHERE user_id = _user_id AND module = _module
        AND (
          _level = 'view'
          OR (_level = 'edit' AND level = 'edit')
        )
    );
$$;

-- 3) Tighten INSERT/UPDATE/DELETE policies on module tables to require 'edit' level

-- activities
DROP POLICY IF EXISTS "Permitted users can insert activities" ON public.activities;
CREATE POLICY "Permitted users can insert activities" ON public.activities
  FOR INSERT TO authenticated
  WITH CHECK ((auth.uid() = user_id) AND has_module_access(auth.uid(), 'activities', 'edit'));
DROP POLICY IF EXISTS "Permitted users can update activities" ON public.activities;
CREATE POLICY "Permitted users can update activities" ON public.activities
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'admin') OR ((auth.uid()=user_id) AND has_module_access(auth.uid(),'activities','edit')));
DROP POLICY IF EXISTS "Permitted users can delete activities" ON public.activities;
CREATE POLICY "Permitted users can delete activities" ON public.activities
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(),'admin') OR ((auth.uid()=user_id) AND has_module_access(auth.uid(),'activities','edit')));

-- activity_attendees
DROP POLICY IF EXISTS "Permitted users can insert activity attendees" ON public.activity_attendees;
CREATE POLICY "Permitted users can insert activity attendees" ON public.activity_attendees
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(),'admin') OR EXISTS (
    SELECT 1 FROM activities a WHERE a.id = activity_attendees.activity_id
      AND a.user_id = auth.uid() AND has_module_access(auth.uid(),'activities','edit')));
DROP POLICY IF EXISTS "Permitted users can delete activity attendees" ON public.activity_attendees;
CREATE POLICY "Permitted users can delete activity attendees" ON public.activity_attendees
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(),'admin') OR EXISTS (
    SELECT 1 FROM activities a WHERE a.id = activity_attendees.activity_id
      AND a.user_id = auth.uid() AND has_module_access(auth.uid(),'activities','edit')));

-- interventions
DROP POLICY IF EXISTS "Permitted users can insert interventions" ON public.interventions;
CREATE POLICY "Permitted users can insert interventions" ON public.interventions
  FOR INSERT TO authenticated
  WITH CHECK ((auth.uid()=user_id) AND has_module_access(auth.uid(),'interventions','edit'));
DROP POLICY IF EXISTS "Permitted users can update interventions" ON public.interventions;
CREATE POLICY "Permitted users can update interventions" ON public.interventions
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'admin') OR ((auth.uid()=user_id) AND has_module_access(auth.uid(),'interventions','edit')));
DROP POLICY IF EXISTS "Permitted users can delete interventions" ON public.interventions;
CREATE POLICY "Permitted users can delete interventions" ON public.interventions
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(),'admin') OR ((auth.uid()=user_id) AND has_module_access(auth.uid(),'interventions','edit')));

-- intervention_attendees / vehicles
DROP POLICY IF EXISTS "Permitted users can insert intervention attendees" ON public.intervention_attendees;
CREATE POLICY "Permitted users can insert intervention attendees" ON public.intervention_attendees
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(),'admin') OR EXISTS (
    SELECT 1 FROM interventions i WHERE i.id = intervention_attendees.intervention_id
      AND i.user_id = auth.uid() AND has_module_access(auth.uid(),'interventions','edit')));
DROP POLICY IF EXISTS "Permitted users can delete intervention attendees" ON public.intervention_attendees;
CREATE POLICY "Permitted users can delete intervention attendees" ON public.intervention_attendees
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(),'admin') OR EXISTS (
    SELECT 1 FROM interventions i WHERE i.id = intervention_attendees.intervention_id
      AND i.user_id = auth.uid() AND has_module_access(auth.uid(),'interventions','edit')));
DROP POLICY IF EXISTS "Permitted users can insert intervention vehicles" ON public.intervention_vehicles;
CREATE POLICY "Permitted users can insert intervention vehicles" ON public.intervention_vehicles
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(),'admin') OR EXISTS (
    SELECT 1 FROM interventions i WHERE i.id = intervention_vehicles.intervention_id
      AND i.user_id = auth.uid() AND has_module_access(auth.uid(),'interventions','edit')));
DROP POLICY IF EXISTS "Permitted users can delete intervention vehicles" ON public.intervention_vehicles;
CREATE POLICY "Permitted users can delete intervention vehicles" ON public.intervention_vehicles
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(),'admin') OR EXISTS (
    SELECT 1 FROM interventions i WHERE i.id = intervention_vehicles.intervention_id
      AND i.user_id = auth.uid() AND has_module_access(auth.uid(),'interventions','edit')));

-- IDA module tables
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['ida_maske','ida_hrbtisca','ida_pljucni_avtomati','ida_tlacne_posode','ida_vozila']
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'Permitted can insert '||t, t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK ((auth.uid()=user_id) AND has_module_access(auth.uid(),''ida'',''edit''))','Permitted can insert '||t, t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'Permitted can update '||t, t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (has_role(auth.uid(),''admin'') OR ((auth.uid()=user_id) AND has_module_access(auth.uid(),''ida'',''edit'')))','Permitted can update '||t, t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'Permitted can delete '||t, t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING (has_role(auth.uid(),''admin'') OR ((auth.uid()=user_id) AND has_module_access(auth.uid(),''ida'',''edit'')))','Permitted can delete '||t, t);
  END LOOP;
END $$;

-- tlacne_posode_polnjenja (cylinder_fillings)
DROP POLICY IF EXISTS "Permitted can insert polnjenja" ON public.tlacne_posode_polnjenja;
CREATE POLICY "Permitted can insert polnjenja" ON public.tlacne_posode_polnjenja
  FOR INSERT TO authenticated
  WITH CHECK ((auth.uid()=user_id) AND has_module_access(auth.uid(),'cylinder_fillings','edit'));
DROP POLICY IF EXISTS "Permitted can update polnjenja" ON public.tlacne_posode_polnjenja;
CREATE POLICY "Permitted can update polnjenja" ON public.tlacne_posode_polnjenja
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'admin') OR ((auth.uid()=user_id) AND has_module_access(auth.uid(),'cylinder_fillings','edit')));
DROP POLICY IF EXISTS "Permitted can delete polnjenja" ON public.tlacne_posode_polnjenja;
CREATE POLICY "Permitted can delete polnjenja" ON public.tlacne_posode_polnjenja
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(),'admin') OR ((auth.uid()=user_id) AND has_module_access(auth.uid(),'cylinder_fillings','edit')));

-- vehicles, vehicle_services, vehicle_inspections, vehicle_trips
DO $$
DECLARE t text; m text;
BEGIN
  FOR t, m IN VALUES
    ('vehicles','vehicles'),
    ('vehicle_services','services'),
    ('vehicle_inspections','inspections'),
    ('vehicle_trips','potni_nalog')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'Permitted can insert '||t, t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK ((auth.uid()=user_id) AND has_module_access(auth.uid(),%L,''edit''))','Permitted can insert '||t, t, m);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'Permitted can update '||t, t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (has_role(auth.uid(),''admin'') OR ((auth.uid()=user_id) AND has_module_access(auth.uid(),%L,''edit'')))','Permitted can update '||t, t, m);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'Permitted can delete '||t, t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING (has_role(auth.uid(),''admin'') OR ((auth.uid()=user_id) AND has_module_access(auth.uid(),%L,''edit'')))','Permitted can delete '||t, t, m);
  END LOOP;
END $$;

-- pranja
DROP POLICY IF EXISTS "Permitted can insert pranja" ON public.pranja;
CREATE POLICY "Permitted can insert pranja" ON public.pranja
  FOR INSERT TO authenticated
  WITH CHECK ((auth.uid()=user_id) AND has_module_access(auth.uid(),'pranja','edit'));
DROP POLICY IF EXISTS "Permitted can update pranja" ON public.pranja;
CREATE POLICY "Permitted can update pranja" ON public.pranja
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'admin') OR ((auth.uid()=user_id) AND has_module_access(auth.uid(),'pranja','edit')));
DROP POLICY IF EXISTS "Permitted can delete pranja" ON public.pranja;
CREATE POLICY "Permitted can delete pranja" ON public.pranja
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(),'admin') OR ((auth.uid()=user_id) AND has_module_access(auth.uid(),'pranja','edit')));

-- mass_events / major_event_dogodki
DROP POLICY IF EXISTS "Permitted can insert major_events" ON public.major_events;
CREATE POLICY "Permitted can insert major_events" ON public.major_events
  FOR INSERT TO authenticated
  WITH CHECK ((auth.uid()=user_id) AND has_module_access(auth.uid(),'mass_events','edit'));
DROP POLICY IF EXISTS "Permitted can update major_events" ON public.major_events;
CREATE POLICY "Permitted can update major_events" ON public.major_events
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'admin') OR ((auth.uid()=user_id) AND has_module_access(auth.uid(),'mass_events','edit')));
DROP POLICY IF EXISTS "Permitted can delete major_events" ON public.major_events;
CREATE POLICY "Permitted can delete major_events" ON public.major_events
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(),'admin') OR ((auth.uid()=user_id) AND has_module_access(auth.uid(),'mass_events','edit')));
DROP POLICY IF EXISTS "Permitted can insert major_event_dogodki" ON public.major_event_dogodki;
CREATE POLICY "Permitted can insert major_event_dogodki" ON public.major_event_dogodki
  FOR INSERT TO authenticated
  WITH CHECK ((auth.uid()=user_id) AND has_module_access(auth.uid(),'mass_events','edit'));
DROP POLICY IF EXISTS "Permitted can update major_event_dogodki" ON public.major_event_dogodki;
CREATE POLICY "Permitted can update major_event_dogodki" ON public.major_event_dogodki
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'admin') OR ((auth.uid()=user_id) AND has_module_access(auth.uid(),'mass_events','edit')));
DROP POLICY IF EXISTS "Permitted can delete major_event_dogodki" ON public.major_event_dogodki;
CREATE POLICY "Permitted can delete major_event_dogodki" ON public.major_event_dogodki
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(),'admin') OR ((auth.uid()=user_id) AND has_module_access(auth.uid(),'mass_events','edit')));

-- 4) nav_items table for editable left menu
CREATE TABLE IF NOT EXISTS public.nav_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL DEFAULT 'link' CHECK (kind IN ('link','separator')),
  label text NOT NULL,
  url text,
  icon text,
  module_key text,
  external boolean NOT NULL DEFAULT false,
  visible boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.nav_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated can view nav_items" ON public.nav_items;
CREATE POLICY "Authenticated can view nav_items" ON public.nav_items
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Admins manage nav_items" ON public.nav_items;
CREATE POLICY "Admins manage nav_items" ON public.nav_items
  FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin'))
  WITH CHECK (has_role(auth.uid(),'admin'));

DROP TRIGGER IF EXISTS trg_nav_items_updated_at ON public.nav_items;
CREATE TRIGGER trg_nav_items_updated_at
  BEFORE UPDATE ON public.nav_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default menu only if empty
INSERT INTO public.nav_items (kind, label, url, icon, module_key, external, sort_order)
SELECT * FROM (VALUES
  ('separator','Operativa', NULL, NULL, NULL, false, 10),
  ('link','POROČILO O INTERVENCIJI','/intervencija','ClipboardList','interventions',false, 20),
  ('link','VNOS AKTIVNOSTI','/aktivnost','PencilLine','activities',false, 30),
  ('link','ARHIV INTERVENCIJ','/arhiv-intervencij','Archive','interventions',false, 40),
  ('link','ARHIV AKTIVNOSTI','/arhiv-aktivnosti','Archive','activities',false, 50),
  ('link','POTNI NALOG','/potni-nalog','ClipboardList','potni_nalog',false, 60),
  ('link','DOGODEK VEČJEGA OBSEGA','/vecji-obseg','AlertCircle','mass_events',false, 70),
  ('link','SPIN','/spin','Map',NULL,false, 80),
  ('link','SERVISNA KNJIGA','/servisi','Wrench','services',false, 90),
  ('link','VOZILA','/vozila','Truck','vehicles',false, 100),
  ('link','ZDRAVNIŠKI PREGLEDI','/zdravniski-pregledi','Stethoscope','medical_view',false, 110),
  ('link','EVIDENCA IDA','/ida','ShieldCheck','ida',false, 120),
  ('link','EVIDENCA PRANJ','/pranja','Biohazard','pranja',false, 130),
  ('link','STATISTIKA','/statistika','BarChart3',NULL,false, 140),
  ('separator','V izdelavi', NULL, NULL, NULL, false, 200),
  ('link','POŽARNE STRAŽE',NULL,'Flame',NULL,false, 210)
) AS v(kind,label,url,icon,module_key,external,sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.nav_items);
