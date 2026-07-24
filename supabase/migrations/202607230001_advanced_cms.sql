-- Part 16: advanced CMS foundation.
-- Run after 202607220001_phase_1.sql.

create type public.content_status as enum ('draft', 'scheduled', 'published', 'archived');
create type public.content_kind as enum ('page', 'portfolio', 'album', 'song');
create type public.media_kind as enum ('image', 'audio', 'video', 'document');

create table public.content_entries (
  id uuid primary key default gen_random_uuid(),
  kind public.content_kind not null,
  title text not null check (char_length(trim(title)) > 0),
  slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  excerpt text,
  content jsonb not null default '{"type":"doc","content":[]}'::jsonb,
  status public.content_status not null default 'draft',
  category text,
  featured boolean not null default false,
  pinned boolean not null default false,
  view_count bigint not null default 0 check (view_count >= 0),
  cover_asset_id uuid,
  seo_title text,
  seo_description text,
  og_asset_id uuid,
  canonical_url text,
  robots text not null default 'index,follow',
  scheduled_for timestamptz,
  published_at timestamptz,
  created_by uuid not null references public.admin_users(id) on delete restrict,
  updated_by uuid not null references public.admin_users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (kind, slug),
  constraint scheduled_content_has_date check (status <> 'scheduled' or scheduled_for is not null)
);

create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  storage_path text not null unique,
  public_url text not null,
  title text not null,
  filename text not null,
  alt_text text,
  caption text,
  description text,
  copyright text,
  photographer text,
  kind public.media_kind not null default 'image',
  mime_type text not null,
  width integer check (width is null or width > 0),
  height integer check (height is null or height > 0),
  file_size bigint not null check (file_size >= 0),
  variants jsonb not null default '{}'::jsonb,
  uploaded_by uuid not null references public.admin_users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.content_entries
  add constraint content_cover_asset_fk foreign key (cover_asset_id) references public.media_assets(id) on delete set null,
  add constraint content_og_asset_fk foreign key (og_asset_id) references public.media_assets(id) on delete set null;

create table public.collections (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.content_collections (
  content_id uuid not null references public.content_entries(id) on delete cascade,
  collection_id uuid not null references public.collections(id) on delete cascade,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  primary key (content_id, collection_id)
);

create table public.tags (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  created_at timestamptz not null default now()
);

create table public.media_tags (
  asset_id uuid not null references public.media_assets(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  primary key (asset_id, tag_id)
);

create table public.media_collections (
  asset_id uuid not null references public.media_assets(id) on delete cascade,
  collection_id uuid not null references public.collections(id) on delete cascade,
  primary key (asset_id, collection_id)
);

create table public.content_revisions (
  id uuid primary key default gen_random_uuid(),
  content_id uuid not null references public.content_entries(id) on delete cascade,
  revision_number integer not null,
  snapshot jsonb not null,
  change_summary text,
  edited_by uuid not null references public.admin_users(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (content_id, revision_number)
);

create table public.content_asset_usage (
  content_id uuid not null references public.content_entries(id) on delete cascade,
  asset_id uuid not null references public.media_assets(id) on delete restrict,
  usage_role text not null default 'body',
  created_at timestamptz not null default now(),
  primary key (content_id, asset_id, usage_role)
);

create or replace function public.sync_featured_asset_usage() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  delete from public.content_asset_usage where content_id = new.id and usage_role in ('cover', 'social');
  if new.cover_asset_id is not null then
    insert into public.content_asset_usage(content_id, asset_id, usage_role) values (new.id, new.cover_asset_id, 'cover');
  end if;
  if new.og_asset_id is not null then
    insert into public.content_asset_usage(content_id, asset_id, usage_role) values (new.id, new.og_asset_id, 'social')
    on conflict do nothing;
  end if;
  return new;
end; $$;
create trigger sync_featured_asset_usage after insert or update of cover_asset_id, og_asset_id
on public.content_entries for each row execute function public.sync_featured_asset_usage();

create table public.cms_activity (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references public.admin_users(id) on delete restrict,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  summary text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index content_entries_status_kind_idx on public.content_entries(status, kind, published_at desc);
create index content_entries_featured_idx on public.content_entries(featured, pinned, published_at desc) where status = 'published';
create index content_entries_search_idx on public.content_entries using gin (to_tsvector('english', coalesce(title,'') || ' ' || coalesce(excerpt,'') || ' ' || coalesce(category,'')));
create index media_assets_created_idx on public.media_assets(created_at desc);
create index media_assets_search_idx on public.media_assets using gin (to_tsvector('english', coalesce(title,'') || ' ' || coalesce(filename,'') || ' ' || coalesce(alt_text,'')));
create index content_revisions_content_idx on public.content_revisions(content_id, revision_number desc);
create index cms_activity_created_idx on public.cms_activity(created_at desc);

create trigger content_entries_updated_at before update on public.content_entries for each row execute function public.set_updated_at();
create trigger media_assets_updated_at before update on public.media_assets for each row execute function public.set_updated_at();
create trigger collections_updated_at before update on public.collections for each row execute function public.set_updated_at();

create or replace function public.capture_content_revision() returns trigger
language plpgsql security definer set search_path = public as $$
declare next_revision integer;
begin
  if row(new.title, new.slug, new.excerpt, new.content, new.status, new.category, new.featured, new.pinned,
         new.cover_asset_id, new.seo_title, new.seo_description, new.og_asset_id, new.canonical_url,
         new.robots, new.scheduled_for)
     is distinct from
     row(old.title, old.slug, old.excerpt, old.content, old.status, old.category, old.featured, old.pinned,
         old.cover_asset_id, old.seo_title, old.seo_description, old.og_asset_id, old.canonical_url,
         old.robots, old.scheduled_for) then
    select coalesce(max(revision_number), 0) + 1 into next_revision
    from public.content_revisions where content_id = old.id;
    insert into public.content_revisions(content_id, revision_number, snapshot, change_summary, edited_by)
    values (old.id, next_revision, to_jsonb(old), 'Automatic revision', new.updated_by);
  end if;
  return new;
end; $$;
create trigger capture_content_revision before update on public.content_entries
for each row execute function public.capture_content_revision();

create or replace function public.publish_due_content() returns integer
language plpgsql security definer set search_path = public as $$
declare changed integer;
begin
  update public.content_entries
  set status = 'published', published_at = coalesce(published_at, now()), updated_at = now()
  where status = 'scheduled' and scheduled_for <= now();
  get diagnostics changed = row_count;
  return changed;
end; $$;

alter table public.content_entries enable row level security;
alter table public.media_assets enable row level security;
alter table public.collections enable row level security;
alter table public.content_collections enable row level security;
alter table public.tags enable row level security;
alter table public.media_tags enable row level security;
alter table public.media_collections enable row level security;
alter table public.content_revisions enable row level security;
alter table public.content_asset_usage enable row level security;
alter table public.cms_activity enable row level security;

create policy "Admins manage content" on public.content_entries for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Public reads published content" on public.content_entries for select to anon using (
  (status = 'published' and (published_at is null or published_at <= now()))
  or (status = 'scheduled' and scheduled_for <= now())
);
create policy "Admins manage media" on public.media_assets for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Public reads media metadata" on public.media_assets for select to anon using (true);
create policy "Admins manage collections" on public.collections for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Public reads collections" on public.collections for select to anon using (true);
create policy "Admins manage content collections" on public.content_collections for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Public reads content collections" on public.content_collections for select to anon using (
  exists (select 1 from public.content_entries e where e.id = content_id and (
    e.status = 'published' or (e.status = 'scheduled' and e.scheduled_for <= now())
  ))
);
create policy "Admins manage tags" on public.tags for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage media tags" on public.media_tags for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage media collections" on public.media_collections for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage revisions" on public.content_revisions for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage usage" on public.content_asset_usage for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins read activity" on public.cms_activity for select to authenticated using (public.is_admin());
create policy "Admins create activity" on public.cms_activity for insert to authenticated with check (public.is_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('cms-media', 'cms-media', true, 52428800, array['image/jpeg','image/png','image/webp','image/gif','image/avif','audio/mpeg','audio/wav','video/mp4','application/pdf'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy "Admins upload CMS media" on storage.objects for insert to authenticated
with check (bucket_id = 'cms-media' and public.is_admin());
create policy "Admins update CMS media" on storage.objects for update to authenticated
using (bucket_id = 'cms-media' and public.is_admin()) with check (bucket_id = 'cms-media' and public.is_admin());
create policy "Admins delete CMS media" on storage.objects for delete to authenticated
using (bucket_id = 'cms-media' and public.is_admin());
create policy "Public reads CMS media" on storage.objects for select to public using (bucket_id = 'cms-media');

insert into public.collections(name, slug, description, sort_order) values
('Church', 'church', 'Worship, services, and church events.', 10),
('Conference', 'conference', 'Conference and gathering coverage.', 20),
('Portrait', 'portrait', 'Portrait and personal-brand work.', 30),
('Worship', 'worship', 'Music and visual work centered on worship.', 40),
('Travel', 'travel', 'Stories made while traveling.', 50),
('Lifestyle', 'lifestyle', 'Natural, documentary lifestyle work.', 60)
on conflict (slug) do nothing;
