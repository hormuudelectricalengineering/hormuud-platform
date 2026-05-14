-- Migration: 20260514000001_admin_update_profiles.sql
-- Allow admin to update any profile row (required for activate/deactivate)

DROP POLICY IF EXISTS "Admin can update profiles" ON public.profiles;
CREATE POLICY "Admin can update profiles" ON public.profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
