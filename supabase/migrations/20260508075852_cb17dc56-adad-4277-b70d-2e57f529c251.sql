
CREATE TABLE public.cms_pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  content_type TEXT NOT NULL DEFAULT 'html',
  visible BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.cms_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view visible cms_pages"
ON public.cms_pages FOR SELECT TO authenticated
USING (visible OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins manage cms_pages"
ON public.cms_pages FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_cms_pages_updated_at
BEFORE UPDATE ON public.cms_pages
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

UPDATE public.nav_items SET module_key = 'medical' WHERE module_key = 'medical_view';
