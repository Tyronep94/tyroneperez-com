-- Preserve image geometry as first-class media metadata.
alter table public.media_assets
  add column if not exists aspect_ratio numeric,
  add column if not exists orientation text
    check (orientation in ('landscape', 'portrait', 'square')),
  add column if not exists object_status text not null default 'unknown'
    check (object_status in ('available', 'missing', 'unknown')),
  add column if not exists object_checked_at timestamptz;

update public.media_assets
set
  aspect_ratio = width::numeric / nullif(height, 0),
  orientation = case
    when width is null or height is null then null
    when width = height then 'square'
    when width > height then 'landscape'
    else 'portrait'
  end
where aspect_ratio is null or orientation is null;

create or replace function public.protect_website_media_references() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if exists (
    select 1 from public.website_page_drafts
    where document::text like '%' || old.id::text || '%'
  ) or exists (
    select 1 from public.website_page_publications
    where document::text like '%' || old.id::text || '%'
  ) then
    raise exception 'Media asset % is referenced by a website page', old.id
      using errcode = '23503';
  end if;
  return old;
end; $$;

drop trigger if exists protect_website_media_references on public.media_assets;
create trigger protect_website_media_references
before delete on public.media_assets
for each row execute function public.protect_website_media_references();
