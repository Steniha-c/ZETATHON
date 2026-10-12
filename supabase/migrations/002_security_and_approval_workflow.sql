-- ==============================================================================
-- ZETATHON - MIGRATION 002: SECURITY, EMAIL VERIFICATION & APPROVAL WORKFLOW
-- ==============================================================================

-- 1. Extend teams status constraint to include new approval workflow states
DO $$
BEGIN
    ALTER TABLE public.teams DROP CONSTRAINT IF EXISTS teams_status_check;
    ALTER TABLE public.teams ADD CONSTRAINT teams_status_check 
        CHECK (status IN ('pending_verification', 'pending_approval', 'pending', 'approved', 'waitlisted', 'rejected'));
EXCEPTION
    WHEN undefined_table THEN
        NULL;
END $$;

-- 2. Add audit and verification columns to teams if they do not exist
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS approved_by TEXT;
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- 3. Case and whitespace normalized unique indexes to prevent duplicate registrations
CREATE UNIQUE INDEX IF NOT EXISTS idx_teams_normalized_name 
    ON public.teams (LOWER(TRIM(name)));

CREATE UNIQUE INDEX IF NOT EXISTS idx_teams_normalized_leader_email 
    ON public.teams (LOWER(TRIM(leader_email)));

CREATE INDEX IF NOT EXISTS idx_team_members_normalized_email 
    ON public.team_members (LOWER(TRIM(email)));

-- 4. Email OTP Verification Table
CREATE TABLE IF NOT EXISTS public.email_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    otp_hash TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    attempts INT DEFAULT 0,
    resend_count INT DEFAULT 0,
    last_sent_at TIMESTAMPTZ DEFAULT NOW(),
    verified_at TIMESTAMPTZ,
    registration_payload JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_verifications_email 
    ON public.email_verifications (LOWER(TRIM(email)));

CREATE INDEX IF NOT EXISTS idx_email_verifications_expires_at 
    ON public.email_verifications (expires_at);

COMMENT ON TABLE public.email_verifications IS 'Stores cryptographically hashed registration OTPs and audit timestamps.';
