-- ==============================================================================
-- ZETATHON - MIGRATION 003: HACKATHON SELECTION WORKFLOW, PPT STORAGE & AUDIT LOGS
-- ==============================================================================

-- 1. Extend teams status constraint to include new selection workflow states
DO $$
BEGIN
    ALTER TABLE public.teams DROP CONSTRAINT IF EXISTS teams_status_check;
    ALTER TABLE public.teams ADD CONSTRAINT teams_status_check 
        CHECK (status IN (
            'pending_review', 
            'shortlisted', 
            'waitlisted', 
            'not_shortlisted', 
            'pending_verification', 
            'pending_approval', 
            'pending', 
            'approved', 
            'rejected'
        ));
EXCEPTION
    WHEN undefined_table THEN
        NULL;
END $$;

-- 2. Add selection workflow, PPT storage, audit log, and email status columns
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS registration_id TEXT;
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS ppt_file JSONB;
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS audit_log JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS email_status JSONB DEFAULT '{}'::jsonb;

-- 3. Unique index on registration_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_teams_registration_id 
    ON public.teams (registration_id);

-- 4. Status filter index
CREATE INDEX IF NOT EXISTS idx_teams_status 
    ON public.teams (status);

COMMENT ON COLUMN public.teams.registration_id IS 'Unique public registration reference identifier (e.g. ZETA-2026-X1Y2Z).';
COMMENT ON COLUMN public.teams.ppt_file IS 'Metadata for verified project presentation PPT / PDF upload.';
COMMENT ON COLUMN public.teams.audit_log IS 'Immutable log of administrative status transitions with author and timestamp.';
COMMENT ON COLUMN public.teams.email_status IS 'Delivery and retry tracking for transactional registration and selection emails.';
