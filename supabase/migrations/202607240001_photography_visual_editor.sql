-- Phase 4: professional photography galleries and private visual-editor drafts.
-- Additive to 202607230001_advanced_cms.sql.

create table public.photography_gallery_drafts (
  content_id uuid primary key references public.content_entries(id) on delete cascade,
  layout jsonb not null default '{"version":1,"preset":"editorial-grid","sections":[]}'::jsonb,
  settings jsonb not null default '{}'::jsonb,
  updated_by uuid not null references public.admin_users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.photography_gallery_publications (
  content_id uuid primary key references public.content_entries(id) on delete cascade,
  layout jsonb not null,
  settings jsonb not null default '{}'::jsonb,
  version integer not null default 1 check (version > 0),
  published_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index photography_gallery_publications_updated_idx
  on public.photography_gallery_publications(updated_at desc);

create trigger photography_gallery_drafts_updated_at
before update on public.photography_gallery_drafts
for each row execute function public.set_updated_at();

create trigger photography_gallery_publications_updated_at
before update on public.photography_gallery_publications
for each row execute function public.set_updated_at();

alter table public.photography_gallery_drafts enable row level security;
alter table public.photography_gallery_publications enable row level security;

create policy "Admins manage photography drafts"
on public.photography_gallery_drafts for all to authenticated
using (public.is_admin()) with check (public.is_admin());

create policy "Admins manage photography publications"
on public.photography_gallery_publications for all to authenticated
using (public.is_admin()) with check (public.is_admin());

create policy "Public reads published photography layouts"
on public.photography_gallery_publications for select to anon
using (
  exists (
    select 1 from public.content_entries entry
    where entry.id = content_id
      and entry.kind = 'portfolio'
      and (
        (entry.status = 'published' and (entry.published_at is null or entry.published_at <= now()))
        or (entry.status = 'scheduled' and entry.scheduled_for <= now())
      )
  )
);

-- Media metadata and objects are public only while referenced by published content.
drop policy if exists "Public reads media metadata" on public.media_assets;
create policy "Public reads published media metadata"
on public.media_assets for select to anon
using (
  exists (
    select 1
    from public.content_asset_usage usage
    join public.content_entries entry on entry.id = usage.content_id
    where usage.asset_id = media_assets.id
      and (
        (entry.status = 'published' and (entry.published_at is null or entry.published_at <= now()))
        or (entry.status = 'scheduled' and entry.scheduled_for <= now())
      )
  )
);

drop policy if exists "Public reads CMS media" on storage.objects;
create policy "Admins read CMS media"
on storage.objects for select to authenticated
using (bucket_id = 'cms-media' and public.is_admin());

create policy "Public reads published CMS media"
on storage.objects for select to public
using (
  bucket_id = 'cms-media'
  and exists (
    select 1
    from public.media_assets asset
    join public.content_asset_usage usage on usage.asset_id = asset.id
    join public.content_entries entry on entry.id = usage.content_id
    where asset.storage_path = storage.objects.name
      and (
        (entry.status = 'published' and (entry.published_at is null or entry.published_at <= now()))
        or (entry.status = 'scheduled' and entry.scheduled_for <= now())
      )
  )
);
