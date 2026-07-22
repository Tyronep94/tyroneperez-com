# Tyrone Perez Creative — Phase 1

A private business-operations foundation for Tyrone Perez Creative. This phase includes a temporary public homepage, secure Supabase admin authentication, a responsive Today’s Agenda, client records, booking management, inquiry visibility, and a PostgreSQL/RLS foundation ready for later phases.

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

## Phase 1 feature checklist

- [x] Next.js App Router, TypeScript, Tailwind CSS, and Vercel-compatible build
- [x] Temporary public coming-soon homepage
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
  admin/
    bookings/       # list, create, detail/edit, status actions
    clients/        # list, create, detail/edit, history
    inquiries/      # incoming inquiry overview
    layout.tsx      # protected responsive admin shell
    page.tsx        # Today’s Agenda
  login/            # Supabase sign-in action and page
  page.tsx          # temporary public homepage
components/
  admin/            # navigation shell
  dashboard/        # agenda booking cards
  forms/            # reusable client, booking, and login forms
lib/
  auth/             # admin authorization
  database/         # feature queries
  supabase/         # browser, server, and proxy clients
  utils/            # Pacific-time helpers
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

## Known Phase 1 limitations

- Admin accounts and service catalog changes are managed in Supabase, not through dashboard settings.
- Inquiries are visible but do not yet have a full editing/conversion workflow.
- Search is intentionally simple and optimized for a small creative-business dataset.
- There are no automated end-to-end tests against a live Supabase project in the repository; live verification requires configured project credentials.
- Payments, contracts, client accounts, uploads/file delivery, calendar sync, public inquiry forms, and the final portfolio are intentionally excluded.

## Recommended Phase 2

Build the public services/portfolio experience and an inquiry intake workflow that creates client and inquiry records safely through a purpose-built public endpoint. Then add inquiry-to-booking conversion, service management, calendar views/sync, and notification preferences. Payments, contracts, and file delivery should remain separate scoped milestones.
