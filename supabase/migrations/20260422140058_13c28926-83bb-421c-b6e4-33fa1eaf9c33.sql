-- Allow all authenticated users to view all activities and attendees
DROP POLICY IF EXISTS "Users can view their own activities" ON public.activities;
DROP POLICY IF EXISTS "Admins can view all activities" ON public.activities;

CREATE POLICY "Authenticated users can view all activities"
ON public.activities
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Users can view attendees of their activities" ON public.activity_attendees;
DROP POLICY IF EXISTS "Admins can view all attendees" ON public.activity_attendees;

CREATE POLICY "Authenticated users can view all attendees"
ON public.activity_attendees
FOR SELECT
TO authenticated
USING (true);