-- ============================================================================
-- 010: Fix Supabase Security Advisor warnings
-- ============================================================================

-- 1. Function Search Path Mutable — set search_path on all trigger functions
-- This prevents potential search_path hijacking attacks.

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = '';

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = '';

CREATE OR REPLACE FUNCTION public.blog_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = '';

-- 2. Extension in Public — move pg_trgm to extensions schema
-- Supabase provides a dedicated 'extensions' schema for this purpose.
CREATE SCHEMA IF NOT EXISTS extensions;
ALTER EXTENSION pg_trgm SET SCHEMA extensions;

-- 3. RLS Enabled No Policy — contact_submissions
-- RLS is on but no policies exist. Add explicit service-role-only insert policy
-- so the table isn't silently inaccessible.
CREATE POLICY "Service role inserts contact_submissions"
  ON public.contact_submissions
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role reads contact_submissions"
  ON public.contact_submissions
  FOR SELECT
  USING (auth.role() = 'service_role');

-- 4. RLS Policy Always True — user_polls INSERT
-- The existing "Anyone can submit a poll response" uses WITH CHECK (true).
-- First ensure voter_hash column exists (from migration 008 which may not have run).
ALTER TABLE public.user_polls ADD COLUMN IF NOT EXISTS voter_hash text;
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_polls_voter_hash
  ON public.user_polls (voter_hash) WHERE voter_hash IS NOT NULL;

-- Now tighten the INSERT policy to require a voter_hash.
DROP POLICY IF EXISTS "Anyone can submit a poll response" ON public.user_polls;
CREATE POLICY "Anyone can submit a poll response" ON public.user_polls
  FOR INSERT
  WITH CHECK (voter_hash IS NOT NULL AND voter_hash <> '');
