-- Add the existing Portfolio page to the shared page-first visual editor.

alter table public.website_page_drafts
  drop constraint if exists website_page_drafts_page_key_check;

alter table public.website_page_drafts
  add constraint website_page_drafts_page_key_check
  check (page_key in ('home','photography','music','portfolio','about','contact'));

alter table public.website_page_publications
  drop constraint if exists website_page_publications_page_key_check;

alter table public.website_page_publications
  add constraint website_page_publications_page_key_check
  check (page_key in ('home','photography','music','portfolio','about','contact'));
