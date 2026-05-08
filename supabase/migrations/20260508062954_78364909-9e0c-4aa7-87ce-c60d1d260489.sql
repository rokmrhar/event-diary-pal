
-- Unify medical_view / medical_edit into a single module 'medical' with level
-- Migrate existing permission rows
UPDATE public.user_module_permissions
SET module = 'medical', level = 'edit'
WHERE module = 'medical_edit';

-- For medical_view rows, only insert if user has no medical row yet
INSERT INTO public.user_module_permissions (user_id, module, level)
SELECT user_id, 'medical', 'view'
FROM public.user_module_permissions
WHERE module = 'medical_view'
  AND NOT EXISTS (
    SELECT 1 FROM public.user_module_permissions p2
    WHERE p2.user_id = user_module_permissions.user_id AND p2.module = 'medical'
  );

DELETE FROM public.user_module_permissions WHERE module = 'medical_view';

-- Replace RLS policies on medical_checks / medical_plans
DROP POLICY IF EXISTS "View medical_checks with permission" ON public.medical_checks;
DROP POLICY IF EXISTS "Insert medical_checks with edit" ON public.medical_checks;
DROP POLICY IF EXISTS "Update medical_checks with edit" ON public.medical_checks;
DROP POLICY IF EXISTS "Delete medical_checks with edit" ON public.medical_checks;

CREATE POLICY "View medical_checks" ON public.medical_checks FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) OR has_module_access(auth.uid(),'medical','view'));
CREATE POLICY "Insert medical_checks" ON public.medical_checks FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND (has_role(auth.uid(),'admin'::app_role) OR has_module_access(auth.uid(),'medical','edit')));
CREATE POLICY "Update medical_checks" ON public.medical_checks FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) OR has_module_access(auth.uid(),'medical','edit'));
CREATE POLICY "Delete medical_checks" ON public.medical_checks FOR DELETE TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) OR has_module_access(auth.uid(),'medical','edit'));

DROP POLICY IF EXISTS "View medical_plans with permission" ON public.medical_plans;
DROP POLICY IF EXISTS "Insert medical_plans with edit" ON public.medical_plans;
DROP POLICY IF EXISTS "Update medical_plans with edit" ON public.medical_plans;
DROP POLICY IF EXISTS "Delete medical_plans with edit" ON public.medical_plans;

CREATE POLICY "View medical_plans" ON public.medical_plans FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) OR has_module_access(auth.uid(),'medical','view'));
CREATE POLICY "Insert medical_plans" ON public.medical_plans FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND (has_role(auth.uid(),'admin'::app_role) OR has_module_access(auth.uid(),'medical','edit')));
CREATE POLICY "Update medical_plans" ON public.medical_plans FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) OR has_module_access(auth.uid(),'medical','edit'));
CREATE POLICY "Delete medical_plans" ON public.medical_plans FOR DELETE TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) OR has_module_access(auth.uid(),'medical','edit'));
