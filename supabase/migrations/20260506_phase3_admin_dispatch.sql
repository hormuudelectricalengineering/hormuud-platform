-- Phase 3: Admin-Controlled Dispatch Platform
-- Migration: 20260506_phase3_admin_dispatch.sql
-- Purpose: Add columns and tables for admin-controlled job assignment

-- ============================================================================
-- 1. ALTER ENGINEERS TABLE
-- ============================================================================

ALTER TABLE public.engineers ADD COLUMN IF NOT EXISTS is_busy BOOLEAN DEFAULT FALSE;
ALTER TABLE public.engineers ADD COLUMN IF NOT EXISTS registered_by_admin_id UUID REFERENCES auth.users(id);
ALTER TABLE public.engineers ADD COLUMN IF NOT EXISTS license_document_url TEXT;
ALTER TABLE public.engineers ADD COLUMN IF NOT EXISTS license_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE public.engineers ADD COLUMN IF NOT EXISTS license_verified_at TIMESTAMPTZ;
ALTER TABLE public.engineers ADD COLUMN IF NOT EXISTS full_name VARCHAR(255);
ALTER TABLE public.engineers ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE public.engineers ADD COLUMN IF NOT EXISTS bank_account_name VARCHAR(255);
ALTER TABLE public.engineers ADD COLUMN IF NOT EXISTS bank_account_number VARCHAR(50);
ALTER TABLE public.engineers ADD COLUMN IF NOT EXISTS cbe_account VARCHAR(50);
ALTER TABLE public.engineers ADD COLUMN IF NOT EXISTS specialties TEXT[];

-- ============================================================================
-- 2. ALTER JOBS TABLE
-- ============================================================================

ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS assigned_by_admin_id UUID REFERENCES auth.users(id);
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS admin_set_price DECIMAL(10,2);
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS customer_reassign_reason TEXT;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS reassign_count INT DEFAULT 0;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS est_arrival_minutes INT;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS notification_sent BOOLEAN DEFAULT FALSE;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS time_preference VARCHAR(20) DEFAULT 'asap';
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS scheduled_time TIMESTAMPTZ;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS latitude DECIMAL(10,8);
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS longitude DECIMAL(11,8);

-- Copy lat/lng to new columns
UPDATE public.jobs SET latitude = lat, longitude = lng WHERE latitude IS NULL AND longitude IS NULL;

-- ============================================================================
-- 3. ALTER PROFILES TABLE
-- ============================================================================

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email VARCHAR(255) UNIQUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS auth_method VARCHAR(20);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;

-- ============================================================================
-- 4. CREATE ENGINEER_ASSIGNMENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.engineer_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  engineer_id UUID NOT NULL REFERENCES public.engineers(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  assigned_by_admin_id UUID NOT NULL REFERENCES auth.users(id),
  assigned_price DECIMAL(10,2) NOT NULL,
  est_arrival_minutes INT,
  accepted_at TIMESTAMPTZ,
  declined_at TIMESTAMPTZ,
  decline_reason TEXT,
  reassigned_from_engineer_id UUID REFERENCES public.engineers(id),
  reassignment_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_engineer_assignments_job_id ON public.engineer_assignments(job_id);
CREATE INDEX IF NOT EXISTS idx_engineer_assignments_engineer_id ON public.engineer_assignments(engineer_id);
CREATE INDEX IF NOT EXISTS idx_engineer_assignments_assigned_at ON public.engineer_assignments(assigned_at DESC);

-- ============================================================================
-- 5. UPDATE JOB_STATUS ENUM
-- ============================================================================

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum WHERE enumlabel = 'pending_assignment'
    ) THEN
        ALTER TYPE job_status ADD VALUE 'pending_assignment' BEFORE 'assigned';
    END IF;
END $$;

-- ============================================================================
-- 6. RLS POLICIES
-- ============================================================================

ALTER TABLE public.engineer_assignments ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Engineers can view own assignments' AND schemaname = 'public') THEN
    CREATE POLICY "Engineers can view own assignments" ON public.engineer_assignments FOR SELECT USING (engineer_id IN (SELECT id FROM public.engineers WHERE user_id = auth.uid()));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admin can view all assignments' AND schemaname = 'public') THEN
    CREATE POLICY "Admin can view all assignments" ON public.engineer_assignments FOR SELECT USING (EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid()));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Customers can view own job assignments' AND schemaname = 'public') THEN
    CREATE POLICY "Customers can view own job assignments" ON public.engineer_assignments FOR SELECT USING (job_id IN (SELECT id FROM public.jobs WHERE customer_id = auth.uid()));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Only admin can create assignments' AND schemaname = 'public') THEN
    CREATE POLICY "Only admin can create assignments" ON public.engineer_assignments FOR INSERT WITH CHECK (assigned_by_admin_id = auth.uid());
  END IF;
END $$;

-- ============================================================================
-- 7. FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_admin() RETURNS BOOLEAN LANGUAGE SQL SECURITY DEFINER AS $$ SELECT EXISTS(SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid()); $$;

CREATE OR REPLACE FUNCTION public.get_available_engineers(p_service_category TEXT DEFAULT NULL, p_limit INT DEFAULT 10)
RETURNS TABLE (engineer_id UUID, name TEXT, rating NUMERIC, current_jobs INT, is_busy BOOLEAN, location JSONB)
LANGUAGE SQL SECURITY DEFINER AS $$
  SELECT e.id, COALESCE(e.full_name, 'Unknown'), e.average_rating,
    (SELECT COUNT(*) FROM public.jobs WHERE engineer_id = e.id AND status IN ('assigned', 'in_progress')),
    e.is_busy, jsonb_build_object('lat', e.current_lat, 'lng', e.current_lng)
  FROM public.engineers e
  WHERE e.license_verified = true
  ORDER BY e.average_rating DESC LIMIT p_limit;
$$;

-- ============================================================================
-- 8. INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_jobs_status_created ON public.jobs(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_customer_status ON public.jobs(customer_id, status);
CREATE INDEX IF NOT EXISTS idx_engineers_verified_online ON public.engineers(license_verified, is_online);
CREATE INDEX IF NOT EXISTS idx_engineers_busy ON public.engineers(is_busy);

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================