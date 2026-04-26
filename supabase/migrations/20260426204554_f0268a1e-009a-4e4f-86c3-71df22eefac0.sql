-- 1. medical_checks
CREATE TABLE public.medical_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  member_name text NOT NULL,
  zadnji_pregled date,
  naslednji_pregled date,
  opombe text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.medical_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view medical_checks"
  ON public.medical_checks FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can insert medical_checks"
  ON public.medical_checks FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) AND auth.uid() = user_id);

CREATE POLICY "Admins can update medical_checks"
  ON public.medical_checks FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete medical_checks"
  ON public.medical_checks FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_medical_checks_updated_at
  BEFORE UPDATE ON public.medical_checks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. app_settings (single-row config)
CREATE TABLE public.app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  smtp_host text,
  smtp_port integer DEFAULT 587,
  smtp_user text,
  smtp_pass text,
  smtp_from text,
  smtp_from_name text DEFAULT 'PGD Vrtojba',
  smtp_secure boolean DEFAULT false,
  reminder_recipients text[] DEFAULT ARRAY[]::text[],
  reminder_days_before integer DEFAULT 14,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view app_settings"
  ON public.app_settings FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert app_settings"
  ON public.app_settings FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update app_settings"
  ON public.app_settings FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- seed empty row
INSERT INTO public.app_settings (id) VALUES (gen_random_uuid());

-- 3. medical_reminder_log
CREATE TABLE public.medical_reminder_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  medical_check_id uuid NOT NULL REFERENCES public.medical_checks(id) ON DELETE CASCADE,
  naslednji_pregled date NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now(),
  recipients text[] NOT NULL DEFAULT ARRAY[]::text[],
  UNIQUE (medical_check_id, naslednji_pregled)
);

ALTER TABLE public.medical_reminder_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view reminder_log"
  ON public.medical_reminder_log FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));