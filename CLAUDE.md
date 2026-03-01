# CLAUDE.md — FilmCrew Project Context

## What is FilmCrew?

FilmCrew is a LinkedIn-style web platform for film industry professionals. Users create profiles, connect with each other, message internally (no personal contact info exposed), browse a crew directory, and post/apply for jobs. There are free and premium tiers (Stripe integration planned).

## Tech Stack

- **Frontend:** React 19 + TypeScript + Vite
- **Styling:** Tailwind CSS 4 + shadcn/ui (Maia style, Stone base, Phosphor icons, DM Sans font, medium radius, subtle menu accent)
- **Routing:** React Router DOM 7 (layout route pattern, BrowserRouter)
- **Data Fetching:** TanStack Query (profiles, crew directory, crew profiles, connections, conversations, messages)
- **SEO:** react-helmet-async
- **Backend:** Supabase (Postgres, Auth, RLS, Realtime, Edge Functions for future server-side tasks)
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
│   │   ├── GoogleButton.tsx      # Google OAuth sign-in button
│   │   ├── EmailForm.tsx         # Email OTP (magic link) form
│   │   └── ProtectedRoute.tsx    # Redirects to /auth if not signed in
│   ├── connections/
│   │   ├── ConnectButton.tsx     # Connection action button (send/withdraw/accept/decline/remove)
│   │   ├── ConnectionCard.tsx    # Connection list item with profile info + actions
│   │   └── ConnectionsList.tsx   # Full connections list with tabs/filtering
│   ├── crew/
│   │   ├── CrewCard.tsx          # Profile card for directory grid (bio preview, skills, availability, connection indicator)
│   │   ├── CrewFilters.tsx       # Search + position/availability/skill dropdowns (URL param synced)
│   │   ├── CrewGrid.tsx          # Responsive card grid + empty state (fetches + passes connection statuses)
│   │   ├── CrewSkeleton.tsx      # Skeleton loading grid
│   │   ├── CrewPagination.tsx    # Previous/next pagination controls
│   │   ├── CrewProfileHeader.tsx # Public profile hero (avatar, name, position, meta, connect + message buttons)
│   │   ├── CrewProfileDetails.tsx# Public profile body (bio, links, skills, showreel)
│   │   ├── CrewProfileSkeleton.tsx # Loading state for public profile
│   │   └── CrewProfileNotFound.tsx # 404 state with link back to directory
│   ├── inbox/
│   │   ├── ConversationList.tsx  # Sidebar list of conversations with unread indicators
│   │   ├── ChatView.tsx          # Message thread with header, messages, typing indicator, input
│   │   └── ChatBubble.tsx        # Individual message bubble (sent/received styling)
│   ├── layout/
│   │   ├── Navbar.tsx            # Sticky top nav, composes NavLinks + UserMenu
│   │   ├── NavLinks.tsx          # Nav links with animated sliding underline + unread badge on Inbox
│   │   ├── UserMenu.tsx          # Avatar dropdown (signed in) or sign-in button
│   │   └── RootLayout.tsx        # Layout wrapper with Navbar + Outlet
│   ├── ui/                       # shadcn components (don't manually edit)
│   ├── profile/
│   │   ├── BasicInfoSection.tsx
│   │   ├── RoleExperienceSection.tsx
│   │   ├── LocationSection.tsx
│   │   ├── SkillsSection.tsx
│   │   ├── LinksSection.tsx      # IMDb + website URL fields
│   │   ├── ShowreelSection.tsx
│   │   ├── ProfileImageUpload.tsx
│   │   ├── ShowreelPlayer.tsx    # YouTube thumbnail → iframe player (reused on crew profile)
│   │   ├── SkillsPicker.tsx
│   │   ├── ClearableInput.tsx
│   │   └── ProfileSkeleton.tsx
├── context/
│   └── AuthContext.tsx            # Auth state provider (session, profile, sign in/out)
├── hooks/
│   ├── useProfile.ts             # TanStack Query: fetch/cache own profile + invalidate helper
│   ├── useProfileForm.ts         # Profile form state/validation/save UX (toasts, scroll-to-error, dirty)
│   ├── useCrewDirectory.ts       # TanStack Query: paginated/filtered crew list, URL param state
│   ├── useCrewProfile.ts         # TanStack Query: fetch single profile by username
│   ├── useConnection.ts          # Single connection lifecycle (send/withdraw/accept/decline/remove)
│   ├── useConnections.ts         # List all connections for current user
│   ├── useConnectionStatuses.ts  # Batch-fetch connection statuses for directory cards
│   ├── useConversations.ts       # TanStack Query: conversation list with previews + Realtime updates
│   ├── useMessages.ts            # TanStack Query: messages for a conversation + Realtime + mark-as-read + typing
│   ├── useStartConversation.ts   # Find or create 1:1 conversation via RPC, navigate to inbox
│   ├── useUnreadCount.ts         # Global unread message count via RPC + Realtime (powers navbar badge)
│   ├── useScrollRestoration.ts   # Save/restore scroll position for directory ↔ profile navigation
│   └── useNavigationGuard.ts     # beforeunload-only unsaved changes guard
├── lib/
│   ├── supabase.ts               # Supabase client instance (typed with Database)
│   ├── constants.ts              # positions, availability options, predefined skills list
│   └── utils.ts                  # shadcn cn() utility
├── pages/
│   ├── Auth.tsx                  # Sign-in page (Google + email OTP)
│   ├── AuthCallback.tsx          # Loading screen only; auth redirect logic handled by AuthContext
│   ├── Home.tsx                  # Landing page (stub)
│   ├── CrewDirectory.tsx         # Browse crew — composes filters + grid + pagination
│   ├── CrewProfile.tsx           # Public profile — composes header + details + back/edit nav
│   ├── Connections.tsx           # Connections list — protected route
│   ├── Jobs.tsx                  # Job listings (stub)
│   ├── PostJob.tsx               # Create job posting (stub)
│   ├── Inbox.tsx                 # Messages — conversation list + chat view, responsive layout
│   └── Profile.tsx               # Edit profile — thin shell composing sections + hook + skeleton
└── types/
    ├── database.ts               # AUTO-GENERATED — run `pnpm gen-types` — do not manually edit
    └── models.ts                 # Convenience type exports (Profile, JobPost, etc.)
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
- `useProfile()` = TanStack Query hook for own profile data fetching/caching/invalidation.
- `useCrewDirectory()` = TanStack Query hook for paginated crew list with URL param filters.
- `useCrewProfile()` = TanStack Query hook for fetching a single profile by username.
- `useConnection()` = TanStack Query hook for single connection lifecycle with a target user.
- `useConnections()` = TanStack Query hook for listing all of the current user's connections.
- `useConnectionStatuses()` = Batch-fetch connection statuses for a page of directory cards (single query).
- `useConversations()` = TanStack Query hook for conversation list with message previews and unread counts.
- `useMessages()` = TanStack Query hook for a single conversation's messages with Realtime subscription.
- `useUnreadCount()` = Global unread count via RPC, powers the navbar badge.
- Profile save is a TanStack `useMutation`, and on success it invalidates the own profile, crew profile, and crew directory caches.

### Cache Invalidation Strategy
- Profile save invalidates three query families:
  - `["profiles", userId]` — own profile cache
  - `["crew-profile"]` — all cached crew profile pages
  - `["crew"]` — all cached directory pages
- Messaging mark-as-read invalidates:
  - `["conversations"]` — conversation list (unread counts)
  - `["unread-count"]` — navbar badge
- `useInvalidateProfile()` returns a promise so callers can `await` before navigating (prevents stale cache bugs).

### Layout & Routing
- React Router layout route pattern: `<Route element={<RootLayout />}>` wraps all pages except `/auth` and `/auth/callback`
- RootLayout uses `<Outlet />` — consistent max-w-6xl container with responsive padding
- Auth pages render without the navbar
- Protected routes use `<ProtectedRoute>` wrapper that redirects to `/auth`
- App currently uses **BrowserRouter**, not a "data router".
  - This means React Router's `useBlocker` is NOT available.
  - Unsaved changes protection is **beforeunload only** (tab close/refresh). In-app navigation blocking would require migrating to `createBrowserRouter`.

### Navbar
- Single responsive component — no separate mobile layout
- Icons only on mobile (`hidden md:inline` on labels), icons + labels on desktop
- Animated sliding underline tracks active route via refs and getBoundingClientRect
- Inbox link shows unread badge (count from `useUnreadCount`)
- UserMenu returns null while `isLoading` or while `session && !profile` to prevent flicker, pulls profile via `useProfile()`.
- Navbar hides right-side content with `invisible` class while auth loads

### Database Types
- `src/types/database.ts` is auto-generated from Supabase: `pnpm gen-types`
- `src/types/models.ts` has convenience type aliases — import from here in app code
- Only `src/lib/supabase.ts` imports the raw Database type

### Profile Editor UX
- Profile page is split into small sections + one hook; page file stays thin.
- Form state initialised with lazy `useState(() => buildInitialForm(profile))` to avoid stale data on mount.
- Loading state uses shadcn `<Skeleton />` via `ProfileSkeleton`.
- Toasts use `sonner` (Toaster mounted in `main.tsx`).
- Save UX:
  - Success toast on save.
  - Error toast on validation/server errors.
  - Scrolls + focuses first invalid field when validation fails.
  - Navigates to `/crew/:username` after save (awaits cache invalidation first).
- Clearable text inputs (X button) for display name, username, bio, city, country, showreel URL, IMDb, website.
- Bio has a 500-character limit + counter.
- Skills:
  - Search/select + removable chips.
  - Supports predefined list + custom entries.
  - Max 15 skills cap.
- Links:
  - IMDb URL validated against imdb.com domain.
  - Website URL validated as valid http/https URL.
- Select dropdowns:
  - Use popper positioning to avoid scroll/jump bugs.
  - Experience dropdown disables collision avoidance to keep it anchored below.

### Crew Directory
- Server-side filtering via Supabase PostgREST: `.ilike()` for text search, `.eq()` for exact matches, `.contains()` for skills array.
- Filter state stored in URL search params — shareable/bookmarkable.
- Search input debounced at 300ms to avoid excessive queries.
- Only profiles with `has_completed_setup = true` appear.
- Sorted by availability (available first) then most recently updated.
- Pagination: 12 per page, `keepPreviousData` for smooth transitions.
- Scroll restoration: position saved on card click, restored after data loads on back navigation.
- Scroll to top (smooth) on page change.
- Connection status indicators on cards (connected/pending) via batched `useConnectionStatuses` query.

### Crew Profile (Public View)
- Fetched by username via `useCrewProfile`.
- Shows full bio, all skills (no truncation), showreel player, and links (IMDb + website).
- Website URL displayed with cleaned hostname (strips protocol/www/trailing slash).
- ConnectButton for connection lifecycle (send/withdraw/accept/decline/remove).
- Message button to start/resume conversation (via `useStartConversation`).
- "Edit profile" button shown when viewing own profile.
- 404 state with link back to directory.

### Connection System
- Full lifecycle: send request → pending → accept/decline → connected → remove.
- `useConnection(targetUserId)` manages single connection state and mutations.
- `useConnections()` fetches all connections for the current user (for `/connections` page).
- `useConnectionStatuses(userIds)` batch-fetches statuses for a page of directory cards — single query instead of N per card.
- ConnectButton renders appropriate action based on connection state (context-aware labels + icons).
- Directory cards show subtle connection indicator (connected/pending) with tooltip.

### Messaging System
- **Supabase Realtime** for live message delivery and typing indicators.
- Realtime enabled on `messages`, `conversations`, and `conversation_participants` tables.
- `find_or_create_conversation` RPC (security definer) finds existing 1:1 or creates new — avoids RLS circular dependency.
- `get_unread_count` RPC (security definer) counts unread messages server-side — replaces broken PostgREST subquery.
- `is_conversation_member` helper function (security definer) breaks circular RLS on `conversation_participants`.
- `useStartConversation` — single RPC call to find/create conversation, navigates to `/inbox/:id`.
- `useConversations` — fetches conversation list with other participant profiles, last message preview, unread counts. Realtime subscription for live updates. `refetchOnMount: "always"` to prevent stale inbox.
- `useMessages` — fetches messages for active conversation. Realtime INSERT subscription for live messages. Mark-as-read on view (with `markedIdsRef` to prevent loops). Typing indicators via Supabase broadcast channels. `staleTime: 0` to always fetch fresh data.
- `useUnreadCount` — global unread count via RPC, Realtime subscription on message changes, powers navbar badge. Exported `unreadKeys` for cross-hook invalidation.
- Inbox page: responsive split layout (sidebar list + chat view). Mobile shows one or the other. Desktop shows both side-by-side.
- ChatView: message bubbles, auto-scroll to bottom, typing indicator animation, textarea input with Enter to send.

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
- imdb_url, website_url
- skills (text array — for filtering), experience_years
- availability_status: 'available' | 'busy' | 'not_looking'
- is_verified, is_premium (for future features)
- has_completed_setup (boolean, default false)
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
- RLS: only conversation participants can read/send/update

### job_posts
- posted_by (FK to profiles), title, company, description
- location, is_remote, type, category, experience_level, project_type
- compensation, deadline, is_active
- Public read when is_active = true, only poster can edit/delete

### job_applications
- job_id, applicant_id, cover_message, status
- Unique on (job_id, applicant_id) — one application per job per user
- Visible to both applicant and job poster

## Database Functions (RPCs)

### find_or_create_conversation(target_user_id uuid) → uuid
- Security definer, bypasses RLS
- Finds existing 1:1 conversation between caller and target, or creates one
- Prevents self-conversations
- Used by `useStartConversation` hook

### get_unread_count() → integer
- Security definer, bypasses RLS
- Counts messages where caller is a participant but not sender, and read_at is null
- Used by `useUnreadCount` hook

### is_conversation_member(conv_id uuid) → boolean
- Security definer helper function
- Checks if auth.uid() is a participant in the given conversation
- Used by RLS policies on `conversation_participants` and `messages` to break circular self-referencing

## RLS Policy Summary

- **Profiles:** Public read, owner insert/update/delete
- **Connections:** Participants can read, requester can create, recipient can accept/decline, either can delete
- **Conversations:** Participants can read, any authenticated user can create
- **Conversation participants:** Participants can view co-participants (via `is_conversation_member` helper), authenticated users can add
- **Messages:** Participants can read/send/update via `is_conversation_member` helper (breaks circular RLS dependency)
- **Job posts:** Public read (active only), poster can create/update/delete
- **Job applications:** Applicant can read own, poster can read for their jobs, applicant can create, poster can update status

## Supabase Realtime

Realtime publication enabled on:
- `messages` — live message delivery in chat
- `conversations` — conversation list updates
- `conversation_participants` — participant changes

Used for:
- Live message delivery (Postgres Changes INSERT on messages)
- Typing indicators (Broadcast channels per conversation)
- Inbox list refresh (Postgres Changes on messages)
- Unread badge refresh (Postgres Changes on messages)

## Routes

| Path | Auth | Component |
|------|------|-----------|
| `/` | No | Redirects to `/home` |
| `/home` | No | Home |
| `/crew` | No | CrewDirectory |
| `/crew/:username` | No | CrewProfile |
| `/connections` | **Yes** | Connections |
| `/jobs` | No | Jobs |
| `/jobs/post` | No | PostJob |
| `/jobs/:id` | No | Job detail (stub) |
| `/auth` | No | Auth (sign in) |
| `/auth/callback` | No | AuthCallback |
| `/inbox` | **Yes** | Inbox |
| `/inbox/:conversationId` | **Yes** | Inbox (with active chat) |
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
- [x] AuthContext with session persistence across refresh + safe sign-in side-effects (no async in onAuthStateChange)
- [x] TanStack Query wired for profiles (useProfile, useCrewDirectory, useCrewProfile)
- [x] Responsive navbar with sliding underline indicator + unread badge
- [x] UserMenu with avatar dropdown
- [x] Protected routes (inbox, profile, connections)
- [x] Profile Editor (sections + image upload + showreel preview + skills picker + links)
- [x] Profile setup wizard redirect via `has_completed_setup`
- [x] Layout route pattern with RootLayout
- [x] Auto-generated database types from Supabase CLI
- [x] Profile skeleton loading state + Sonner toasts
- [x] Cloudflare Pages deployment
- [x] Crew Directory (search, filter by position/availability/skill, pagination, sorted by availability)
- [x] Crew Profile public view (header, bio, skills, links, showreel, 404 state)
- [x] Bio preview on directory cards
- [x] IMDb + website URL on profiles (schema, editor, public view)
- [x] Scroll restoration for directory ↔ profile navigation
- [x] Cross-cache invalidation on profile save (own profile + crew profile + directory)
- [x] Dev seed data (24 fake profiles via SQL, removable)
- [x] Connection system (send/withdraw/accept/decline/remove, full lifecycle)
- [x] Connection status indicators on directory cards (batched query)
- [x] Connections list page (/connections)
- [x] Messaging system with Supabase Realtime
- [x] find_or_create_conversation RPC (bypasses RLS circular dependency)
- [x] get_unread_count RPC (server-side unread count)
- [x] is_conversation_member helper (breaks circular RLS on conversation_participants)
- [x] Inbox page with conversation list + chat view (responsive split layout)
- [x] Real-time message delivery + typing indicators
- [x] Mark-as-read on conversation view + unread badge in navbar
- [x] Realtime enabled on messages, conversations, conversation_participants

## What Needs to Be Built

### Core Features (MVP)
- [ ] Email notifications for new messages (Supabase Edge Function)
- [ ] Job listings page (browse active jobs, filter by type/category/experience)
- [ ] Job detail page (/jobs/:id)
- [ ] Post job page (create job form)
- [ ] Job application flow (apply with cover message)

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
8. **Profile form initialisation:** Use lazy `useState(() => buildInitialForm(profile))` — not `useState(buildInitialForm(null))` — to avoid stale empty form when TanStack Query cache has data.
9. **Cache invalidation on save:** Always `await` invalidation before navigating. Invalidate all related query families (own profile, crew profile, crew directory) to prevent stale data across views.
10. **Select "all" sentinel:** shadcn Select doesn't support empty string values. Use a sentinel value like `"__all__"` and map it back to `""` in the filter handler.
11. **UUID LIKE queries:** Postgres UUIDs need `::text` cast for LIKE operations (e.g. `WHERE id::text LIKE '...'`).
12. **React 19 useRef:** Requires explicit initial value — use `useRef<T>(undefined)` not `useRef<T>()`.
13. **RLS circular dependencies:** Self-referencing RLS policies (where a table's policy queries itself) cause PostgREST 500 errors. Fix by extracting the check into a `security definer` helper function (e.g. `is_conversation_member`).
14. **Supabase Realtime requires publication:** Tables must be added to the `supabase_realtime` publication for Realtime subscriptions to work: `alter publication supabase_realtime add table <table_name>;`
15. **PostgREST subquery limitations:** Supabase's JS client `.in()` with a nested `.from().select()` doesn't work as a real SQL subquery. Use an RPC instead for queries that need subselects.
16. **Mark-as-read loop prevention:** When marking messages as read via a `useEffect` that depends on `query.data`, track already-marked IDs in a ref to prevent infinite re-fires. Use `staleTime: 0` and clear the ref on unmount.
17. **Supabase update 204 ≠ success:** A 204 response from `.update()` means the query executed but may have matched zero rows (RLS filtered them out). Always verify the actual database state when debugging.