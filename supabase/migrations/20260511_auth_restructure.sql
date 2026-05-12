-- Auth Restructure: Engineer password change + credential requests
-- Migration: 20260511_auth_restructure.sql

-- ============================================================================
-- 1. ADD must_change_password TO ENGINEERS
-- ============================================================================

ALTER TABLE public.engineers
  ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT TRUE;

ALTER TABLE public.engineers
  ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- ============================================================================
-- 2. CREATE CREDENTIAL_CHANGE_REQUESTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.credential_change_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engineer_id UUID NOT NULL REFERENCES public.engineers(id) ON DELETE CASCADE,
  request_type VARCHAR(20) NOT NULL CHECK (request_type IN ('email', 'password')),
  current_value VARCHAR(255),
  new_value VARCHAR(255) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by_admin_id UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_credential_requests_status
  ON public.credential_change_requests(status);

CREATE INDEX IF NOT EXISTS idx_credential_requests_engineer
  ON public.credential_change_requests(engineer_id);
