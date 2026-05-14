-- Migration: 20260514000002_admin_delete_profiles.sql
-- Allow admin to delete any profile row (required for customer/engineer deletion)

DROP POLICY IF EXISTS "Admin can delete profiles" ON public.profiles;
CREATE POLICY "Admin can delete profiles" ON public.profiles
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
