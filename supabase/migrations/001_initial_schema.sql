-- ==============================================================================
-- ZETATHON - 8-HOUR INTERNAL HACKATHON DATABASE SCHEMA
-- Supabase PostgreSQL Migration 001
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES & ROLES
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    department TEXT,
    year TEXT,
    college TEXT DEFAULT 'Institution of Technology',
    github_url TEXT,
    linkedin_url TEXT,
    role TEXT NOT NULL DEFAULT 'participant' CHECK (role IN ('participant', 'admin', 'mentor', 'judge')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CHALLENGES / PROBLEM STATEMENTS
CREATE TABLE IF NOT EXISTS public.challenges (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    difficulty TEXT NOT NULL CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced')),
    short_description TEXT NOT NULL,
    description TEXT NOT NULL,
    background TEXT NOT NULL,
    deliverables JSONB DEFAULT '[]'::jsonb,
    tech_suggestions JSONB DEFAULT '[]'::jsonb,
    evaluation_criteria JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TEAMS
CREATE TABLE IF NOT EXISTS public.teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    team_code TEXT UNIQUE NOT NULL,
    leader_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    leader_name TEXT NOT NULL,
    leader_email TEXT NOT NULL,
    phone TEXT NOT NULL,
    department TEXT NOT NULL,
    year TEXT NOT NULL,
    college TEXT NOT NULL,
    challenge_id TEXT REFERENCES public.challenges(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'waitlisted', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TEAM MEMBERS
CREATE TABLE IF NOT EXISTS public.team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    department TEXT,
    year TEXT,
    role TEXT NOT NULL DEFAULT 'Member' CHECK (role IN ('Leader', 'Member')),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. PROJECT SUBMISSIONS
CREATE TABLE IF NOT EXISTS public.submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID UNIQUE NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    project_title TEXT NOT NULL,
    project_description TEXT NOT NULL,
    github_url TEXT NOT NULL,
    demo_url TEXT,
    video_url TEXT,
    remarks TEXT,
    status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('draft', 'submitted', 'evaluated')),
    score NUMERIC(5,2),
    feedback TEXT,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. ANNOUNCEMENTS
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('general', 'alert', 'milestone', 'workshop')),
    is_important BOOLEAN DEFAULT FALSE,
    author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    author_name TEXT DEFAULT 'ZETA Organizing Committee',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TIMELINE EVENTS
CREATE TABLE IF NOT EXISTS public.timeline_events (
    id TEXT PRIMARY KEY,
    time TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    phase TEXT NOT NULL CHECK (phase IN ('pre', 'hacking', 'review', 'post')),
    is_milestone BOOLEAN DEFAULT FALSE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. PRIZES
CREATE TABLE IF NOT EXISTS public.prizes (
    id TEXT PRIMARY KEY,
    rank TEXT NOT NULL,
    title TEXT NOT NULL,
    amount TEXT NOT NULL,
    tagline TEXT,
    perks JSONB DEFAULT '[]'::jsonb,
    icon TEXT NOT NULL,
    color_class TEXT NOT NULL,
    sort_order INT DEFAULT 0
);

-- 9. FAQS
CREATE TABLE IF NOT EXISTS public.faqs (
    id TEXT PRIMARY KEY,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    category TEXT NOT NULL,
    sort_order INT DEFAULT 0
);

-- 10. SYSTEM SETTINGS & DYNAMIC CONFIG
CREATE TABLE IF NOT EXISTS public.hackathon_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_teams_leader ON public.teams(leader_id);
CREATE INDEX IF NOT EXISTS idx_teams_challenge ON public.teams(challenge_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team ON public.team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_submissions_team ON public.submissions(team_id);
CREATE INDEX IF NOT EXISTS idx_announcements_created ON public.announcements(created_at DESC);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timeline_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hackathon_settings ENABLE ROW LEVEL SECURITY;

-- Helper function to check if requesting user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles Policies
CREATE POLICY "Public profiles are readable by authenticated users"
    ON public.profiles FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "Admins have full access to profiles"
    ON public.profiles FOR ALL TO authenticated
    USING (public.is_admin());

-- Challenges: Everyone can read, admins can modify
CREATE POLICY "Public read challenges" ON public.challenges FOR SELECT USING (true);
CREATE POLICY "Admin write challenges" ON public.challenges FOR ALL TO authenticated USING (public.is_admin());

-- Teams: Public read basic info, team leaders can update, admins full control
CREATE POLICY "Public read teams" ON public.teams FOR SELECT USING (true);
CREATE POLICY "Team leader can update team" ON public.teams FOR UPDATE TO authenticated USING (auth.uid() = leader_id);
CREATE POLICY "Admin write teams" ON public.teams FOR ALL TO authenticated USING (public.is_admin());

-- Team Members
CREATE POLICY "Public read members" ON public.team_members FOR SELECT USING (true);
CREATE POLICY "Admin write members" ON public.team_members FOR ALL TO authenticated USING (public.is_admin());

-- Submissions: Team members or leaders can read/insert/update their submission
CREATE POLICY "Public read submissions count or summaries" ON public.submissions FOR SELECT USING (true);
CREATE POLICY "Team leader can create submission" ON public.submissions FOR INSERT TO authenticated 
    WITH CHECK (EXISTS (SELECT 1 FROM public.teams WHERE id = team_id AND leader_id = auth.uid()));
CREATE POLICY "Team leader can update submission" ON public.submissions FOR UPDATE TO authenticated 
    USING (EXISTS (SELECT 1 FROM public.teams WHERE id = team_id AND leader_id = auth.uid()));
CREATE POLICY "Admin full submissions" ON public.submissions FOR ALL TO authenticated USING (public.is_admin());

-- Announcements: Public read, admin write
CREATE POLICY "Public read announcements" ON public.announcements FOR SELECT USING (true);
CREATE POLICY "Admin write announcements" ON public.announcements FOR ALL TO authenticated USING (public.is_admin());

-- Timeline, Prizes, FAQs, Settings: Public read, admin write
CREATE POLICY "Public read timeline" ON public.timeline_events FOR SELECT USING (true);
CREATE POLICY "Admin write timeline" ON public.timeline_events FOR ALL TO authenticated USING (public.is_admin());

CREATE POLICY "Public read prizes" ON public.prizes FOR SELECT USING (true);
CREATE POLICY "Admin write prizes" ON public.prizes FOR ALL TO authenticated USING (public.is_admin());

CREATE POLICY "Public read faqs" ON public.faqs FOR SELECT USING (true);
CREATE POLICY "Admin write faqs" ON public.faqs FOR ALL TO authenticated USING (public.is_admin());

CREATE POLICY "Public read settings" ON public.hackathon_settings FOR SELECT USING (true);
CREATE POLICY "Admin write settings" ON public.hackathon_settings FOR ALL TO authenticated USING (public.is_admin());
