-- Add first-class uploaded audio and official Spotify players to Portfolio entries.

alter table public.content_entries
  add column media_type text,
  add column audio_asset_id uuid references public.media_assets(id) on delete set null,
  add column audio_title text,
  add column audio_role text,
  add column audio_caption text,
  add column audio_artwork_asset_id uuid references public.media_assets(id) on delete set null,
  add column spotify_url text,
  add column spotify_entity_type text,
  add column spotify_entity_id text,
  add column spotify_embed_url text,
  add column spotify_title text,
  add column spotify_thumbnail_url text,
  add constraint content_audio_media_type_check
    check (media_type is null or media_type in ('uploaded_audio', 'spotify')),
  add constraint content_spotify_entity_type_check
    check (spotify_entity_type is null or spotify_entity_type in ('track', 'album', 'playlist', 'artist', 'show', 'episode')),
  add constraint content_audio_media_shape_check
    check (
      (media_type is null
        and audio_asset_id is null
        and spotify_url is null
        and spotify_entity_type is null
        and spotify_entity_id is null
        and spotify_embed_url is null)
      or
      (media_type = 'uploaded_audio'
        and audio_asset_id is not null
        and spotify_url is null
        and spotify_entity_type is null
        and spotify_entity_id is null
        and spotify_embed_url is null)
      or
      (media_type = 'spotify'
        and audio_asset_id is null
        and spotify_url ~ '^https://(open[.]spotify[.]com|spotify[.]link)/'
        and spotify_entity_type is not null
        and spotify_entity_id ~ '^[A-Za-z0-9]{10,64}$'
        and spotify_embed_url = 'https://open.spotify.com/embed/' || spotify_entity_type || '/' || spotify_entity_id)
    );

create index content_entries_audio_asset_idx on public.content_entries(audio_asset_id)
where audio_asset_id is not null;

create or replace function public.sync_featured_asset_usage() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  delete from public.content_asset_usage
  where content_id = new.id and usage_role in ('cover', 'social', 'audio', 'audio-artwork');
  if new.cover_asset_id is not null then
    insert into public.content_asset_usage(content_id, asset_id, usage_role)
    values (new.id, new.cover_asset_id, 'cover');
  end if;
  if new.og_asset_id is not null then
    insert into public.content_asset_usage(content_id, asset_id, usage_role)
    values (new.id, new.og_asset_id, 'social') on conflict do nothing;
  end if;
  if new.audio_asset_id is not null then
    insert into public.content_asset_usage(content_id, asset_id, usage_role)
    values (new.id, new.audio_asset_id, 'audio');
  end if;
  if new.audio_artwork_asset_id is not null then
    insert into public.content_asset_usage(content_id, asset_id, usage_role)
    values (new.id, new.audio_artwork_asset_id, 'audio-artwork');
  end if;
  return new;
end; $$;

drop trigger if exists sync_featured_asset_usage on public.content_entries;
create trigger sync_featured_asset_usage
after insert or update of cover_asset_id, og_asset_id, audio_asset_id, audio_artwork_asset_id
on public.content_entries for each row execute function public.sync_featured_asset_usage();

create or replace function public.capture_content_revision() returns trigger
language plpgsql security definer set search_path = public as $$
declare next_revision integer;
begin
  if row(new.title, new.slug, new.excerpt, new.content, new.status, new.category, new.featured, new.pinned,
         new.cover_asset_id, new.seo_title, new.seo_description, new.og_asset_id, new.canonical_url,
         new.robots, new.scheduled_for, new.media_type, new.audio_asset_id, new.audio_title,
         new.audio_role, new.audio_caption, new.audio_artwork_asset_id, new.spotify_url,
         new.spotify_entity_type, new.spotify_entity_id, new.spotify_embed_url, new.spotify_title,
         new.spotify_thumbnail_url)
     is distinct from
     row(old.title, old.slug, old.excerpt, old.content, old.status, old.category, old.featured, old.pinned,
         old.cover_asset_id, old.seo_title, old.seo_description, old.og_asset_id, old.canonical_url,
         old.robots, old.scheduled_for, old.media_type, old.audio_asset_id, old.audio_title,
         old.audio_role, old.audio_caption, old.audio_artwork_asset_id, old.spotify_url,
         old.spotify_entity_type, old.spotify_entity_id, old.spotify_embed_url, old.spotify_title,
         old.spotify_thumbnail_url) then
    select coalesce(max(revision_number), 0) + 1 into next_revision
    from public.content_revisions where content_id = old.id;
    insert into public.content_revisions(content_id, revision_number, snapshot, change_summary, edited_by)
    values (old.id, next_revision, to_jsonb(old), 'Automatic revision', new.updated_by);
  end if;
  return new;
end; $$;
