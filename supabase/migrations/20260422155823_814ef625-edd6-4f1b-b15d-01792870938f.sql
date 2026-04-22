-- Module permissions table
CREATE TABLE public.user_module_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  module TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, module)
);

ALTER TABLE public.user_module_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own module permissions"
ON public.user_module_permissions FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all module permissions"
ON public.user_module_permissions FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert module permissions"
ON public.user_module_permissions FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete module permissions"
ON public.user_module_permissions FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Helper function: admin OR explicit module permission
CREATE OR REPLACE FUNCTION public.has_module_permission(_user_id uuid, _module text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'admin')
    OR EXISTS (SELECT 1 FROM public.user_module_permissions WHERE user_id = _user_id AND module = _module);
$$;

-- ===== ACTIVITIES: replace owner-based write policies with module-permission-based =====
DROP POLICY IF EXISTS "Users can insert their own activities" ON public.activities;
DROP POLICY IF EXISTS "Users can update their own activities" ON public.activities;
DROP POLICY IF EXISTS "Users can delete their own activities" ON public.activities;
DROP POLICY IF EXISTS "Admins can update all activities" ON public.activities;
DROP POLICY IF EXISTS "Admins can delete all activities" ON public.activities;

CREATE POLICY "Permitted users can insert activities"
ON public.activities FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND has_module_permission(auth.uid(), 'activities'));

CREATE POLICY "Permitted users can update activities"
ON public.activities FOR UPDATE TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (auth.uid() = user_id AND has_module_permission(auth.uid(), 'activities'))
);

CREATE POLICY "Permitted users can delete activities"
ON public.activities FOR DELETE TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (auth.uid() = user_id AND has_module_permission(auth.uid(), 'activities'))
);

-- activity_attendees: align with activities permissions
DROP POLICY IF EXISTS "Users can insert attendees for their activities" ON public.activity_attendees;
DROP POLICY IF EXISTS "Users can delete attendees of their activities" ON public.activity_attendees;
DROP POLICY IF EXISTS "Admins can insert any attendees" ON public.activity_attendees;
DROP POLICY IF EXISTS "Admins can delete any attendees" ON public.activity_attendees;

CREATE POLICY "Permitted users can insert activity attendees"
ON public.activity_attendees FOR INSERT TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.activities a
    WHERE a.id = activity_id
      AND a.user_id = auth.uid()
      AND has_module_permission(auth.uid(), 'activities')
  )
);

CREATE POLICY "Permitted users can delete activity attendees"
ON public.activity_attendees FOR DELETE TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.activities a
    WHERE a.id = activity_id
      AND a.user_id = auth.uid()
      AND has_module_permission(auth.uid(), 'activities')
  )
);

-- ===== INTERVENTIONS =====
DROP POLICY IF EXISTS "Users can insert their own interventions" ON public.interventions;
DROP POLICY IF EXISTS "Users can update their own interventions" ON public.interventions;
DROP POLICY IF EXISTS "Users can delete their own interventions" ON public.interventions;
DROP POLICY IF EXISTS "Admins can update all interventions" ON public.interventions;
DROP POLICY IF EXISTS "Admins can delete all interventions" ON public.interventions;

CREATE POLICY "Permitted users can insert interventions"
ON public.interventions FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND has_module_permission(auth.uid(), 'interventions'));

CREATE POLICY "Permitted users can update interventions"
ON public.interventions FOR UPDATE TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (auth.uid() = user_id AND has_module_permission(auth.uid(), 'interventions'))
);

CREATE POLICY "Permitted users can delete interventions"
ON public.interventions FOR DELETE TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (auth.uid() = user_id AND has_module_permission(auth.uid(), 'interventions'))
);

-- intervention_attendees
DROP POLICY IF EXISTS "Users can insert attendees for their interventions" ON public.intervention_attendees;
DROP POLICY IF EXISTS "Users can delete attendees of their interventions" ON public.intervention_attendees;
DROP POLICY IF EXISTS "Admins can insert any intervention attendees" ON public.intervention_attendees;
DROP POLICY IF EXISTS "Admins can delete any intervention attendees" ON public.intervention_attendees;

CREATE POLICY "Permitted users can insert intervention attendees"
ON public.intervention_attendees FOR INSERT TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.interventions i
    WHERE i.id = intervention_id
      AND i.user_id = auth.uid()
      AND has_module_permission(auth.uid(), 'interventions')
  )
);

CREATE POLICY "Permitted users can delete intervention attendees"
ON public.intervention_attendees FOR DELETE TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.interventions i
    WHERE i.id = intervention_id
      AND i.user_id = auth.uid()
      AND has_module_permission(auth.uid(), 'interventions')
  )
);

-- intervention_vehicles
DROP POLICY IF EXISTS "Users can insert vehicles for their interventions" ON public.intervention_vehicles;
DROP POLICY IF EXISTS "Users can delete vehicles of their interventions" ON public.intervention_vehicles;
DROP POLICY IF EXISTS "Admins can insert any intervention vehicles" ON public.intervention_vehicles;
DROP POLICY IF EXISTS "Admins can delete any intervention vehicles" ON public.intervention_vehicles;

CREATE POLICY "Permitted users can insert intervention vehicles"
ON public.intervention_vehicles FOR INSERT TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.interventions i
    WHERE i.id = intervention_id
      AND i.user_id = auth.uid()
      AND has_module_permission(auth.uid(), 'interventions')
  )
);

CREATE POLICY "Permitted users can delete intervention vehicles"
ON public.intervention_vehicles FOR DELETE TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.interventions i
    WHERE i.id = intervention_id
      AND i.user_id = auth.uid()
      AND has_module_permission(auth.uid(), 'interventions')
  )
);