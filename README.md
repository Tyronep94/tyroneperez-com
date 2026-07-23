# Tyrone Perez Creative — Phase 2.1

A premium public brand website and private business-operations foundation for Tyrone Perez Creative. Phase 2.1 adds the complete public-facing visual experience while preserving the Phase 1 Supabase authentication, responsive admin dashboard, client records, booking management, inquiry visibility, and PostgreSQL/RLS foundation.

## Requirements

- Node.js 20.9 or newer
- pnpm 10+ (npm also works)
- A Supabase project
- A Vercel account for deployment

## Local installation

```bash
pnpm install
cp .env.example .env.local
```

Fill in `.env.local`, complete the Supabase setup below, and then run `pnpm dev`. Open [http://localhost:3000](http://localhost:3000).

## Environment variables

| Variable | Required | Usage |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Browser-safe publishable/anon key; RLS protects data |
| `SUPABASE_SERVICE_ROLE_KEY` | No | Reserved for future trusted maintenance code; Phase 1 never reads it |

Never prefix the service-role key with `NEXT_PUBLIC_`, commit it, or expose it in browser code.

## Supabase project and database setup

1. Create a project at Supabase and save its Project URL and anon/publishable key in `.env.local`.
2. In the Supabase SQL Editor, run [`supabase/migrations/202607220001_phase_1.sql`](supabase/migrations/202607220001_phase_1.sql). This creates the schema, indexes, triggers, RLS policies, and real service catalog.
3. Alternatively, with the Supabase CLI linked to the project, run `supabase db push`.
4. Confirm that RLS is enabled on `admin_users`, `clients`, `services`, `inquiries`, and `bookings`.
5. Optional development data: run [`supabase/seed.sql`](supabase/seed.sql) manually in a disposable development project. Never run it in production. It is not part of deployment or app startup.

Timestamps are stored as `timestamptz` (UTC-compatible). The app uses `America/Los_Angeles` for date boundaries, schedule grouping, display, and form conversion.

## Create the first admin

Public registration is intentionally unavailable.

1. In Supabase, open **Authentication → Users → Add user**.
2. Create the user with email and password, and copy the user UUID.
3. In the SQL Editor, run the following with the real values:

```sql
insert into public.admin_users (auth_user_id, display_name, email)
values ('AUTH-USER-UUID-HERE', 'Tyrone Perez', 'YOUR-ADMIN-EMAIL');
```

The SQL Editor runs with elevated project privileges, which is necessary to establish the first admin. After this row exists, that authenticated admin can access the private tables through the app. Additional admins can be connected the same way. A valid Supabase Auth session without a matching `admin_users` row is signed out and denied.

## Development and production commands

```bash
pnpm dev        # local server
pnpm typecheck  # strict TypeScript check
pnpm lint       # ESLint
pnpm build      # production build
pnpm start      # serve the production build
```

## Deploy to Vercel

1. Push this repository to a Git provider and import it into Vercel.
2. Keep the detected framework as **Next.js** and the standard build command (`pnpm build`).
3. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to Preview and Production environments.
4. Do not add the service-role key unless a future server-only feature explicitly requires it.
5. Deploy, then add the production URL to **Supabase → Authentication → URL Configuration** as the Site URL. Add the Vercel preview URL pattern to Redirect URLs if preview login testing is needed.

## Connect tyroneperez.com later

In Vercel, open the project’s **Settings → Domains**, add `tyroneperez.com` and optionally `www.tyroneperez.com`, then apply the DNS records Vercel provides at the domain registrar. Choose one canonical domain and redirect the other. After DNS is active, update the Supabase Site URL to `https://tyroneperez.com`. The app metadata already uses this production domain.

## Phase 2.1 public website

Phase 2.1 adds a shared editorial public layout with a responsive header, accessible mobile menu, footer, visible keyboard focus states, and reduced-motion support. Music and photography share the same warm-white, charcoal, and cognac brand system while using distinct moods: darker and studio-inspired for music, brighter and image-led for photography.

### Public routes

| Route | Purpose |
| --- | --- |
| `/` | Editorial homepage with creative pathways, selected work, services, and project CTA |
| `/music` | Music services, placeholder biography, featured sound, process, and FAQs |
| `/photography` | Photography services, placeholder biography, image grid, process, and FAQs |
| `/portfolio` | Client-side All/Photography/Music filters over structured local project data |
| `/portfolio/[slug]` | Static project detail pages with image- or audio-led layouts |
| `/about` | Personal introduction, background, disciplines, approach, and values |
| `/contact` | Direct contact options without a duplicate inquiry form |
| `/start` | Polished Phase 2.2 guided-inquiry placeholder |
| `/sitemap.xml` | Canonical public URL index |
| `/robots.txt` | Public crawling rules with private admin/login exclusions |

### Public layout and content

- `app/(public)/layout.tsx` owns the public header, footer, skip link, and visual stylesheet. It is separate from `app/admin/layout.tsx`.
- `components/public/` contains reusable public navigation, footer, CTA, service, media-placeholder, and portfolio-filter components.
- `content/public-site.ts` is the single editing surface for public copy, services, FAQs, contact information, social links, and placeholder portfolio data.
- `lib/seo.ts` creates consistent title, description, canonical, Open Graph, and X metadata.

### Replace placeholder copy

Edit `content/public-site.ts`. Items that specifically require Tyrone’s input are also labeled in the rendered site:

1. Music production biography
2. Photography biography
3. Homepage personal introduction
4. About-page introduction and creative background
5. Contact email, social URLs, and response-time expectation
6. Service wording that should reflect Tyrone’s exact process
7. Portfolio titles, stories, client/artist credits, and descriptions

The current copy does not invent awards, locations, years of experience, clients, credentials, testimonials, or production claims.

### Replace placeholder media

Abstract editorial blocks are intentionally used instead of unrelated stock photography. They are rendered by `components/public/media-placeholder.tsx` and clearly labeled for replacement.

When approved media is ready:

1. Add optimized files under `public/portfolio/`.
2. Extend each item in `content/public-site.ts` with its media path and descriptive alt text.
3. Replace `MediaPlaceholder` at the card/detail rendering boundary with `next/image` for photographs.
4. Add accessible, user-initiated audio controls for music projects. Never autoplay audio.
5. Replace the About portrait and Photography hero placeholders with approved images.

### SEO configuration

- Canonical origin: `https://tyroneperez.com`
- Shared branded social card: `public/og.png`
- Per-page metadata: page-level `metadata` exports using `publicMetadata`
- Dynamic portfolio metadata: `generateMetadata` in `/portfolio/[slug]`
- Public route index: `app/sitemap.ts`
- Search-engine rules: `app/robots.ts`

Change the canonical origin in `app/layout.tsx`, `lib/seo.ts`, `app/sitemap.ts`, and `app/robots.ts` if the production domain changes.

### Responsive testing notes

The public layout is designed around:

- 390px mobile: stacked pathways, single-column services and portfolio, 44px+ controls, mobile menu
- Tablet: two-column editorial layouts where useful
- Standard laptop: full navigation and balanced content grids
- Large desktop: capped container widths and fluid typography

The public stylesheet uses responsive `clamp()` typography, constrained containers, `overflow: clip`, explicit mobile grids, `:focus-visible`, and `prefers-reduced-motion`. Test real replacement images again because their aspect ratios may differ from the placeholders.

## Phase 1 admin feature checklist

- [x] Next.js App Router, TypeScript, Tailwind CSS, and Vercel-compatible build
- [x] Public homepage now replaced by the Phase 2.1 brand experience
- [x] Email/password login with no registration
- [x] Session refresh, protected admin routes, admin allowlist, and logout
- [x] Responsive desktop sidebar and mobile bottom navigation
- [x] Today’s Agenda using live Supabase records and Pacific-time day boundaries
- [x] Confirmed today, new inquiry, pending booking, follow-up, and upcoming views
- [x] Call, email, directions, client, booking, and mark-complete actions
- [x] Client search, create, edit, follow-up controls, and history
- [x] Booking search/filter, create, edit, confirm, complete, and cancel
- [x] End-after-start validation and UTC-compatible timestamp storage
- [x] Loading, empty, success, authentication, validation, database, and not-found states
- [x] PostgreSQL schema, indexes, update triggers, constraints, service data, and RLS
- [x] Optional manual-only development seed data

## Project structure

```text
app/
  (public)/           # shared public layout and all public brand routes
    music/
    photography/
    portfolio/
    about/
    contact/
    start/
  admin/
    bookings/       # list, create, detail/edit, status actions
    clients/        # list, create, detail/edit, history
    inquiries/      # incoming inquiry overview
    layout.tsx      # protected responsive admin shell
    page.tsx        # Today’s Agenda
  login/            # Supabase sign-in action and page
components/
  admin/            # navigation shell
  dashboard/        # agenda booking cards
  forms/            # reusable client, booking, and login forms
  public/           # public header, footer, services, portfolio, and CTA components
content/
  public-site.ts    # editable public copy and placeholder project content
lib/
  auth/             # admin authorization
  database/         # feature queries
  supabase/         # browser, server, and proxy clients
  utils/            # Pacific-time helpers
  seo.ts             # public metadata helper
supabase/
  migrations/       # production database setup
  seed.sql          # optional development-only examples
types/               # shared domain and action types
proxy.ts             # session refresh and route redirects
```

## Database tables

- `admin_users`: maps Supabase Auth identities to allowed administrators
- `clients`: contact details, notes, source, and follow-up state
- `services`: photography/music service catalog and default duration
- `inquiries`: incoming requests linked to clients and services
- `bookings`: scheduled work, location, category, status, and internal notes

All tables use UUID primary keys, timestamps, indexes, constraints, and automatic `updated_at` triggers. All private tables have RLS enabled. Access requires both an authenticated Supabase user and a matching `admin_users` record.

## Known limitations

- Admin accounts and service catalog changes are managed in Supabase, not through dashboard settings.
- Inquiries are visible but do not yet have a full editing/conversion workflow.
- Search is intentionally simple and optimized for a small creative-business dataset.
- There are no automated end-to-end tests against a live Supabase project in the repository; live verification requires configured project credentials.
- Portfolio records and media remain curated local placeholders rather than Supabase-backed content.
- The guided `/start` inquiry is a placeholder and does not submit data.
- Contact email, social URLs, response expectations, personal biographies, and all portfolio credits require Tyrone’s final content.
- There is no public service or portfolio administration in Phase 2.1.
- Payments, contracts, client accounts, uploads/file delivery, calendar sync, invoices, and messaging remain intentionally excluded.

## Recommended Phase 2.2

Build the guided `/start` inquiry experience with photography/music branching, accessible multi-step validation, spam protection, a secure server-only Supabase mutation, confirmation messaging, and admin inquiry detail/triage. Keep portfolio administration, service administration, inquiry-to-booking conversion, payments, contracts, and file delivery outside that milestone unless they are separately scoped.
