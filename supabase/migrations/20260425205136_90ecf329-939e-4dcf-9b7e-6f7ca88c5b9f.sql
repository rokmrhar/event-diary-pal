CREATE TABLE public.ida_vozila (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  vozilo TEXT,
  ida_aparat TEXT,
  opombe TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.ida_vozila ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view ida_vozila"
ON public.ida_vozila FOR SELECT TO authenticated USING (true);

CREATE POLICY "Permitted can insert ida_vozila"
ON public.ida_vozila FOR INSERT TO authenticated
WITH CHECK ((auth.uid() = user_id) AND has_module_permission(auth.uid(), 'ida'));

CREATE POLICY "Permitted can update ida_vozila"
ON public.ida_vozila FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR ((auth.uid() = user_id) AND has_module_permission(auth.uid(), 'ida')));

CREATE POLICY "Permitted can delete ida_vozila"
ON public.ida_vozila FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR ((auth.uid() = user_id) AND has_module_permission(auth.uid(), 'ida')));

CREATE TRIGGER update_ida_vozila_updated_at
BEFORE UPDATE ON public.ida_vozila
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();