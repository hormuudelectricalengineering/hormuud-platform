-- Add admin read access policy for jobs, profiles, engineers, and payments
-- This allows the admin dashboard to read all data without authentication

-- Jobs: Allow anyone to read all jobs (for admin dashboard)
DROP POLICY IF EXISTS "Admin view all jobs" ON public.jobs;
CREATE POLICY "Admin view all jobs" ON public.jobs FOR SELECT USING (true);

-- Profiles: Allow anyone to read profiles (for admin dashboard)
DROP POLICY IF EXISTS "Admin view all profiles" ON public.profiles;
CREATE POLICY "Admin view all profiles" ON public.profiles FOR SELECT USING (true);

-- Engineers: Allow anyone to read engineers (for admin dashboard)
DROP POLICY IF EXISTS "Admin view all engineers" ON public.engineers;
CREATE POLICY "Admin view all engineers" ON public.engineers FOR SELECT USING (true);

-- Payments: Allow anyone to read payments (for admin dashboard)
DROP POLICY IF EXISTS "Admin view all payments" ON public.payments;
CREATE POLICY "Admin view all payments" ON public.payments FOR SELECT USING (true);