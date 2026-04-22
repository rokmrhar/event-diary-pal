-- INTERVENTIONS table
CREATE TABLE public.interventions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  stevilka TEXT,
  datum DATE NOT NULL,
  trajanje_od TIME NOT NULL,
  trajanje_do TIME NOT NULL,
  cas_polne_ure TEXT,
  naziv TEXT NOT NULL,
  skupina TEXT NOT NULL DEFAULT 'VSA',
  obcina TEXT NOT NULL DEFAULT 'Šempeter - Vrtojba',
  obcina_drugo TEXT,
  vodja TEXT NOT NULL,
  opombe TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.interventions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view interventions"
ON public.interventions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert their own interventions"
ON public.interventions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own interventions"
ON public.interventions FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins can update all interventions"
ON public.interventions FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can delete their own interventions"
ON public.interventions FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins can delete all interventions"
ON public.interventions FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_interventions_updated_at
BEFORE UPDATE ON public.interventions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ATTENDEES
CREATE TABLE public.intervention_attendees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  intervention_id UUID NOT NULL REFERENCES public.interventions(id) ON DELETE CASCADE,
  person_name TEXT NOT NULL,
  prisoten BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.intervention_attendees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view intervention attendees"
ON public.intervention_attendees FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert attendees for their interventions"
ON public.intervention_attendees FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.interventions i WHERE i.id = intervention_id AND i.user_id = auth.uid()));

CREATE POLICY "Admins can insert any intervention attendees"
ON public.intervention_attendees FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can delete attendees of their interventions"
ON public.intervention_attendees FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM public.interventions i WHERE i.id = intervention_id AND i.user_id = auth.uid()));

CREATE POLICY "Admins can delete any intervention attendees"
ON public.intervention_attendees FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- VEHICLES
CREATE TABLE public.intervention_vehicles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  intervention_id UUID NOT NULL REFERENCES public.interventions(id) ON DELETE CASCADE,
  tip_vozila TEXT NOT NULL,
  klicni_znak TEXT,
  uporabljeno BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.intervention_vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view intervention vehicles"
ON public.intervention_vehicles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert vehicles for their interventions"
ON public.intervention_vehicles FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.interventions i WHERE i.id = intervention_id AND i.user_id = auth.uid()));

CREATE POLICY "Admins can insert any intervention vehicles"
ON public.intervention_vehicles FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can delete vehicles of their interventions"
ON public.intervention_vehicles FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM public.interventions i WHERE i.id = intervention_id AND i.user_id = auth.uid()));

CREATE POLICY "Admins can delete any intervention vehicles"
ON public.intervention_vehicles FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));