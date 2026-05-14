-- Add admin RLS policies
CREATE POLICY "admin_jobs_read" ON public.jobs FOR SELECT USING (true);
CREATE POLICY "admin_profiles_read" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "admin_engineers_read" ON public.engineers FOR SELECT USING (true);
CREATE POLICY "admin_payments_read" ON public.payments FOR SELECT USING (true);