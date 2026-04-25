-- 1) Add stanje_stevca_h to tlacne_posode_polnjenja
ALTER TABLE public.tlacne_posode_polnjenja
ADD COLUMN IF NOT EXISTS stanje_stevca_h numeric;

-- 2) Create pranja table
CREATE TABLE IF NOT EXISTS public.pranja (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  datum date NOT NULL,
  oprema text NOT NULL,
  programi jsonb NOT NULL DEFAULT '[]'::jsonb,
  dal_prat text NOT NULL,
  opombe text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.pranja ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view pranja"
ON public.pranja FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Permitted can insert pranja"
ON public.pranja FOR INSERT
TO authenticated
WITH CHECK ((auth.uid() = user_id) AND has_module_permission(auth.uid(), 'pranja'));

CREATE POLICY "Permitted can update pranja"
ON public.pranja FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR ((auth.uid() = user_id) AND has_module_permission(auth.uid(), 'pranja')));

CREATE POLICY "Permitted can delete pranja"
ON public.pranja FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR ((auth.uid() = user_id) AND has_module_permission(auth.uid(), 'pranja')));

CREATE TRIGGER update_pranja_updated_at
BEFORE UPDATE ON public.pranja
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();