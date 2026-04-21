
CREATE TABLE public.members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view members"
ON public.members FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can insert members"
ON public.members FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update members"
ON public.members FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete members"
ON public.members FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_members_updated_at
BEFORE UPDATE ON public.members
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.members (name) VALUES
  ('Melissa Bajt Vodopivec'),
  ('Dimitrij Bensa'),
  ('Aljaž Bremec'),
  ('Klemen Brisko'),
  ('Leon Cijan'),
  ('Boris Cotič'),
  ('Filip Černič'),
  ('Tadej Devetak')
ON CONFLICT (name) DO NOTHING;
