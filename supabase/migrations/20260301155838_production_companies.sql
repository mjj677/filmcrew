-- ============================================================================
-- FILMCREW: Production Company → Production → Job Listings Migration
-- ============================================================================
-- Run against your Supabase project via SQL Editor or CLI migration.
-- This migration is idempotent where possible (IF NOT EXISTS).
-- ============================================================================


-- ────────────────────────────────────────────────────────────────────────────
-- 1. CUSTOM TYPES (enums)
-- ────────────────────────────────────────────────────────────────────────────

-- Company member roles — determines base permissions
DO $$ BEGIN
  CREATE TYPE company_role AS ENUM ('owner', 'admin', 'member');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Company subscription tiers
DO $$ BEGIN
  CREATE TYPE company_tier AS ENUM ('free', 'pro', 'enterprise');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Subscription status — maps 1:1 with Stripe subscription states
DO $$ BEGIN
  CREATE TYPE tier_status AS ENUM ('active', 'past_due', 'cancelled', 'suspended');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Production lifecycle
DO $$ BEGIN
  CREATE TYPE production_status AS ENUM (
    'pre_production', 'in_production', 'post_production', 'wrapped', 'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- What kind of production
DO $$ BEGIN
  CREATE TYPE production_type AS ENUM (
    'feature_film', 'short_film', 'commercial', 'music_video',
    'series', 'documentary', 'corporate', 'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Budget bracket (no exact figures publicly)
DO $$ BEGIN
  CREATE TYPE budget_range AS ENUM ('micro', 'low', 'mid', 'high');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Invitation status
DO $$ BEGIN
  CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'declined', 'revoked', 'expired');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ────────────────────────────────────────────────────────────────────────────
-- 2. RESERVED SLUGS
-- ────────────────────────────────────────────────────────────────────────────
-- Prevents users from claiming slugs that clash with app routes or branding.

CREATE TABLE IF NOT EXISTS reserved_slugs (
  slug text PRIMARY KEY
);

-- Seed with known reserved words (add to this as routes grow)
INSERT INTO reserved_slugs (slug) VALUES
  ('admin'), ('api'), ('auth'), ('callback'), ('companies'), ('company'),
  ('crew'), ('dashboard'), ('filmcrew'), ('home'), ('inbox'), ('jobs'),
  ('login'), ('logout'), ('new'), ('null'), ('post'), ('productions'),
  ('profile'), ('search'), ('settings'), ('signup'), ('support'),
  ('terms'), ('privacy'), ('undefined'), ('www')
ON CONFLICT (slug) DO NOTHING;


-- ────────────────────────────────────────────────────────────────────────────
-- 3. SLUG VALIDATION FUNCTION
-- ────────────────────────────────────────────────────────────────────────────
-- Reusable across any table that has a slug column.

CREATE OR REPLACE FUNCTION validate_slug(input_slug text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  -- Must be 2-60 chars, lowercase alphanumeric + hyphens, no leading/trailing hyphens
  IF input_slug !~ '^[a-z0-9](?:[a-z0-9-]{0,58}[a-z0-9])?$' THEN
    RETURN false;
  END IF;

  -- Must not be reserved
  IF EXISTS (SELECT 1 FROM reserved_slugs WHERE slug = input_slug) THEN
    RETURN false;
  END IF;

  RETURN true;
END;
$$;


-- ────────────────────────────────────────────────────────────────────────────
-- 4. PRODUCTION COMPANIES
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS production_companies (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  slug        text UNIQUE NOT NULL
              CONSTRAINT valid_company_slug CHECK (validate_slug(slug)),
  description text,
  logo_url    text,
  website_url text,
  city        text,
  country     text,
  owner_id    uuid NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,

  -- Tier / billing state machine
  tier              company_tier NOT NULL DEFAULT 'free',
  tier_status       tier_status  NOT NULL DEFAULT 'active',
  tier_started_at   timestamptz,
  tier_expires_at   timestamptz,
  tier_cancel_at    timestamptz,    -- scheduled end-of-period cancellation
  stripe_customer_id    text,       -- Stripe customer ID (set on first checkout)
  stripe_subscription_id text,      -- Stripe subscription ID

  -- Tier limits (defaults = free tier; updated by Stripe webhooks for paid)
  max_active_productions        int NOT NULL DEFAULT 1,
  max_active_jobs_per_production int NOT NULL DEFAULT 3,

  -- Verification & moderation
  is_verified boolean NOT NULL DEFAULT false,

  -- Soft delete
  deleted_at  timestamptz,

  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_companies_owner      ON production_companies(owner_id);
CREATE INDEX IF NOT EXISTS idx_companies_slug       ON production_companies(slug) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_companies_deleted     ON production_companies(deleted_at) WHERE deleted_at IS NOT NULL;

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_companies_updated_at ON production_companies;
CREATE TRIGGER trg_companies_updated_at
  BEFORE UPDATE ON production_companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ────────────────────────────────────────────────────────────────────────────
-- 5. PRODUCTION COMPANY MEMBERS
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS production_company_members (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  uuid NOT NULL REFERENCES production_companies(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role        company_role NOT NULL DEFAULT 'member',

  -- Optional per-member permission overrides (future use)
  permissions jsonb,

  created_at  timestamptz NOT NULL DEFAULT now(),

  UNIQUE (company_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_members_company ON production_company_members(company_id);
CREATE INDEX IF NOT EXISTS idx_members_user    ON production_company_members(user_id);


-- ────────────────────────────────────────────────────────────────────────────
-- 6. COMPANY INVITATIONS
-- ────────────────────────────────────────────────────────────────────────────
-- Separate from members — handles the full invite lifecycle including
-- inviting people who don't yet have a FilmCrew account.

CREATE TABLE IF NOT EXISTS company_invitations (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    uuid NOT NULL REFERENCES production_companies(id) ON DELETE CASCADE,
  invited_by    uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Either an existing user OR an email (for users who haven't signed up yet)
  invited_user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  invited_email   text,

  role          company_role NOT NULL DEFAULT 'member',
  status        invitation_status NOT NULL DEFAULT 'pending',

  expires_at    timestamptz NOT NULL DEFAULT (now() + interval '14 days'),
  responded_at  timestamptz,

  created_at    timestamptz NOT NULL DEFAULT now(),

  -- At least one of user_id or email must be set
  CONSTRAINT invitation_target_required
    CHECK (invited_user_id IS NOT NULL OR invited_email IS NOT NULL),

  -- Prevent duplicate pending invites to the same person/email
  CONSTRAINT unique_pending_user_invite
    EXCLUDE USING btree (company_id WITH =, invited_user_id WITH =)
    WHERE (status = 'pending' AND invited_user_id IS NOT NULL),

  CONSTRAINT unique_pending_email_invite
    EXCLUDE USING btree (company_id WITH =, invited_email WITH =)
    WHERE (status = 'pending' AND invited_email IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_invitations_company  ON company_invitations(company_id);
CREATE INDEX IF NOT EXISTS idx_invitations_user     ON company_invitations(invited_user_id) WHERE invited_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_invitations_email    ON company_invitations(invited_email) WHERE invited_email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_invitations_pending  ON company_invitations(status) WHERE status = 'pending';


-- ────────────────────────────────────────────────────────────────────────────
-- 7. PRODUCTIONS
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS productions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      uuid NOT NULL REFERENCES production_companies(id) ON DELETE CASCADE,
  title           text NOT NULL,
  slug            text UNIQUE NOT NULL
                  CONSTRAINT valid_production_slug CHECK (validate_slug(slug)),
  description     text,

  production_type production_type,
  status          production_status NOT NULL DEFAULT 'pre_production',

  start_date      date,
  end_date        date,
  location        text,
  country         text,
  budget_range    budget_range,

  is_published    boolean NOT NULL DEFAULT false,
  poster_url      text,

  created_by      uuid NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,

  -- Soft delete
  deleted_at      timestamptz,

  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT valid_date_range CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_productions_company    ON productions(company_id);
CREATE INDEX IF NOT EXISTS idx_productions_slug       ON productions(slug) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_productions_published  ON productions(is_published) WHERE is_published = true AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_productions_status     ON productions(status);

DROP TRIGGER IF EXISTS trg_productions_updated_at ON productions;
CREATE TRIGGER trg_productions_updated_at
  BEFORE UPDATE ON productions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ────────────────────────────────────────────────────────────────────────────
-- 8. MODIFY JOB_POSTS — link to productions
-- ────────────────────────────────────────────────────────────────────────────
-- Add production_id as nullable first (backward compatible).
-- Existing rows keep company/project_type until data is migrated.

ALTER TABLE job_posts
  ADD COLUMN IF NOT EXISTS production_id uuid REFERENCES productions(id) ON DELETE CASCADE;

ALTER TABLE job_posts
  ADD COLUMN IF NOT EXISTS is_flagged boolean NOT NULL DEFAULT false;

ALTER TABLE job_posts
  ADD COLUMN IF NOT EXISTS flagged_reason text;

CREATE INDEX IF NOT EXISTS idx_jobs_production ON job_posts(production_id) WHERE production_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_jobs_flagged    ON job_posts(is_flagged) WHERE is_flagged = true;

-- NOTE: We keep `company` and `project_type` columns for now.
-- Once all jobs are created under productions, run a follow-up migration:
--   ALTER TABLE job_posts DROP COLUMN company;
--   ALTER TABLE job_posts DROP COLUMN project_type;
--   ALTER TABLE job_posts ALTER COLUMN production_id SET NOT NULL;


-- ────────────────────────────────────────────────────────────────────────────
-- 9. AUDIT LOG
-- ────────────────────────────────────────────────────────────────────────────
-- Immutable append-only log. No UPDATE or DELETE policies.

CREATE TABLE IF NOT EXISTS audit_log (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  uuid REFERENCES production_companies(id) ON DELETE SET NULL,
  actor_id    uuid REFERENCES profiles(id) ON DELETE SET NULL,
  action      text NOT NULL,           -- e.g. 'job.created', 'member.invited'
  target_type text,                    -- e.g. 'job_post', 'production', 'member'
  target_id   uuid,
  metadata    jsonb DEFAULT '{}'::jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Queries will almost always be scoped to a company, ordered by time
CREATE INDEX IF NOT EXISTS idx_audit_company_time ON audit_log(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_actor        ON audit_log(actor_id);


-- ────────────────────────────────────────────────────────────────────────────
-- 10. HELPER FUNCTIONS (security definer — bypass RLS for internal checks)
-- ────────────────────────────────────────────────────────────────────────────

-- Check if a user is a member of a company (with optional minimum role)
CREATE OR REPLACE FUNCTION is_company_member(
  p_company_id uuid,
  p_user_id uuid DEFAULT auth.uid()
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM production_company_members
    WHERE company_id = p_company_id
      AND user_id = p_user_id
  );
$$;

-- Check if user has admin+ role in a company
CREATE OR REPLACE FUNCTION is_company_admin(
  p_company_id uuid,
  p_user_id uuid DEFAULT auth.uid()
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM production_company_members
    WHERE company_id = p_company_id
      AND user_id = p_user_id
      AND role IN ('owner', 'admin')
  );
$$;

-- Check if user is the owner of a company
CREATE OR REPLACE FUNCTION is_company_owner(
  p_company_id uuid,
  p_user_id uuid DEFAULT auth.uid()
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM production_company_members
    WHERE company_id = p_company_id
      AND user_id = p_user_id
      AND role = 'owner'
  );
$$;

-- Get a user's role in a company (returns NULL if not a member)
CREATE OR REPLACE FUNCTION get_company_role(
  p_company_id uuid,
  p_user_id uuid DEFAULT auth.uid()
)
RETURNS company_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM production_company_members
  WHERE company_id = p_company_id
    AND user_id = p_user_id;
$$;

-- Check if a user is a member of the company that owns a production
CREATE OR REPLACE FUNCTION is_production_member(
  p_production_id uuid,
  p_user_id uuid DEFAULT auth.uid()
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM productions p
    JOIN production_company_members m ON m.company_id = p.company_id
    WHERE p.id = p_production_id
      AND m.user_id = p_user_id
  );
$$;

-- Check if a user is admin+ of the company that owns a production
CREATE OR REPLACE FUNCTION is_production_admin(
  p_production_id uuid,
  p_user_id uuid DEFAULT auth.uid()
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM productions p
    JOIN production_company_members m ON m.company_id = p.company_id
    WHERE p.id = p_production_id
      AND m.user_id = p_user_id
      AND m.role IN ('owner', 'admin')
  );
$$;

-- Count active productions for a company (for tier limit enforcement)
CREATE OR REPLACE FUNCTION count_active_productions(p_company_id uuid)
RETURNS int
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT count(*)::int
  FROM productions
  WHERE company_id = p_company_id
    AND deleted_at IS NULL
    AND status NOT IN ('wrapped', 'cancelled');
$$;

-- Count active jobs for a production (for tier limit enforcement)
CREATE OR REPLACE FUNCTION count_active_jobs(p_production_id uuid)
RETURNS int
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT count(*)::int
  FROM job_posts
  WHERE production_id = p_production_id
    AND is_active = true;
$$;


-- ────────────────────────────────────────────────────────────────────────────
-- 11. SERVER-SIDE TIER ENFORCEMENT
-- ────────────────────────────────────────────────────────────────────────────
-- These triggers prevent inserts that would exceed tier limits,
-- regardless of what the client-side UI allows.

CREATE OR REPLACE FUNCTION enforce_production_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_max int;
  v_current int;
BEGIN
  SELECT max_active_productions INTO v_max
  FROM production_companies
  WHERE id = NEW.company_id AND deleted_at IS NULL;

  v_current := count_active_productions(NEW.company_id);

  IF v_current >= v_max THEN
    RAISE EXCEPTION 'Production limit reached for this tier (% of % allowed)', v_current, v_max
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_production_limit ON productions;
CREATE TRIGGER trg_enforce_production_limit
  BEFORE INSERT ON productions
  FOR EACH ROW EXECUTE FUNCTION enforce_production_limit();


CREATE OR REPLACE FUNCTION enforce_job_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id uuid;
  v_max int;
  v_current int;
BEGIN
  -- Get the company via the production
  SELECT p.company_id INTO v_company_id
  FROM productions p
  WHERE p.id = NEW.production_id;

  IF v_company_id IS NULL THEN
    RETURN NEW; -- No production linked (legacy job), skip enforcement
  END IF;

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

DROP TRIGGER IF EXISTS trg_enforce_job_limit ON job_posts;
CREATE TRIGGER trg_enforce_job_limit
  BEFORE INSERT ON job_posts
  FOR EACH ROW
  WHEN (NEW.production_id IS NOT NULL)
  EXECUTE FUNCTION enforce_job_limit();


-- ────────────────────────────────────────────────────────────────────────────
-- 12. AUTO-CREATE OWNER MEMBERSHIP ON COMPANY CREATION
-- ────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION auto_create_owner_membership()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO production_company_members (company_id, user_id, role)
  VALUES (NEW.id, NEW.owner_id, 'owner');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_owner_membership ON production_companies;
CREATE TRIGGER trg_auto_owner_membership
  AFTER INSERT ON production_companies
  FOR EACH ROW EXECUTE FUNCTION auto_create_owner_membership();


-- ────────────────────────────────────────────────────────────────────────────
-- 13. AUTO-LINK INVITATIONS WHEN USER SIGNS UP
-- ────────────────────────────────────────────────────────────────────────────
-- When a new profile is created, check if there are pending email invitations
-- and link them to the user_id.

CREATE OR REPLACE FUNCTION link_pending_invitations()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE company_invitations
  SET invited_user_id = NEW.id
  WHERE invited_email = NEW.email
    AND invited_user_id IS NULL
    AND status = 'pending'
    AND expires_at > now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_link_invitations_on_signup ON profiles;
CREATE TRIGGER trg_link_invitations_on_signup
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION link_pending_invitations();


-- ────────────────────────────────────────────────────────────────────────────
-- 14. AUDIT LOG TRIGGERS
-- ────────────────────────────────────────────────────────────────────────────
-- Generic audit function — called by table-specific triggers.

CREATE OR REPLACE FUNCTION write_audit_log()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id uuid;
  v_action text;
  v_target_type text;
  v_target_id uuid;
  v_actor_id uuid;
  v_metadata jsonb;
BEGIN
  v_actor_id := auth.uid();
  v_metadata := '{}'::jsonb;

  -- Determine context based on which table triggered this
  CASE TG_TABLE_NAME

    WHEN 'production_companies' THEN
      v_target_type := 'company';
      IF TG_OP = 'INSERT' THEN
        v_company_id := NEW.id;
        v_target_id := NEW.id;
        v_action := 'company.created';
      ELSIF TG_OP = 'UPDATE' THEN
        v_company_id := NEW.id;
        v_target_id := NEW.id;
        IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
          v_action := 'company.deleted';
        ELSE
          v_action := 'company.updated';
        END IF;
      END IF;

    WHEN 'productions' THEN
      v_target_type := 'production';
      IF TG_OP = 'INSERT' THEN
        v_company_id := NEW.company_id;
        v_target_id := NEW.id;
        v_action := 'production.created';
        v_metadata := jsonb_build_object('title', NEW.title);
      ELSIF TG_OP = 'UPDATE' THEN
        v_company_id := NEW.company_id;
        v_target_id := NEW.id;
        IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
          v_action := 'production.deleted';
        ELSIF NEW.is_published = true AND OLD.is_published = false THEN
          v_action := 'production.published';
        ELSE
          v_action := 'production.updated';
        END IF;
        v_metadata := jsonb_build_object('title', NEW.title);
      END IF;

    WHEN 'job_posts' THEN
      v_target_type := 'job_post';
      IF TG_OP = 'INSERT' THEN
        v_target_id := NEW.id;
        v_action := 'job.created';
        -- Get company_id through production
        SELECT p.company_id INTO v_company_id
        FROM productions p WHERE p.id = NEW.production_id;
        v_metadata := jsonb_build_object('title', NEW.title);
      ELSIF TG_OP = 'UPDATE' THEN
        v_target_id := NEW.id;
        SELECT p.company_id INTO v_company_id
        FROM productions p WHERE p.id = NEW.production_id;
        IF NEW.is_active = false AND OLD.is_active = true THEN
          v_action := 'job.deactivated';
        ELSE
          v_action := 'job.updated';
        END IF;
        v_metadata := jsonb_build_object('title', NEW.title);
      END IF;

    WHEN 'production_company_members' THEN
      v_target_type := 'member';
      v_company_id := COALESCE(NEW.company_id, OLD.company_id);
      IF TG_OP = 'INSERT' THEN
        v_target_id := NEW.user_id;
        v_action := 'member.added';
        v_metadata := jsonb_build_object('role', NEW.role::text);
      ELSIF TG_OP = 'UPDATE' THEN
        v_target_id := NEW.user_id;
        v_action := 'member.role_changed';
        v_metadata := jsonb_build_object(
          'old_role', OLD.role::text,
          'new_role', NEW.role::text
        );
      ELSIF TG_OP = 'DELETE' THEN
        v_target_id := OLD.user_id;
        v_action := 'member.removed';
        v_metadata := jsonb_build_object('role', OLD.role::text);
      END IF;

    ELSE
      RETURN COALESCE(NEW, OLD);
  END CASE;

  -- Write the log entry (skip if no action determined)
  IF v_action IS NOT NULL THEN
    INSERT INTO audit_log (company_id, actor_id, action, target_type, target_id, metadata)
    VALUES (v_company_id, v_actor_id, v_action, v_target_type, v_target_id, v_metadata);
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Attach audit triggers
DROP TRIGGER IF EXISTS trg_audit_companies ON production_companies;
CREATE TRIGGER trg_audit_companies
  AFTER INSERT OR UPDATE ON production_companies
  FOR EACH ROW EXECUTE FUNCTION write_audit_log();

DROP TRIGGER IF EXISTS trg_audit_productions ON productions;
CREATE TRIGGER trg_audit_productions
  AFTER INSERT OR UPDATE ON productions
  FOR EACH ROW EXECUTE FUNCTION write_audit_log();

DROP TRIGGER IF EXISTS trg_audit_job_posts ON job_posts;
CREATE TRIGGER trg_audit_job_posts
  AFTER INSERT OR UPDATE ON job_posts
  FOR EACH ROW
  WHEN (NEW.production_id IS NOT NULL)
  EXECUTE FUNCTION write_audit_log();

DROP TRIGGER IF EXISTS trg_audit_members ON production_company_members;
CREATE TRIGGER trg_audit_members
  AFTER INSERT OR UPDATE OR DELETE ON production_company_members
  FOR EACH ROW EXECUTE FUNCTION write_audit_log();


-- ────────────────────────────────────────────────────────────────────────────
-- 15. ENABLE RLS ON ALL NEW TABLES
-- ────────────────────────────────────────────────────────────────────────────

ALTER TABLE production_companies       ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_company_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_invitations        ENABLE ROW LEVEL SECURITY;
ALTER TABLE productions                ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE reserved_slugs             ENABLE ROW LEVEL SECURITY;


-- ────────────────────────────────────────────────────────────────────────────
-- 16. RLS POLICIES — production_companies
-- ────────────────────────────────────────────────────────────────────────────

-- Anyone can view non-deleted companies
CREATE POLICY "companies_select_public"
  ON production_companies FOR SELECT
  USING (deleted_at IS NULL);

-- Authenticated users can create companies
CREATE POLICY "companies_insert_authenticated"
  ON production_companies FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

-- Only admins+ can update their company
CREATE POLICY "companies_update_admin"
  ON production_companies FOR UPDATE
  TO authenticated
  USING (is_company_admin(id, auth.uid()))
  WITH CHECK (is_company_admin(id, auth.uid()));

-- Only owners can soft-delete (update deleted_at)
-- Hard deletes are blocked entirely via RLS (no DELETE policy)


-- ────────────────────────────────────────────────────────────────────────────
-- 17. RLS POLICIES — production_company_members
-- ────────────────────────────────────────────────────────────────────────────

-- Members can see co-members of their companies
CREATE POLICY "members_select_co_members"
  ON production_company_members FOR SELECT
  TO authenticated
  USING (is_company_member(company_id, auth.uid()));

-- The auto-trigger handles owner membership on company creation.
-- Admins+ can add members (via accepting invitations — handled by RPC).
-- Direct inserts are restricted to the system (trigger + RPCs).
CREATE POLICY "members_insert_admin"
  ON production_company_members FOR INSERT
  TO authenticated
  WITH CHECK (is_company_admin(company_id, auth.uid()));

-- Admins can update roles (but not their own to prevent privilege escalation)
CREATE POLICY "members_update_admin"
  ON production_company_members FOR UPDATE
  TO authenticated
  USING (
    is_company_admin(company_id, auth.uid())
    AND user_id != auth.uid()  -- can't change your own role
  );

-- Admins can remove members, OR a member can remove themselves (leave)
CREATE POLICY "members_delete"
  ON production_company_members FOR DELETE
  TO authenticated
  USING (
    (is_company_admin(company_id, auth.uid()) AND user_id != auth.uid())
    OR (user_id = auth.uid() AND role != 'owner')  -- owners can't leave, must transfer first
  );


-- ────────────────────────────────────────────────────────────────────────────
-- 18. RLS POLICIES — company_invitations
-- ────────────────────────────────────────────────────────────────────────────

-- Admins can see all invitations for their company
-- Invited users can see their own invitations
CREATE POLICY "invitations_select"
  ON company_invitations FOR SELECT
  TO authenticated
  USING (
    is_company_admin(company_id, auth.uid())
    OR invited_user_id = auth.uid()
  );

-- Admins+ can create invitations
CREATE POLICY "invitations_insert_admin"
  ON company_invitations FOR INSERT
  TO authenticated
  WITH CHECK (
    is_company_admin(company_id, auth.uid())
    AND invited_by = auth.uid()
  );

-- Invitee can accept/decline; admin can revoke
CREATE POLICY "invitations_update"
  ON company_invitations FOR UPDATE
  TO authenticated
  USING (
    invited_user_id = auth.uid()
    OR is_company_admin(company_id, auth.uid())
  );


-- ────────────────────────────────────────────────────────────────────────────
-- 19. RLS POLICIES — productions
-- ────────────────────────────────────────────────────────────────────────────

-- Public: anyone can view published, non-deleted productions
CREATE POLICY "productions_select_public"
  ON productions FOR SELECT
  USING (
    (is_published = true AND deleted_at IS NULL)
    OR is_company_member(company_id, auth.uid())
  );

-- Admins+ of the company can create productions
CREATE POLICY "productions_insert_admin"
  ON productions FOR INSERT
  TO authenticated
  WITH CHECK (
    is_company_admin(company_id, auth.uid())
    AND created_by = auth.uid()
  );

-- Admins+ can update productions
CREATE POLICY "productions_update_admin"
  ON productions FOR UPDATE
  TO authenticated
  USING (is_company_admin(company_id, auth.uid()));

-- No hard deletes — soft delete only (via UPDATE setting deleted_at)


-- ────────────────────────────────────────────────────────────────────────────
-- 20. RLS POLICIES — audit_log
-- ────────────────────────────────────────────────────────────────────────────

-- Only members of the company can view their audit log
CREATE POLICY "audit_select_members"
  ON audit_log FOR SELECT
  TO authenticated
  USING (is_company_member(company_id, auth.uid()));

-- No client-side inserts — audit entries are created by triggers only
-- (the trigger functions use SECURITY DEFINER so they bypass RLS)


-- ────────────────────────────────────────────────────────────────────────────
-- 21. RLS POLICIES — reserved_slugs
-- ────────────────────────────────────────────────────────────────────────────

-- Public read (so the validate_slug function can check)
CREATE POLICY "slugs_select_public"
  ON reserved_slugs FOR SELECT
  USING (true);

-- No client-side writes — managed by migrations only


-- ────────────────────────────────────────────────────────────────────────────
-- 22. RPC: ACCEPT INVITATION
-- ────────────────────────────────────────────────────────────────────────────
-- Atomically: mark invitation as accepted + create membership row.

CREATE OR REPLACE FUNCTION accept_company_invitation(p_invitation_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invitation company_invitations%ROWTYPE;
  v_membership_id uuid;
BEGIN
  -- Lock the invitation row
  SELECT * INTO v_invitation
  FROM company_invitations
  WHERE id = p_invitation_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invitation not found';
  END IF;

  IF v_invitation.invited_user_id != auth.uid() THEN
    RAISE EXCEPTION 'This invitation is not for you';
  END IF;

  IF v_invitation.status != 'pending' THEN
    RAISE EXCEPTION 'Invitation is no longer pending (status: %)', v_invitation.status;
  END IF;

  IF v_invitation.expires_at < now() THEN
    -- Mark as expired
    UPDATE company_invitations SET status = 'expired' WHERE id = p_invitation_id;
    RAISE EXCEPTION 'Invitation has expired';
  END IF;

  -- Mark accepted
  UPDATE company_invitations
  SET status = 'accepted', responded_at = now()
  WHERE id = p_invitation_id;

  -- Create membership
  INSERT INTO production_company_members (company_id, user_id, role)
  VALUES (v_invitation.company_id, auth.uid(), v_invitation.role)
  ON CONFLICT (company_id, user_id) DO NOTHING
  RETURNING id INTO v_membership_id;

  RETURN v_membership_id;
END;
$$;


-- ────────────────────────────────────────────────────────────────────────────
-- 23. RPC: DECLINE INVITATION
-- ────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION decline_company_invitation(p_invitation_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invitation company_invitations%ROWTYPE;
BEGIN
  SELECT * INTO v_invitation
  FROM company_invitations
  WHERE id = p_invitation_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invitation not found';
  END IF;

  IF v_invitation.invited_user_id != auth.uid() THEN
    RAISE EXCEPTION 'This invitation is not for you';
  END IF;

  IF v_invitation.status != 'pending' THEN
    RAISE EXCEPTION 'Invitation is no longer pending';
  END IF;

  UPDATE company_invitations
  SET status = 'declined', responded_at = now()
  WHERE id = p_invitation_id;
END;
$$;


-- ────────────────────────────────────────────────────────────────────────────
-- 24. RPC: TRANSFER OWNERSHIP
-- ────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION transfer_company_ownership(
  p_company_id uuid,
  p_new_owner_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify caller is current owner
  IF NOT is_company_owner(p_company_id, auth.uid()) THEN
    RAISE EXCEPTION 'Only the current owner can transfer ownership';
  END IF;

  -- Verify new owner is an existing member
  IF NOT is_company_member(p_company_id, p_new_owner_id) THEN
    RAISE EXCEPTION 'New owner must be an existing member of the company';
  END IF;

  -- Demote current owner to admin
  UPDATE production_company_members
  SET role = 'admin'
  WHERE company_id = p_company_id AND user_id = auth.uid();

  -- Promote new owner
  UPDATE production_company_members
  SET role = 'owner'
  WHERE company_id = p_company_id AND user_id = p_new_owner_id;

  -- Update company's owner_id
  UPDATE production_companies
  SET owner_id = p_new_owner_id
  WHERE id = p_company_id;
END;
$$;


-- ────────────────────────────────────────────────────────────────────────────
-- 25. GRANT EXECUTE ON RPCs TO AUTHENTICATED USERS
-- ────────────────────────────────────────────────────────────────────────────

GRANT EXECUTE ON FUNCTION accept_company_invitation(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION decline_company_invitation(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION transfer_company_ownership(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION is_company_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION is_company_admin(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION is_company_owner(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_company_role(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION is_production_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION is_production_admin(uuid, uuid) TO authenticated;

-- Also grant to anon for the helper functions used in public SELECT policies
GRANT EXECUTE ON FUNCTION is_company_member(uuid, uuid) TO anon;


-- ────────────────────────────────────────────────────────────────────────────
-- DONE
-- ────────────────────────────────────────────────────────────────────────────
-- After running this migration:
-- 1. Run `pnpm gen-types` to regenerate database.ts
-- 2. Update models.ts with the new type exports
-- 3. Update CLAUDE.md with the new schema documentation