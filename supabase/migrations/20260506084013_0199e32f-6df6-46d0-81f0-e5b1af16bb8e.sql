
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS email text;

CREATE TABLE IF NOT EXISTS public.medical_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  member_name text NOT NULL,
  member_email text,
  medical_check_id uuid,
  planned_date date NOT NULL,
  location text,
  opombe text,
  reminder_sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.medical_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View medical_plans with permission" ON public.medical_plans FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) OR has_module_permission(auth.uid(),'medical_view'));
CREATE POLICY "Insert medical_plans with edit" ON public.medical_plans FOR INSERT TO authenticated
  WITH CHECK ((auth.uid() = user_id) AND (has_role(auth.uid(),'admin'::app_role) OR has_module_permission(auth.uid(),'medical_edit')));
CREATE POLICY "Update medical_plans with edit" ON public.medical_plans FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) OR has_module_permission(auth.uid(),'medical_edit'));
CREATE POLICY "Delete medical_plans with edit" ON public.medical_plans FOR DELETE TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) OR has_module_permission(auth.uid(),'medical_edit'));

CREATE TRIGGER trg_medical_plans_updated BEFORE UPDATE ON public.medical_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.email_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  label text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  hour integer NOT NULL DEFAULT 7,
  days_before integer NOT NULL DEFAULT 14,
  interval_days integer NOT NULL DEFAULT 1,
  last_run_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.email_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage schedules" ON public.email_schedules FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role)) WITH CHECK (has_role(auth.uid(),'admin'::app_role));
CREATE TRIGGER trg_schedules_updated BEFORE UPDATE ON public.email_schedules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  subject text NOT NULL,
  body_html text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage templates" ON public.email_templates FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role)) WITH CHECK (has_role(auth.uid(),'admin'::app_role));
CREATE TRIGGER trg_templates_updated BEFORE UPDATE ON public.email_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.email_templates (key, subject, body_html) VALUES
  ('zdravniski',
   'Opomnik: zdravniški pregled poteče čez {{dni}} dni — {{ime}}',
   '<h2>Opomnik o zdravniškem pregledu</h2><p><strong>{{ime}}</strong></p><p>Naslednji zdravniški pregled: <strong>{{datum}}</strong></p><p>Število dni do preteka: <strong>{{dni}}</strong></p><hr><p style="color:#666;font-size:12px">Avtomatski opomnik aplikacije PGD.</p>'),
  ('tehnicni',
   'Opomnik: tehnični pregled poteče čez {{dni}} dni — {{vozilo}}',
   '<h2>Opomnik o tehničnem pregledu</h2><p><strong>{{vozilo}}</strong></p><p>Naslednji tehnični pregled: <strong>{{datum}}</strong></p><p>Število dni do preteka: <strong>{{dni}}</strong></p><hr><p style="color:#666;font-size:12px">Avtomatski opomnik aplikacije PGD.</p>'),
  ('nacrtovanje',
   'Načrtovan zdravniški pregled — {{datum}}',
   '<h2>Načrtovan zdravniški pregled</h2><p>Spoštovani {{ime}},</p><p>Vaš naslednji zdravniški pregled je načrtovan za <strong>{{datum}}</strong>.</p><p>Lokacija: <strong>{{lokacija}}</strong></p><p>Opombe: {{opombe}}</p><hr><p style="color:#666;font-size:12px">Avtomatski opomnik aplikacije PGD.</p>')
ON CONFLICT (key) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.email_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  recipient text NOT NULL,
  subject text,
  status text NOT NULL,
  error text,
  related_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.email_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view email_log" ON public.email_log FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role));

DROP POLICY IF EXISTS "Authenticated can view medical_checks" ON public.medical_checks;
DROP POLICY IF EXISTS "Admins can insert medical_checks" ON public.medical_checks;
DROP POLICY IF EXISTS "Admins can update medical_checks" ON public.medical_checks;
DROP POLICY IF EXISTS "Admins can delete medical_checks" ON public.medical_checks;

CREATE POLICY "View medical_checks with permission" ON public.medical_checks FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) OR has_module_permission(auth.uid(),'medical_view'));
CREATE POLICY "Insert medical_checks with edit" ON public.medical_checks FOR INSERT TO authenticated
  WITH CHECK ((auth.uid() = user_id) AND (has_role(auth.uid(),'admin'::app_role) OR has_module_permission(auth.uid(),'medical_edit')));
CREATE POLICY "Update medical_checks with edit" ON public.medical_checks FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) OR has_module_permission(auth.uid(),'medical_edit'));
CREATE POLICY "Delete medical_checks with edit" ON public.medical_checks FOR DELETE TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) OR has_module_permission(auth.uid(),'medical_edit'));

INSERT INTO public.email_schedules (type, label, enabled, hour, days_before, interval_days) VALUES
  ('zdravniski', 'Zdravniški pregledi (samodejno)', true, 7, 14, 1),
  ('tehnicni', 'Tehnični pregledi (samodejno)', true, 7, 14, 1),
  ('nacrtovanja', 'Načrtovani zdravniški pregledi', true, 7, 14, 1)
ON CONFLICT DO NOTHING;
