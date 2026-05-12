-- Simplification Migration v2.0
-- Drops payments/ratings/old tables, adds services/custom_service_requests/messages redesign
-- Merges engineers into profiles, simplifies jobs, seeds service catalog

-- ============================================================================
-- 1. CREATE services TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  category VARCHAR(50),
  base_price DECIMAL(10,2),
  icon_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_by_admin_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. CREATE custom_service_requests TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.custom_service_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES auth.users(id),
  description TEXT NOT NULL,
  estimated_budget VARCHAR(50),
  photos TEXT[],
  status VARCHAR(50) DEFAULT 'pending',
  admin_response TEXT,
  reviewed_by_admin_id UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  job_id UUID REFERENCES public.jobs(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.custom_service_requests ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 3. ALTER profiles
-- ============================================================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMPTZ;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS deactivated_by_admin_id UUID REFERENCES auth.users(id);

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS specialties TEXT[];

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT FALSE;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMPTZ;

-- Copy must_change_password from engineers to profiles
UPDATE public.profiles p
SET
  must_change_password = COALESCE(e.must_change_password, FALSE),
  specialties = e.specialties
FROM public.engineers e
WHERE e.user_id = p.id;

-- ============================================================================
-- 4. ALTER jobs - change engineer_id ref (engineers -> profiles)
-- ============================================================================
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS engineer_profile_id UUID REFERENCES public.profiles(id);

UPDATE public.jobs
SET engineer_profile_id = e.user_id
FROM public.engineers e
WHERE jobs.engineer_id = e.id;

ALTER TABLE public.jobs DROP COLUMN IF EXISTS engineer_id CASCADE;
ALTER TABLE public.jobs RENAME COLUMN engineer_profile_id TO engineer_id;

-- Add service_id
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS service_id UUID REFERENCES public.services(id);

-- Remove pricing columns, make service_category nullable (superseded by service_id)
ALTER TABLE public.jobs DROP COLUMN IF EXISTS estimated_price;
ALTER TABLE public.jobs DROP COLUMN IF EXISTS final_price;
ALTER TABLE public.jobs DROP COLUMN IF EXISTS admin_set_price;
ALTER TABLE public.jobs ALTER COLUMN service_category DROP NOT NULL;

-- Add completion tracking
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS completed_by VARCHAR(20);

-- ============================================================================
-- 5. DROP & RECREATE messages (old job-scoped -> user-to-user)
-- ============================================================================
DROP TABLE IF EXISTS public.messages CASCADE;

CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id),
  recipient_id UUID NOT NULL REFERENCES auth.users(id),
  message_text TEXT,
  message_type VARCHAR(20) DEFAULT 'text',
  image_url TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  job_id UUID REFERENCES public.jobs(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 6. SIMPLIFY engineer_assignments
-- ============================================================================
ALTER TABLE public.engineer_assignments DROP COLUMN IF EXISTS assigned_price;
ALTER TABLE public.engineer_assignments DROP COLUMN IF EXISTS est_arrival_minutes;

-- Update FK reference from engineers -> profiles
ALTER TABLE public.engineer_assignments ADD COLUMN IF NOT EXISTS engineer_profile_id UUID REFERENCES public.profiles(id);

UPDATE public.engineer_assignments
SET engineer_profile_id = e.user_id
FROM public.engineers e
WHERE engineer_assignments.engineer_id = e.id;

ALTER TABLE public.engineer_assignments DROP COLUMN IF EXISTS engineer_id CASCADE;
ALTER TABLE public.engineer_assignments RENAME COLUMN engineer_profile_id TO engineer_id;

-- Same for reassigned_from_engineer_id
ALTER TABLE public.engineer_assignments ADD COLUMN IF NOT EXISTS reassigned_from_profile_id UUID REFERENCES public.profiles(id);

UPDATE public.engineer_assignments
SET reassigned_from_profile_id = e.user_id
FROM public.engineers e
WHERE engineer_assignments.reassigned_from_engineer_id = e.id;

ALTER TABLE public.engineer_assignments DROP COLUMN IF EXISTS reassigned_from_engineer_id CASCADE;
ALTER TABLE public.engineer_assignments RENAME COLUMN reassigned_from_profile_id TO reassigned_from_engineer_id;

-- ============================================================================
-- 7. DROP old tables
-- ============================================================================
DROP TABLE IF EXISTS public.payments CASCADE;
DROP TABLE IF EXISTS public.ratings CASCADE;
DROP TABLE IF EXISTS public.favorite_engineers CASCADE;
DROP TABLE IF EXISTS public.saved_locations CASCADE;
DROP TABLE IF EXISTS public.credential_change_requests CASCADE;
DROP TABLE IF EXISTS public.engineers CASCADE;

-- ============================================================================
-- 8. DROP unused types and functions
-- ============================================================================
DROP TYPE IF EXISTS public.payment_method;
DROP TYPE IF EXISTS public.payment_status;

-- Remove function that references old engineers table
DROP FUNCTION IF EXISTS public.get_available_engineers;

-- ============================================================================
-- 9. CLEAN UP OLD INDEXES (reference dropped columns/tables)
-- ============================================================================
DROP INDEX IF EXISTS idx_engineers_verified_online;
DROP INDEX IF EXISTS idx_engineers_busy;

-- ============================================================================
-- 10. RLS POLICIES
-- ============================================================================

-- Services
DROP POLICY IF EXISTS "Anyone can view active services" ON public.services;
CREATE POLICY "Anyone can view active services" ON public.services
  FOR SELECT USING (is_active = TRUE);

DROP POLICY IF EXISTS "Admin can manage services" ON public.services;
CREATE POLICY "Admin can manage services" ON public.services
  FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Custom service requests
DROP POLICY IF EXISTS "Customers can view own custom requests" ON public.custom_service_requests;
CREATE POLICY "Customers can view own custom requests" ON public.custom_service_requests
  FOR SELECT USING (customer_id = auth.uid());

DROP POLICY IF EXISTS "Customers can create custom requests" ON public.custom_service_requests;
CREATE POLICY "Customers can create custom requests" ON public.custom_service_requests
  FOR INSERT WITH CHECK (customer_id = auth.uid());

DROP POLICY IF EXISTS "Admin can view all custom requests" ON public.custom_service_requests;
CREATE POLICY "Admin can view all custom requests" ON public.custom_service_requests
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Admin can manage custom requests" ON public.custom_service_requests;
CREATE POLICY "Admin can manage custom requests" ON public.custom_service_requests
  FOR UPDATE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Messages
DROP POLICY IF EXISTS "Users can view messages they sent or received" ON public.messages;
CREATE POLICY "Users can view messages they sent or received" ON public.messages
  FOR SELECT USING (sender_id = auth.uid() OR recipient_id = auth.uid());

DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
CREATE POLICY "Users can send messages" ON public.messages
  FOR INSERT WITH CHECK (sender_id = auth.uid());

DROP POLICY IF EXISTS "Recipients can mark messages as read" ON public.messages;
CREATE POLICY "Recipients can mark messages as read" ON public.messages
  FOR UPDATE USING (recipient_id = auth.uid());

-- Profiles (admin can read all, users read/update own)
DROP POLICY IF EXISTS "Admin view all profiles" ON public.profiles;
CREATE POLICY "Admin view all profiles" ON public.profiles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (id = auth.uid());

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (id = auth.uid());

DROP POLICY IF EXISTS "Admin can insert profiles" ON public.profiles;
CREATE POLICY "Admin can insert profiles" ON public.profiles
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Jobs (simplified)
DROP POLICY IF EXISTS "Admin view all jobs" ON public.jobs;
CREATE POLICY "Admin view all jobs" ON public.jobs
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Customers view own jobs" ON public.jobs;
CREATE POLICY "Customers view own jobs" ON public.jobs
  FOR SELECT USING (customer_id = auth.uid());

DROP POLICY IF EXISTS "Engineers view assigned jobs" ON public.jobs;
CREATE POLICY "Engineers view assigned jobs" ON public.jobs
  FOR SELECT USING (engineer_id = auth.uid());

DROP POLICY IF EXISTS "Customers can create jobs" ON public.jobs;
CREATE POLICY "Customers can create jobs" ON public.jobs
  FOR INSERT WITH CHECK (customer_id = auth.uid());

DROP POLICY IF EXISTS "Users can update jobs" ON public.jobs;
CREATE POLICY "Users can update jobs" ON public.jobs
  FOR UPDATE USING (
    customer_id = auth.uid()
    OR engineer_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Engineer assignments (simplified)
DROP POLICY IF EXISTS "Engineers can view own assignments" ON public.engineer_assignments;
CREATE POLICY "Engineers can view own assignments" ON public.engineer_assignments
  FOR SELECT USING (engineer_id = auth.uid());

DROP POLICY IF EXISTS "Admin can view all assignments" ON public.engineer_assignments;
CREATE POLICY "Admin can view all assignments" ON public.engineer_assignments
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Customers can view own job assignments" ON public.engineer_assignments;
CREATE POLICY "Customers can view own job assignments" ON public.engineer_assignments
  FOR SELECT USING (job_id IN (SELECT id FROM public.jobs WHERE customer_id = auth.uid()));

DROP POLICY IF EXISTS "Only admin can create assignments" ON public.engineer_assignments;
CREATE POLICY "Only admin can create assignments" ON public.engineer_assignments
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- ============================================================================
-- 11. SEED SERVICES
-- ============================================================================
INSERT INTO public.services (name, description, category, base_price, icon_url) VALUES
  ('AC Installation', 'Professional installation of air conditioning units for home and office', 'AC', 150.00, 'snowflake'),
  ('AC Repair', 'Diagnosis and repair of faulty air conditioning systems', 'AC', 80.00, 'thermometer'),
  ('AC Maintenance', 'Regular maintenance and cleaning of AC units', 'AC', 50.00, 'tool'),
  ('Electrical Repair', 'Fix electrical issues including short circuits and power outages', 'Wiring', 60.00, 'zap'),
  ('Full Wiring', 'Complete electrical wiring for new buildings or renovations', 'Wiring', 300.00, 'grid'),
  ('Solar Panel Installation', 'Install solar panel systems for residential and commercial use', 'Solar', 500.00, 'sun'),
  ('Solar Maintenance', 'Maintenance and cleaning of solar panel systems', 'Solar', 100.00, 'sun-dim'),
  ('Generator Repair', 'Diagnosis and repair of generator issues', 'Generator', 120.00, 'loader'),
  ('Generator Installation', 'Professional installation of backup generators', 'Generator', 200.00, 'fuel'),
  ('Safety Inspection', 'Comprehensive electrical safety inspection for properties', 'Safety', 50.00, 'shield')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 12. HELPERS FOR BADGE NOTIFICATIONS
-- ============================================================================

-- Get unread message count for a user
CREATE OR REPLACE FUNCTION public.get_unread_message_count(p_user_id UUID)
RETURNS INT
LANGUAGE SQL SECURITY DEFINER AS $$
  SELECT COUNT(*)::INT
  FROM public.messages
  WHERE recipient_id = p_user_id AND is_read = FALSE;
$$;

-- Get pending job count for admin
CREATE OR REPLACE FUNCTION public.get_pending_job_count()
RETURNS INT
LANGUAGE SQL SECURITY DEFINER AS $$
  SELECT COUNT(*)::INT
  FROM public.jobs
  WHERE status = 'pending';
$$;

-- ============================================================================
-- 13. REALTIME PUBLICATION
-- ============================================================================
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.services;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
