# CLAUDE.md — FilmCrew Project Context

## What is FilmCrew?

FilmCrew is a LinkedIn-style web platform for film industry professionals. Users create profiles, connect with each other, message internally (no personal contact info exposed), browse a crew directory, and post/apply for jobs. Jobs live under **Productions**, which belong to **Production Companies** — mirroring real-world film industry structure. There are free and premium tiers (Stripe integration planned).

## Tech Stack

- **Frontend:** React 19 + TypeScript + Vite
- **Styling:** Tailwind CSS 4 + shadcn/ui (Maia style, Stone base, Phosphor icons, DM Sans font, medium radius, subtle menu accent)
- **Routing:** React Router DOM 7 (layout route pattern, BrowserRouter)
- **Data Fetching:** TanStack Query (wired up for Profile, Crew Directory, Connections, Messaging)
- **SEO:** react-helmet-async
- **Backend:** Supabase (Postgres, Auth, RLS, Edge Functions for future server-side tasks)
- **Hosting:** Cloudflare Pages (static deploy from `dist`)
- **Package Manager:** pnpm
- **Icons:** @phosphor-icons/react (NOT Lucide — we chose Phosphor via shadcn create)
- **Toasts:** sonner
- **Skeletons:** shadcn Skeleton component

## Project Structure

```
src/
├── components/
│   ├── auth/
│   │   ├── GoogleButton.tsx
│   │   ├── EmailForm.tsx
│   │   └── ProtectedRoute.tsx
│   ├── layout/
│   │   ├── Navbar.tsx
│   │   ├── NavLinks.tsx
│   │   ├── UserMenu.tsx          # Avatar dropdown — will house company context switcher
│   │   └── RootLayout.tsx
│   ├── ui/                       # shadcn components (don't manually edit)
│   ├── profile/
│   │   ├── BasicInfoSection.tsx
│   │   ├── RoleExperienceSection.tsx
│   │   ├── LocationSection.tsx
│   │   ├── SkillsSection.tsx
│   │   ├── ShowreelSection.tsx
│   │   ├── ProfileImageUpload.tsx
│   │   ├── ShowreelPlayer.tsx
│   │   ├── SkillsPicker.tsx
│   │   ├── ClearableInput.tsx
│   │   └── ProfileSkeleton.tsx
│   ├── crew/
│   │   ├── CrewFilters.tsx
│   │   ├── CrewGrid.tsx
│   │   ├── CrewCard.tsx
│   │   ├── CrewSkeleton.tsx
│   │   └── CrewPagination.tsx
│   ├── connections/
│   │   ├── ConnectionCard.tsx
│   │   ├── ConnectionsSkeleton.tsx
│   │   └── ConnectionsTabs.tsx
│   └── inbox/
│       ├── ConversationList.tsx
│       ├── ConversationItem.tsx
│       ├── ChatView.tsx
│       ├── ChatBubble.tsx
│       ├── ChatInput.tsx
│       └── InboxSkeleton.tsx
├── context/
│   └── AuthContext.tsx
├── hooks/
│   ├── useProfile.ts
│   ├── useProfileForm.ts
│   ├── useNavigationGuard.ts
│   ├── useCrewDirectory.ts
│   ├── useCrewProfile.ts
│   ├── useConnection.ts
│   ├── useConnections.ts
│   ├── useConversations.ts
│   ├── useMessages.ts
│   ├── useStartConversation.ts
│   ├── useUnreadCount.ts
│   └── useScrollRestoration.ts
├── lib/
│   ├── supabase.ts
│   ├── constants.ts
│   └── utils.ts
├── pages/
│   ├── Auth.tsx
│   ├── AuthCallback.tsx
│   ├── Home.tsx
│   ├── CrewDirectory.tsx
│   ├── CrewProfile.tsx
│   ├── Jobs.tsx                  # Stub
│   ├── PostJob.tsx               # Stub — will be refactored into production-scoped flow
│   ├── Inbox.tsx
│   ├── Profile.tsx
│   └── Connections.tsx
└── types/
    ├── database.ts               # AUTO-GENERATED — run `pnpm gen-types`
    └── models.ts                 # Convenience type exports
```

## Key Architecture Decisions

### Auth Flow
- Supabase Auth with Google OAuth and email OTP (magic links).
- `handle_new_user()` Postgres trigger auto-creates a `profiles` row on signup.
- **Supabase auth deadlock gotcha:** Never `await` Supabase queries inside `onAuthStateChange`.
  - AuthContext uses `onAuthStateChange` to synchronously set session/user state.
  - A separate `useEffect` reacts to sign-in and performs profile queries/redirection.
- AuthCallback (`/auth/callback`) is intentionally dumb (loading screen). Redirect logic lives in AuthContext so it wins any race conditions.

### First-time setup detection
- Google sign-in auto-populates `display_name`, so we DO NOT use that to detect "fresh user".
- Instead, `profiles.has_completed_setup` (boolean, default false) is used.
  - On sign-in, if `has_completed_setup = false` → redirect to `/profile?setup=1`
  - On first successful profile save → set `has_completed_setup = true`

### Server State vs Client State
- `useAuth()` = session/auth lifecycle only (no profile fetching).
- `useProfile()` = TanStack Query hook for profile data fetching/caching/invalidation.
- Profile save is a TanStack `useMutation`, and on success it invalidates the cached profile query.

### Production Company → Production → Jobs Hierarchy
- **Production Companies** are the top-level business entity. One owner, multiple members with role-based access (owner/admin/member).
- **Productions** (films, commercials, etc.) belong to a company. Each production has a lifecycle status (pre_production → in_production → post_production → wrapped/cancelled).
- **Job Posts** belong to a production (via `production_id`). Legacy `company` and `project_type` columns remain temporarily on `job_posts` for backward compatibility.
- **Context Switching:** Users can switch between personal context and company context via the UserMenu dropdown (X/Instagram style). Auth session never changes — the UI adapts based on active context.
- **Tier Enforcement:** Server-side triggers prevent exceeding production/job limits regardless of client behaviour. Free tier: 1 active production, 3 jobs per production.

### Company Membership & Invitations
- `production_company_members` tracks who belongs to which company and their role.
- A trigger auto-creates an `owner` membership when a company is created.
- `company_invitations` supports inviting by user ID or email (for users who haven't signed up yet). A trigger on `profiles` INSERT auto-links pending email invitations when someone signs up.
- Invitations expire after 14 days. Can be accepted, declined, or revoked.
- Owners cannot leave a company — they must transfer ownership first.

### Slug System
- Companies and productions use slugs for URL-friendly identifiers.
- `validate_slug()` function enforces: lowercase alphanumeric + hyphens, 2–60 chars, no leading/trailing hyphens, not in `reserved_slugs` table.
- Reserved slugs include route names (`admin`, `api`, `auth`, `companies`, `crew`, `jobs`, `profile`, etc.) to prevent collisions.
- Slugs are currently immutable. Slug change support (with redirect history) is a future enhancement.

### Audit Log
- Append-only `audit_log` table records who did what and when for company-scoped actions.
- Populated via Postgres triggers on `production_companies`, `productions`, `job_posts`, and `production_company_members`.
- RLS: only company members can read their own audit log. No client-side writes.

### Soft Deletes
- `production_companies` and `productions` use `deleted_at` for soft deletes.
- No DELETE RLS policy exists — hard deletes are impossible from the client.
- All queries filter on `deleted_at IS NULL`.

### Layout & Routing
- React Router layout route pattern: `<Route element={<RootLayout />}>` wraps all pages except `/auth` and `/auth/callback`
- RootLayout uses `<Outlet />` — consistent max-w-6xl container with responsive padding
- Auth pages render without the navbar
- Protected routes use `<ProtectedRoute>` wrapper that redirects to `/auth`
- App currently uses **BrowserRouter**, not a "data router".
  - This means React Router's `useBlocker` is NOT available.
  - Unsaved changes protection is **beforeunload only** (tab close/refresh).

### Navbar
- Single responsive component — no separate mobile layout
- Icons only on mobile (`hidden md:inline` on labels), icons + labels on desktop
- Animated sliding underline tracks active route via refs and getBoundingClientRect
- UserMenu returns null while `isLoading` or while `session && !profile` to prevent flicker

### Database Types
- `src/types/database.ts` is auto-generated from Supabase: `pnpm gen-types`
- `src/types/models.ts` has convenience type aliases — import from here in app code
- Only `src/lib/supabase.ts` imports the raw Database type

### Profile Editor UX
- Profile page is split into small sections + one hook; page file stays thin.
- Loading state uses shadcn `<Skeleton />` via `ProfileSkeleton`.
- Toasts use `sonner` (Toaster mounted in `main.tsx`).
- Save UX: success toast, error toast, scroll + focus first invalid field on validation fail.
- Clearable text inputs (X button) for text fields.
- Bio has a 500-character limit + counter.
- Skills: search/select + removable chips, predefined list + custom entries, max 15.
- Select dropdowns use popper positioning to avoid scroll/jump bugs.

### Icons
- ALL icons come from `@phosphor-icons/react`, using the `Icon` suffix convention
- Do NOT use Lucide icons

### Component Patterns
- Use shadcn/ui components for all UI elements
- Keep page files thin — extract reusable pieces into `components/`
- Every page gets a `<Helmet>` for SEO title

## Database Schema

### Enums (Postgres custom types)

| Enum | Values |
|------|--------|
| `company_role` | `owner`, `admin`, `member` |
| `company_tier` | `free`, `pro`, `enterprise` |
| `tier_status` | `active`, `past_due`, `cancelled`, `suspended` |
| `production_status` | `pre_production`, `in_production`, `post_production`, `wrapped`, `cancelled` |
| `production_type` | `feature_film`, `short_film`, `commercial`, `music_video`, `series`, `documentary`, `corporate`, `other` |
| `budget_range` | `micro`, `low`, `mid`, `high` |
| `invitation_status` | `pending`, `accepted`, `declined`, `revoked`, `expired` |

### profiles
- Extends auth.users (id is FK to auth.users)
- username (unique), display_name, email, bio, position, location, country
- profile_image_url, showreel_url, imdb_url, website_url
- skills (text array), experience_years
- availability_status: 'available' | 'busy' | 'not_looking'
- is_verified, is_premium, has_completed_setup
- Auto-created on signup via trigger

### production_companies
- name, slug (unique, validated), description, logo_url, website_url
- city, country, owner_id (FK to profiles, ON DELETE RESTRICT)
- **Tier state machine:** tier, tier_status, tier_started_at, tier_expires_at, tier_cancel_at
- **Stripe fields:** stripe_customer_id, stripe_subscription_id
- **Tier limits:** max_active_productions (default 1), max_active_jobs_per_production (default 3)
- is_verified, deleted_at (soft delete)
- Trigger auto-creates owner membership on INSERT

### production_company_members
- company_id (FK), user_id (FK), role (company_role enum)
- permissions (jsonb, nullable — future per-member overrides)
- Unique on (company_id, user_id)

### company_invitations
- company_id, invited_by, invited_user_id (nullable), invited_email (nullable)
- role, status (invitation_status enum), expires_at (default 14 days)
- EXCLUDE constraints prevent duplicate pending invites
- CHECK constraint requires at least one of user_id or email
- Trigger on profiles INSERT auto-links pending email invitations

### productions
- company_id (FK), title, slug (unique, validated), description
- production_type (enum), status (enum, default pre_production)
- start_date, end_date (with CHECK end >= start), location, country
- budget_range (enum), is_published, poster_url, created_by (FK)
- deleted_at (soft delete)
- INSERT trigger enforces max_active_productions tier limit

### connections
- requester_id, recipient_id (both FK to profiles)
- status: 'pending' | 'accepted' | 'declined'
- Unique on (requester_id, recipient_id), check prevents self-connections

### conversations / conversation_participants / messages
- Standard messaging schema with RLS scoped to participants
- `find_or_create_conversation` RPC for starting conversations
- `is_conversation_member` helper function (security definer)
- Real-time via Supabase Postgres Changes

### job_posts
- posted_by (FK to profiles), title, description, location, is_remote, type, category
- experience_level, compensation, deadline, is_active
- **production_id** (FK to productions, nullable for backward compat)
- **is_flagged**, **flagged_reason** (moderation)
- INSERT trigger enforces max_active_jobs_per_production tier limit
- Legacy columns `company` and `project_type` remain until all jobs flow through productions

### job_applications
- job_id, applicant_id, cover_message, status
- Unique on (job_id, applicant_id)

### audit_log
- company_id, actor_id, action, target_type, target_id, metadata (jsonb)
- Append-only (no UPDATE/DELETE policies)
- Populated by triggers on companies, productions, job_posts, members

### reserved_slugs
- slug (text PK) — prevents users from claiming route-conflicting slugs

## Helper Functions (Security Definer)

These bypass RLS and are used inside RLS policies to prevent circular dependencies:

| Function | Purpose |
|----------|---------|
| `is_company_member(company_id, user_id?)` | Check membership |
| `is_company_admin(company_id, user_id?)` | Check admin+ role |
| `is_company_owner(company_id, user_id?)` | Check owner role |
| `get_company_role(company_id, user_id?)` | Get role or NULL |
| `is_production_member(production_id, user_id?)` | Check via production → company → members |
| `is_production_admin(production_id, user_id?)` | Check admin+ via production chain |
| `count_active_productions(company_id)` | For tier limit enforcement |
| `count_active_jobs(production_id)` | For tier limit enforcement |
| `validate_slug(slug)` | Regex + reserved words check |
| `is_conversation_member(conv_id)` | Messaging RLS helper |
| `find_or_create_conversation(target_user_id)` | Atomic conversation creation |
| `get_unread_count()` | Unread message badge |

## RPCs

| RPC | Purpose |
|-----|---------|
| `accept_company_invitation(invitation_id)` | Atomic: mark accepted + create membership |
| `decline_company_invitation(invitation_id)` | Mark invitation as declined |
| `transfer_company_ownership(company_id, new_owner_id)` | Demote current owner → admin, promote new owner |

## RLS Policy Summary

- **Profiles:** Public read, owner insert/update/delete
- **Production companies:** Public read (non-deleted), authenticated create (owner_id = self), admin+ update, no hard delete
- **Company members:** Co-members can view, admin+ can add/update/remove, members can leave (owners cannot)
- **Company invitations:** Admins see all for company, invitees see own, admins create, invitee or admin can update
- **Productions:** Public read (published + non-deleted) OR member read (drafts), admin+ create/update, no hard delete
- **Connections:** Participants can read, requester can create, recipient can accept/decline, either can delete
- **Conversations:** Participants can read, any authenticated user can create
- **Conversation participants:** Participants can view co-participants, authenticated users can add
- **Messages:** Participants can read/send/update (mark read)
- **Job posts:** Public read (active only), poster can create/update/delete (+ tier limit trigger)
- **Job applications:** Applicant can read own, poster can read for their jobs, applicant can create, poster can update status
- **Audit log:** Company members can read, no client writes (triggers only)
- **Reserved slugs:** Public read, no client writes (migrations only)

## Routes

| Path | Auth | Component |
|------|------|-----------|
| `/` | No | Redirects to `/home` |
| `/home` | No | Home |
| `/crew` | No | CrewDirectory |
| `/crew/:username` | No | CrewProfile |
| `/jobs` | No | Jobs (stub) |
| `/jobs/post` | **Yes** | PostJob (stub — will be refactored) |
| `/jobs/:id` | No | Job detail (stub) |
| `/auth` | No | Auth (sign in) |
| `/auth/callback` | No | AuthCallback |
| `/inbox` | **Yes** | Inbox |
| `/inbox/:conversationId` | **Yes** | Inbox (with active chat) |
| `/profile` | **Yes** | Profile |
| `/connections` | **Yes** | Connections |

### Planned Routes (Production Companies)

| Path | Auth | Purpose |
|------|------|---------|
| `/companies` | No | Browse production companies |
| `/companies/:slug` | No | Company public profile |
| `/companies/:slug/dashboard` | **Yes** | Company dashboard (members only) |
| `/companies/:slug/productions` | **Yes** | Company's productions list |
| `/companies/:slug/settings` | **Yes** | Company settings (admin+) |
| `/companies/new` | **Yes** | Create company form |
| `/productions/:slug` | No | Production detail (public when published) |
| `/productions/:slug/jobs/new` | **Yes** | Post job under production (admin+) |

## Environment Variables

```
VITE_SUPABASE_URL=your-project-url.supabase.co
VITE_SUPABASE_ANON_KEY=your-publishable-anon-key
SUPABASE_ACCESS_TOKEN=your-personal-access-token (for CLI only, not in browser)
```

## Scripts

```json
"dev": "vite",
"build": "tsc -b && vite build",
"gen-types": "supabase gen types typescript --project-id PROJECT_ID > src/types/database.ts"
```

## What's Been Built

- [x] Supabase project + database schema (all tables, RLS, indexes, triggers)
- [x] Vite + React + TypeScript + shadcn/ui project scaffold
- [x] Supabase client with typed Database
- [x] Auth system (Google OAuth + email OTP)
- [x] Auto-profile creation on signup (Postgres trigger)
- [x] AuthContext with session persistence + safe sign-in side-effects
- [x] TanStack Query wired for Profile (useProfile hook + mutations + invalidation)
- [x] Responsive navbar with sliding underline indicator
- [x] UserMenu with avatar dropdown
- [x] Protected routes (inbox, profile, connections)
- [x] Profile Editor (sections + image upload + showreel preview + skills picker)
- [x] Profile setup wizard redirect via `has_completed_setup`
- [x] Layout route pattern with RootLayout
- [x] Auto-generated database types from Supabase CLI
- [x] Profile skeleton loading state + Sonner toasts
- [x] Cloudflare Pages deployment
- [x] Crew Directory (search, filters, pagination, URL state)
- [x] Crew Profile pages (public view via /crew/:username)
- [x] Connection system (send/accept/decline/withdraw, mutual connections)
- [x] Messaging system (real-time via Supabase, typing indicators, unread counts)
- [x] **Production company schema** (companies, members, invitations, productions, audit log, tier enforcement, slug validation, helper functions, RLS policies)

## What Needs to Be Built

### Production Company Feature (Current Sprint)
- [ ] Company creation flow (form + auto-owner membership)
- [ ] Context switcher in UserMenu (personal ↔ company)
- [ ] Company dashboard shell
- [ ] Company settings page (edit details, manage members)
- [ ] Member invitation flow (invite by user/email, accept/decline)
- [ ] Productions CRUD (create/edit under company context)
- [ ] Job posts refactored to require production_id
- [ ] Public company profile page (/companies/:slug)
- [ ] Public production page (/productions/:slug)
- [ ] Enhanced job search with production/company context

### Remaining Core Features
- [ ] Job listings page (browse, filter)
- [ ] Job detail page (/jobs/:id)
- [ ] Job application flow (apply with cover message)
- [ ] Email notifications for new messages (Supabase Edge Function)
- [ ] Tier limit UX (upgrade prompts when limits reached)

### Stripe Integration (After MVP)
- [ ] Stripe checkout for company tier upgrades
- [ ] Webhook handler to update tier/tier_status columns
- [ ] Subscription management (cancel, resume, change plan)
- [ ] Swish support (enabled as Stripe payment method in Sweden)

### Future Features
- [ ] Verification badges
- [ ] Forum / wall posts with comments
- [ ] AI suggestion algorithm for forum content
- [ ] Profile availability calendar
- [ ] Gear rental page
- [ ] Talent agents
- [ ] Locations page
- [ ] Invoice generator
- [ ] Domain emails
- [ ] CDN for images
- [ ] Caching layer
- [ ] Terms of Service page
- [ ] Light/dark mode toggle

## Important Gotchas

1. **Supabase auth deadlock:** Never `await` a Supabase query inside `onAuthStateChange`. Use a separate `useEffect`.
2. **Trigger search path:** Any Postgres trigger function called by Supabase auth must use `security definer` and `set search_path = public`.
3. **RLS circular dependencies:** Use `security definer` helper functions (like `is_company_member()`) to break circular references in RLS policies. This was critical for both messaging and the production company system.
4. **Generated types:** `database.ts` is auto-generated. Never edit manually. Add convenience types to `models.ts`.
5. **Icons:** Use `@phosphor-icons/react` everywhere. Import with `Icon` suffix.
6. **shadcn components:** Use shadcn's built-in components before creating custom ones. Install with `npx shadcn@latest add <component> -y`.
7. **Environment variables:** Only `VITE_` prefixed vars are available in the browser.
8. **NavLinks indicator:** Uses `pathname ===` for exact matching.
9. **Soft deletes:** `production_companies` and `productions` use `deleted_at`. Always filter on `deleted_at IS NULL` in queries. No DELETE RLS policies exist.
10. **Slug validation:** Slugs must pass `validate_slug()` — lowercase alphanumeric + hyphens, 2–60 chars, not reserved. Always validate client-side before submission for UX, but server enforces via CHECK constraint.
11. **Tier limits:** Enforced server-side via triggers on INSERT. Client should check limits before attempting to create (for good UX), but the database is the source of truth.
12. **Owner safety:** Company owners cannot leave or be removed. Ownership must be explicitly transferred via `transfer_company_ownership()` RPC.
13. **Legacy job_posts columns:** `company` and `project_type` still exist on `job_posts` for backward compatibility. Will be removed in a follow-up migration once all jobs flow through productions.