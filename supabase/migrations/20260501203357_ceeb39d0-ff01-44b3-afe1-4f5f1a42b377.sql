ALTER TABLE public.ida_vozila
  ADD COLUMN IF NOT EXISTS hrbtisce_ids uuid[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS pljucni_avtomat_ids uuid[] NOT NULL DEFAULT '{}';

UPDATE public.ida_vozila
SET hrbtisce_ids = ARRAY[hrbtisce_id]
WHERE hrbtisce_id IS NOT NULL AND (hrbtisce_ids IS NULL OR cardinality(hrbtisce_ids) = 0);

UPDATE public.ida_vozila
SET pljucni_avtomat_ids = ARRAY[pljucni_avtomat_id]
WHERE pljucni_avtomat_id IS NOT NULL AND (pljucni_avtomat_ids IS NULL OR cardinality(pljucni_avtomat_ids) = 0);