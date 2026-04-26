ALTER TABLE public.ida_vozila
  ADD COLUMN IF NOT EXISTS hrbtisce_id uuid REFERENCES public.ida_hrbtisca(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS pljucni_avtomat_id uuid REFERENCES public.ida_pljucni_avtomati(id) ON DELETE SET NULL;