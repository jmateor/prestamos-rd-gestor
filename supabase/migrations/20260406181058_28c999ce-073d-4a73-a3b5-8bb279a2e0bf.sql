
-- Allow all authenticated users to view audit_log (not just admins)
DROP POLICY IF EXISTS "Admins can view audit_log" ON public.audit_log;
CREATE POLICY "Auth users can view audit_log"
  ON public.audit_log FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- Allow all authenticated users to view all profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Auth users can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- Allow all authenticated users to view all user_roles
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Auth users can view all roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);
