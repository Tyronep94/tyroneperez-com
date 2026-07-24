-- Page-first visual editing for the five primary public website pages.

create table public.website_page_drafts (
  page_key text primary key check (page_key in ('home','photography','music','about','contact')),
  document jsonb not null,
  updated_by uuid not null references public.admin_users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.website_page_publications (
  page_key text primary key check (page_key in ('home','photography','music','about','contact')),
  document jsonb not null,
  version integer not null default 1 check (version > 0),
  published_by uuid not null references public.admin_users(id) on delete restrict,
  published_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger website_page_drafts_updated_at
before update on public.website_page_drafts
for each row execute function public.set_updated_at();

create trigger website_page_publications_updated_at
before update on public.website_page_publications
for each row execute function public.set_updated_at();

alter table public.website_page_drafts enable row level security;
alter table public.website_page_publications enable row level security;

create policy "Admins manage website page drafts"
on public.website_page_drafts for all to authenticated
using (public.is_admin()) with check (public.is_admin());

create policy "Admins manage website page publications"
on public.website_page_publications for all to authenticated
using (public.is_admin()) with check (public.is_admin());

create policy "Public reads website page publications"
on public.website_page_publications for select to anon
using (true);
