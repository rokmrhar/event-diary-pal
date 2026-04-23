-- Major events (open scenarios)
CREATE TABLE public.major_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  naziv TEXT NOT NULL,
  vodja TEXT,
  delovni_kanali TEXT,
  opombe TEXT,
  status TEXT NOT NULL DEFAULT 'odprt',
  opened_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  closed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.major_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view major_events"
ON public.major_events FOR SELECT TO authenticated USING (true);

CREATE POLICY "Permitted can insert major_events"
ON public.major_events FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND has_module_permission(auth.uid(), 'mass_events'));

CREATE POLICY "Permitted can update major_events"
ON public.major_events FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin') OR (auth.uid() = user_id AND has_module_permission(auth.uid(), 'mass_events')));

CREATE POLICY "Permitted can delete major_events"
ON public.major_events FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin') OR (auth.uid() = user_id AND has_module_permission(auth.uid(), 'mass_events')));

CREATE TRIGGER update_major_events_updated_at
BEFORE UPDATE ON public.major_events
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Sub events inside a major event
CREATE TABLE public.major_event_dogodki (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  major_event_id UUID NOT NULL REFERENCES public.major_events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  naziv TEXT NOT NULL,
  datum DATE NOT NULL,
  ura TIME,
  lokacija TEXT,
  opis TEXT,
  vodja TEXT,
  prisotni JSONB NOT NULL DEFAULT '[]'::jsonb,
  vozila JSONB NOT NULL DEFAULT '[]'::jsonb,
  vozila_drugo TEXT,
  intervention_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.major_event_dogodki ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view major_event_dogodki"
ON public.major_event_dogodki FOR SELECT TO authenticated USING (true);

CREATE POLICY "Permitted can insert major_event_dogodki"
ON public.major_event_dogodki FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND has_module_permission(auth.uid(), 'mass_events'));

CREATE POLICY "Permitted can update major_event_dogodki"
ON public.major_event_dogodki FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin') OR (auth.uid() = user_id AND has_module_permission(auth.uid(), 'mass_events')));

CREATE POLICY "Permitted can delete major_event_dogodki"
ON public.major_event_dogodki FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin') OR (auth.uid() = user_id AND has_module_permission(auth.uid(), 'mass_events')));

CREATE TRIGGER update_major_event_dogodki_updated_at
BEFORE UPDATE ON public.major_event_dogodki
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();