
-- Helper trigger function already exists (update_updated_at_column)

-- ============ MASKE ============
CREATE TABLE public.ida_maske (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  interna_st TEXT NOT NULL,
  proizvajalec TEXT,
  model TEXT,
  serijska_st TEXT,
  datum_menjave_membrane TEXT, -- "YYYY-MM"
  datum_menjave_ventila TEXT,  -- "YYYY-MM"
  leto_izdelave INTEGER,
  datum_zadnjega_pregleda TEXT,  -- "YYYY-MM"
  datum_veljavnosti_pregleda TEXT, -- "YYYY-MM"
  opombe TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ida_maske ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view ida_maske" ON public.ida_maske
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Permitted can insert ida_maske" ON public.ida_maske
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND has_module_permission(auth.uid(), 'ida'));
CREATE POLICY "Permitted can update ida_maske" ON public.ida_maske
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin') OR (auth.uid() = user_id AND has_module_permission(auth.uid(), 'ida')));
CREATE POLICY "Permitted can delete ida_maske" ON public.ida_maske
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin') OR (auth.uid() = user_id AND has_module_permission(auth.uid(), 'ida')));

CREATE TRIGGER update_ida_maske_updated_at
  BEFORE UPDATE ON public.ida_maske
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ HRBTIŠČA ============
CREATE TABLE public.ida_hrbtisca (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  znamka TEXT,
  model TEXT,
  serijska_st TEXT,
  interna_st TEXT NOT NULL,
  leto_izdelave INTEGER,
  datum_pregleda TEXT,  -- "YYYY-MM"
  lokacija TEXT,
  opombe TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ida_hrbtisca ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view ida_hrbtisca" ON public.ida_hrbtisca
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Permitted can insert ida_hrbtisca" ON public.ida_hrbtisca
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND has_module_permission(auth.uid(), 'ida'));
CREATE POLICY "Permitted can update ida_hrbtisca" ON public.ida_hrbtisca
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin') OR (auth.uid() = user_id AND has_module_permission(auth.uid(), 'ida')));
CREATE POLICY "Permitted can delete ida_hrbtisca" ON public.ida_hrbtisca
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin') OR (auth.uid() = user_id AND has_module_permission(auth.uid(), 'ida')));

CREATE TRIGGER update_ida_hrbtisca_updated_at
  BEFORE UPDATE ON public.ida_hrbtisca
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ TLAČNE POSODE ============
CREATE TABLE public.ida_tlacne_posode (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  proizvajalec TEXT,
  vrsta TEXT, -- 'kompozit' | 'jeklena'
  serijska_st TEXT,
  interna_st TEXT NOT NULL,
  leto_proizvodnje INTEGER,
  kapaciteta_l NUMERIC,
  tlak_bar NUMERIC,
  datum_zadnjega_pregleda TEXT, -- "YYYY-MM"
  datum_veljavnosti_pregleda TEXT, -- "YYYY-MM"
  opombe TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ida_tlacne_posode ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view ida_tlacne_posode" ON public.ida_tlacne_posode
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Permitted can insert ida_tlacne_posode" ON public.ida_tlacne_posode
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND has_module_permission(auth.uid(), 'ida'));
CREATE POLICY "Permitted can update ida_tlacne_posode" ON public.ida_tlacne_posode
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin') OR (auth.uid() = user_id AND has_module_permission(auth.uid(), 'ida')));
CREATE POLICY "Permitted can delete ida_tlacne_posode" ON public.ida_tlacne_posode
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin') OR (auth.uid() = user_id AND has_module_permission(auth.uid(), 'ida')));

CREATE TRIGGER update_ida_tlacne_posode_updated_at
  BEFORE UPDATE ON public.ida_tlacne_posode
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ PLJUČNI AVTOMATI ============
CREATE TABLE public.ida_pljucni_avtomati (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  znamka TEXT,
  tip TEXT,
  serijska_st TEXT,
  naziv TEXT,
  leto_izdelave INTEGER,
  datum_zadnjega_pregleda TEXT, -- "YYYY-MM"
  datum_veljavnosti_pregleda TEXT, -- "YYYY-MM"
  lokacija TEXT,
  opombe TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ida_pljucni_avtomati ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view ida_pljucni_avtomati" ON public.ida_pljucni_avtomati
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Permitted can insert ida_pljucni_avtomati" ON public.ida_pljucni_avtomati
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND has_module_permission(auth.uid(), 'ida'));
CREATE POLICY "Permitted can update ida_pljucni_avtomati" ON public.ida_pljucni_avtomati
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin') OR (auth.uid() = user_id AND has_module_permission(auth.uid(), 'ida')));
CREATE POLICY "Permitted can delete ida_pljucni_avtomati" ON public.ida_pljucni_avtomati
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin') OR (auth.uid() = user_id AND has_module_permission(auth.uid(), 'ida')));

CREATE TRIGGER update_ida_pljucni_avtomati_updated_at
  BEFORE UPDATE ON public.ida_pljucni_avtomati
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
