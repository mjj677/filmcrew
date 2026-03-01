-- ============================================================================
-- FILMCREW: Enforce production status check on job_posts INSERT
-- ============================================================================
-- Prevents posting new jobs on productions that are wrapped or cancelled.
-- This replaces the existing enforce_job_limit() function with one that
-- also checks production status.
-- ============================================================================

CREATE OR REPLACE FUNCTION enforce_job_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id uuid;
  v_production_status production_status;
  v_max int;
  v_current int;
BEGIN
  -- Get the company and production status via the production
  SELECT p.company_id, p.status INTO v_company_id, v_production_status
  FROM productions p
  WHERE p.id = NEW.production_id
    AND p.deleted_at IS NULL;

  IF v_company_id IS NULL THEN
    RETURN NEW; -- No production linked (legacy job), skip enforcement
  END IF;

  -- Block job creation on wrapped or cancelled productions
  IF v_production_status IN ('wrapped', 'cancelled') THEN
    RAISE EXCEPTION 'Cannot post jobs on a % production', v_production_status
      USING ERRCODE = 'check_violation';
  END IF;

  -- Existing tier limit enforcement
  SELECT max_active_jobs_per_production INTO v_max
  FROM production_companies
  WHERE id = v_company_id AND deleted_at IS NULL;

  v_current := count_active_jobs(NEW.production_id);

  IF v_current >= v_max THEN
    RAISE EXCEPTION 'Job limit reached for this tier (% of % allowed per production)', v_current, v_max
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

-- The trigger itself doesn't change — it already fires BEFORE INSERT
-- on job_posts WHERE production_id IS NOT NULL. Just replacing the function.