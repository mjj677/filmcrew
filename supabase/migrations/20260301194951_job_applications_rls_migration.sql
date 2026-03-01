-- ============================================================
-- RLS Policy Review & Migration for job_applications
-- ============================================================
--
-- CONTEXT:
-- The job application flow now requires:
--   1. Applicants can INSERT their own applications
--   2. Applicants can SELECT their own applications (any job)
--   3. The job poster can SELECT all applications for their jobs
--   4. Company admins/owners can SELECT all applications for jobs
--      under their company's productions
--   5. The job poster OR company admin/owner can UPDATE application
--      status (pending → reviewed → accepted → rejected)
--   6. Nobody can DELETE applications
--
-- This migration drops any existing policies on job_applications
-- and recreates them properly.
-- ============================================================

-- Ensure RLS is enabled
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

-- ── Drop existing policies (safe to run even if they don't exist) ──

DROP POLICY IF EXISTS "Applicants can read own applications" ON public.job_applications;
DROP POLICY IF EXISTS "Poster can read applications for their jobs" ON public.job_applications;
DROP POLICY IF EXISTS "Applicants can create applications" ON public.job_applications;
DROP POLICY IF EXISTS "Poster can update application status" ON public.job_applications;
DROP POLICY IF EXISTS "job_applications_select_applicant" ON public.job_applications;
DROP POLICY IF EXISTS "job_applications_select_poster" ON public.job_applications;
DROP POLICY IF EXISTS "job_applications_select_company_admin" ON public.job_applications;
DROP POLICY IF EXISTS "job_applications_insert" ON public.job_applications;
DROP POLICY IF EXISTS "job_applications_update_poster" ON public.job_applications;
DROP POLICY IF EXISTS "job_applications_update_company_admin" ON public.job_applications;

-- ── SELECT: Applicant can read their own applications ──────────

CREATE POLICY "job_applications_select_applicant"
  ON public.job_applications
  FOR SELECT
  USING (applicant_id = auth.uid());

-- ── SELECT: Job poster can read all applications for their jobs ─

CREATE POLICY "job_applications_select_poster"
  ON public.job_applications
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.job_posts
      WHERE job_posts.id = job_applications.job_id
        AND job_posts.posted_by = auth.uid()
    )
  );

-- ── SELECT: Company admin/owner can read applications for jobs ──
-- under any production belonging to their company

CREATE POLICY "job_applications_select_company_admin"
  ON public.job_applications
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.job_posts
      JOIN public.productions ON productions.id = job_posts.production_id
      JOIN public.production_company_members ON production_company_members.company_id = productions.company_id
      WHERE job_posts.id = job_applications.job_id
        AND production_company_members.user_id = auth.uid()
        AND production_company_members.role IN ('owner', 'admin')
    )
  );

-- ── INSERT: Authenticated users can apply (applicant_id = self) ─

CREATE POLICY "job_applications_insert"
  ON public.job_applications
  FOR INSERT
  WITH CHECK (
    applicant_id = auth.uid()
  );

-- ── UPDATE: Job poster can update status ────────────────────────

CREATE POLICY "job_applications_update_poster"
  ON public.job_applications
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.job_posts
      WHERE job_posts.id = job_applications.job_id
        AND job_posts.posted_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.job_posts
      WHERE job_posts.id = job_applications.job_id
        AND job_posts.posted_by = auth.uid()
    )
  );

-- ── UPDATE: Company admin/owner can update status ───────────────

CREATE POLICY "job_applications_update_company_admin"
  ON public.job_applications
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.job_posts
      JOIN public.productions ON productions.id = job_posts.production_id
      JOIN public.production_company_members ON production_company_members.company_id = productions.company_id
      WHERE job_posts.id = job_applications.job_id
        AND production_company_members.user_id = auth.uid()
        AND production_company_members.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.job_posts
      JOIN public.productions ON productions.id = job_posts.production_id
      JOIN public.production_company_members ON production_company_members.company_id = productions.company_id
      WHERE job_posts.id = job_applications.job_id
        AND production_company_members.user_id = auth.uid()
        AND production_company_members.role IN ('owner', 'admin')
    )
  );

-- ── No DELETE policy — applications cannot be deleted ───────────

-- ============================================================
-- SUMMARY OF POLICIES:
--
-- SELECT:
--   ✅ Applicant reads own applications (for "My Applications" page)
--   ✅ Job poster reads all applications for their jobs
--   ✅ Company admin/owner reads applications for any job in their
--      company's productions (for applicant counts + management)
--
-- INSERT:
--   ✅ Any authenticated user can apply (applicant_id must = self)
--   ✅ Unique constraint on (job_id, applicant_id) prevents dupes
--
-- UPDATE:
--   ✅ Job poster can update status
--   ✅ Company admin/owner can update status
--
-- DELETE:
--   ❌ No delete policy — applications are permanent
--
-- NOTE: The company admin SELECT/UPDATE policies use JOINs
-- through job_posts → productions → production_company_members.
-- If these queries become slow at scale, consider creating a
-- security definer helper function like is_job_company_admin()
-- to break the chain, similar to how is_production_member()
-- works for the productions table.
-- ============================================================