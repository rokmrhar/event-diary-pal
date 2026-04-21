-- Roles enum and user_roles table (separate, secure)
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function (avoids recursive RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
ON public.user_roles FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Activities table
CREATE TABLE public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  datum DATE NOT NULL,
  aktivnost TEXT NOT NULL,
  aktivnost_drugo TEXT,
  zacetek TIME NOT NULL,
  konec TIME NOT NULL,
  kraj TEXT NOT NULL,
  opis TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own activities"
ON public.activities FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all activities"
ON public.activities FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert their own activities"
ON public.activities FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own activities"
ON public.activities FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own activities"
ON public.activities FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Attendees per activity
CREATE TABLE public.activity_attendees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID REFERENCES public.activities(id) ON DELETE CASCADE NOT NULL,
  person_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_attendees_activity ON public.activity_attendees(activity_id);
CREATE INDEX idx_attendees_person ON public.activity_attendees(person_name);

ALTER TABLE public.activity_attendees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view attendees of their activities"
ON public.activity_attendees FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.activities a
    WHERE a.id = activity_id AND a.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all attendees"
ON public.activity_attendees FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert attendees for their activities"
ON public.activity_attendees FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.activities a
    WHERE a.id = activity_id AND a.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete attendees of their activities"
ON public.activity_attendees FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.activities a
    WHERE a.id = activity_id AND a.user_id = auth.uid()
  )
);

-- Generic updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_activities_updated_at
BEFORE UPDATE ON public.activities
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-assign role on signup (first user becomes admin)
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_role
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();