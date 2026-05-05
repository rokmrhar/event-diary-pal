ALTER TABLE public.vehicle_trips ADD COLUMN IF NOT EXISTS relacija_do2 text;
ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS inspection_recipients text[] NOT NULL DEFAULT ARRAY[]::text[];
ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS inspection_days_before integer DEFAULT 14;