# CLAUDE.md — FilmCrew Project Context

## What is FilmCrew?

FilmCrew is a LinkedIn-style web platform for film industry professionals. Users create profiles, connect with each other, message internally (no personal contact info exposed), browse a crew directory, and post/apply for jobs. There are free and premium tiers (Stripe integration planned).

## Tech Stack

- **Frontend:** React 19 + TypeScript + Vite
- **Styling:** Tailwind CSS 4 + shadcn/ui (Maia style, Stone base, Phosphor icons, DM Sans font, medium radius, subtle menu accent)
- **Routing:** React Router DOM 7 (layout route pattern)
- **Data Fetching:** TanStack Query (installed, not yet wired up)
- **SEO:** react-helmet-async
- **Backend:** Supabase (Postgres, Auth, Row Level Security, Edge Functions for future server-side tasks)
- **Hosting:** Cloudflare Pages (static deploy from `dist`)
- **Package Manager:** pnpm
- **Icons:** @phosphor-icons/react (NOT Lucide — we chose Phosphor via shadcn create)

## Project Structure

```
src/
├── components/
│   ├── auth/
│   │   ├── GoogleButton.tsx      # Google OAuth sign-in button
│   │   ├── EmailForm.tsx         # Email OTP (magic link) form
│   │   └── ProtectedRoute.tsx    # Redirects to /auth if not signed in
│   ├── layout/
│   │   ├── Navbar.tsx            # Sticky top nav, composes NavLinks + UserMenu
│   │   ├── NavLinks.tsx          # Nav links with animated sliding underline indicator
│   │   ├── UserMenu.tsx          # Avatar dropdown (signed in) or sign-in button
│   │   └── RootLayout.tsx        # Layout wrapper with Navbar + Outlet
│   └── ui/                       # shadcn components (don't manually edit)
├── context/
│   └── AuthContext.tsx            # Auth state provider (session, profile, sign in/out)
├── lib/
│   ├── supabase.ts               # Supabase client instance (typed with Database)
│   └── utils.ts                  # shadcn cn() utility
├── pages/
│   ├── Auth.tsx                  # Sign-in page (Google + email OTP)
│   ├── AuthCallback.tsx          # Handles OAuth/magic link redirects
│   ├── Home.tsx                  # Landing page (stub)
│   ├── CrewDirectory.tsx         # Browse crew members (stub)
│   ├── CrewProfile.tsx           # Individual crew profile (stub)
│   ├── Jobs.tsx                  # Job listings (stub)
│   ├── PostJob.tsx               # Create job posting (stub)
│   ├── Inbox.tsx                 # Messages — protected route (stub)
│   └── Profile.tsx               # Edit profile — protected route (stub)
└── types/
    ├── database.ts               # AUTO-GENERATED — run `pnpm gen-types` — do not manually edit
    └── models.ts                 # Convenience type exports (Profile, JobPost, etc.)
```

## Key Architecture Decisions

### Auth Flow
- Supabase Auth with Google OAuth and email OTP (magic links)
- `handle_new_user()` Postgres trigger auto-creates a profile row on signup
- The trigger uses `security definer` and `set search_path = public` (required for Supabase auth admin to find the profiles table)
- AuthContext uses two separate useEffects: one for session state (onAuthStateChange), one for profile fetching (reacts to user.id changes). This avoids a Supabase deadlock where querying inside onAuthStateChange hangs.
- Profile is fetched reactively when user changes, not inside the auth callback

### Layout & Routing
- React Router layout route pattern: `<Route element={<RootLayout />}>` wraps all pages except `/auth` and `/auth/callback`
- RootLayout uses `<Outlet />` — consistent max-w-6xl container with responsive padding
- Auth pages render without the navbar
- Protected routes use `<ProtectedRoute>` wrapper that redirects to `/auth`

### Navbar
- Single responsive component — no separate mobile layout
- Icons only on mobile (`hidden md:inline` on labels), icons + labels on desktop
- Animated sliding underline tracks active route via refs and getBoundingClientRect
- UserMenu returns null while `isLoading` or while `session && !profile` to prevent flicker
- Navbar hides right-side content with `invisible` class while auth loads

### Database Types
- `src/types/database.ts` is auto-generated from Supabase: `pnpm gen-types`
- `src/types/models.ts` has convenience type aliases — import from here in app code
- Only `src/lib/supabase.ts` imports the raw Database type

### Icons
- ALL icons come from `@phosphor-icons/react`, using the `Icon` suffix convention (e.g. `HouseIcon`, `UsersIcon`)
- Do NOT use Lucide icons

### Component Patterns
- Use shadcn/ui components for all UI elements — don't create custom components for things shadcn already provides (e.g. use Separator, not a custom Divider)
- Keep page files thin — extract reusable pieces into `components/`
- Every page gets a `<Helmet>` for SEO title

## Database Schema

Seven tables with RLS enabled on all:

### profiles
- Extends auth.users (id is FK to auth.users)
- username (unique), display_name, email, bio, position, location, country
- profile_image_url, showreel_url (YouTube embed)
- skills (text array — for filtering), experience_years
- availability_status: 'available' | 'busy' | 'not_looking'
- is_verified, is_premium (for future features)
- Auto-created on signup via trigger

### connections
- requester_id, recipient_id (both FK to profiles)
- status: 'pending' | 'accepted' | 'declined'
- Unique constraint on (requester_id, recipient_id)
- Check constraint prevents self-connections

### conversations
- Just id and created_at
- Participants tracked in junction table

### conversation_participants
- conversation_id (FK to conversations), user_id (FK to profiles)
- Unique on (conversation_id, user_id)

### messages
- conversation_id, sender_id, body, read_at (null = unread)
- RLS: only conversation participants can read/send

### job_posts
- posted_by (FK to profiles), title, company, description
- location, is_remote, type, category, experience_level, project_type
- compensation, deadline, is_active
- Public read when is_active = true, only poster can edit/delete

### job_applications
- job_id, applicant_id, cover_message, status
- Unique on (job_id, applicant_id) — one application per job per user
- Visible to both applicant and job poster

## RLS Policy Summary

- **Profiles:** Public read, owner insert/update/delete
- **Connections:** Participants can read, requester can create, recipient can accept/decline, either can delete
- **Conversations:** Participants can read, any authenticated user can create
- **Conversation participants:** Participants can view co-participants, authenticated users can add
- **Messages:** Participants can read/send/update (mark read)
- **Job posts:** Public read (active only), poster can create/update/delete
- **Job applications:** Applicant can read own, poster can read for their jobs, applicant can create, poster can update status

## Routes

| Path | Auth | Component |
|------|------|-----------|
| `/` | No | Redirects to `/home` |
| `/home` | No | Home |
| `/crew` | No | CrewDirectory |
| `/crew/:username` | No | CrewProfile |
| `/jobs` | No | Jobs |
| `/jobs/post` | No | PostJob |
| `/jobs/:id` | No | Job detail (stub) |
| `/auth` | No | Auth (sign in) |
| `/auth/callback` | No | AuthCallback |
| `/inbox` | **Yes** | Inbox |
| `/profile` | **Yes** | Profile |

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

- [x] Supabase project + database schema (7 tables, RLS, indexes, triggers)
- [x] Vite + React + TypeScript + shadcn/ui project scaffold
- [x] Supabase client with typed Database
- [x] Auth system (Google OAuth + email OTP)
- [x] Auto-profile creation on signup (Postgres trigger)
- [x] AuthContext with session persistence across refresh
- [x] Responsive navbar with sliding underline indicator
- [x] UserMenu with avatar dropdown
- [x] Protected routes (inbox, profile)
- [x] Layout route pattern with RootLayout
- [x] Auto-generated database types from Supabase CLI
- [x] Cloudflare Pages deployment

## What Needs to Be Built

### Core Features (MVP)
- [ ] Profile editor page (edit display_name, username, bio, position, location, skills, showreel, availability)
- [ ] Profile image upload (Supabase Storage)
- [ ] Crew directory page (list profiles, filter by position/skills, search)
- [ ] Crew profile page (public view of a user's profile via /crew/:username)
- [ ] Job listings page (browse active jobs, filter by type/category/experience)
- [ ] Job detail page (/jobs/:id)
- [ ] Post job page (create job form)
- [ ] Job application flow (apply with cover message)
- [ ] Connection system (send request, accept/decline, view connections, mutual connections)
- [ ] Messaging system (create conversation via "Contact" button on profiles, send/receive messages, unread indicators)
- [ ] Email notifications for new messages (Supabase Edge Function)
- [ ] Inbox page with conversation list and chat view

### Future Features (post-MVP)
- [ ] Stripe integration for premium tier
- [ ] Verification badges
- [ ] Forum / wall posts page with comments
- [ ] AI suggestion algorithm for forum content
- [ ] Profile availability calendar
- [ ] Gear rental page
- [ ] Favorite genre on profile
- [ ] Talent agents
- [ ] Locations page
- [ ] Invoice generator (after booking)
- [ ] Domain emails
- [ ] CDN for images
- [ ] Caching layer
- [ ] Terms of Service page
- [ ] Light/dark mode toggle

## Important Gotchas

1. **Supabase auth deadlock:** Never `await` a Supabase query inside `onAuthStateChange`. Use a separate `useEffect` that reacts to user changes.
2. **Trigger search path:** Any Postgres trigger function called by Supabase auth must use `security definer` and `set search_path = public`, otherwise it can't find your tables.
3. **Generated types:** `database.ts` is auto-generated. Never edit it manually. Add convenience types to `models.ts` instead.
4. **Icons:** Use `@phosphor-icons/react` everywhere. Import with `Icon` suffix: `HouseIcon`, `UsersIcon`, etc.
5. **shadcn components:** Use shadcn's built-in components before creating custom ones. Install new ones with `npx shadcn@latest add <component> -y`.
6. **Environment variables:** Only `VITE_` prefixed vars are available in the browser. `SUPABASE_ACCESS_TOKEN` is CLI-only.
7. **NavLinks indicator:** Uses `pathname ===` for exact matching (not `startsWith`) to prevent false matches on nested routes.