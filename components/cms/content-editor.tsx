"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { autosaveContent, type CmsActionState } from "@/app/admin/content/actions";
import { RichTextEditor } from "@/components/cms/rich-text-editor";
import { PortfolioAudioEditor } from "@/components/cms/portfolio-audio-editor";
import type { ContentEntry, MediaAsset, PortfolioAudioMedia, RichTextNode } from "@/types/cms";
import { emptyDocument, portfolioAudioMedia } from "@/types/cms";
import { formatDateTimeLocal } from "@/lib/utils/dates";

const initialState: CmsActionState = {};
type SaveAction = (state: CmsActionState, data: FormData) => Promise<CmsActionState>;

export function ContentEditor({ entry, action, deleteAction, collections = [], selectedCollections = [], media = [], audioMedia = [] }: { entry?: ContentEntry; action: SaveAction; deleteAction?: () => Promise<void>; collections?: Array<{id:string;name:string}>; selectedCollections?: string[]; media?: MediaAsset[]; audioMedia?: MediaAsset[] }) {
  const storageKey = `tpc-cms-${entry?.id ?? "new"}`;
  const [state, formAction, pending] = useActionState(action, initialState);
  const [title, setTitle] = useState(entry?.title ?? "");
  const [excerpt, setExcerpt] = useState(entry?.excerpt ?? "");
  const [content, setContent] = useState<RichTextNode>(entry?.content ?? emptyDocument);
  const [seoTitle, setSeoTitle] = useState(entry?.seo_title ?? "");
  const [seoDescription, setSeoDescription] = useState(entry?.seo_description ?? "");
  const [kind, setKind] = useState(entry?.kind ?? "portfolio");
  const [audio, setAudio] = useState<PortfolioAudioMedia | null>(entry ? portfolioAudioMedia(entry) : null);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");
  const hydrated = useRef(false);
  const autosavePayload = useMemo(() => ({ title, excerpt, content, seo_title: seoTitle, seo_description: seoDescription, audio_media: audio }), [title, excerpt, content, seoTitle, seoDescription, audio]);

  useEffect(() => {
    const local = window.localStorage.getItem(storageKey);
    const timer = window.setTimeout(() => {
      if (local) {
        try {
          const draft = JSON.parse(local);
          if (draft.title !== undefined) setTitle(draft.title);
          if (draft.excerpt !== undefined) setExcerpt(draft.excerpt);
          if (draft.content) setContent(draft.content);
          if (draft.seo_title !== undefined) setSeoTitle(draft.seo_title);
          if (draft.seo_description !== undefined) setSeoDescription(draft.seo_description);
          if (draft.audio_media !== undefined) setAudio(draft.audio_media);
        } catch { window.localStorage.removeItem(storageKey); }
      }
      hydrated.current = true;
    }, 0);
    return () => window.clearTimeout(timer);
  }, [storageKey]);

  useEffect(() => {
    if (!hydrated.current) return;
    setSaveStatus("unsaved");
    window.localStorage.setItem(storageKey, JSON.stringify(autosavePayload));
    const timer = window.setTimeout(async () => {
      if (!entry || entry.status === "published") return;
      setSaveStatus("saving");
      const result = await autosaveContent(entry.id, autosavePayload);
      setSaveStatus(result.ok ? "saved" : "unsaved");
      if (result.ok) window.localStorage.removeItem(storageKey);
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [autosavePayload, entry, storageKey]);

  const slugDefault = entry?.slug ?? "";
  const previewHref = entry ? `/preview/portfolio/${entry.slug}` : null;
  return (
    <form action={formAction} className="cms-edit-layout">
      <input type="hidden" name="content" value={JSON.stringify(content)} />
      <input type="hidden" name="media_type" value={audio?.media_type ?? ""} />
      <input type="hidden" name="audio_asset_id" value={audio?.audio_asset_id ?? ""} />
      <input type="hidden" name="audio_title" value={audio?.audio_title ?? ""} />
      <input type="hidden" name="audio_role" value={audio?.audio_role ?? ""} />
      <input type="hidden" name="audio_caption" value={audio?.audio_caption ?? ""} />
      <input type="hidden" name="audio_artwork_asset_id" value={audio?.audio_artwork_asset_id ?? ""} />
      <input type="hidden" name="spotify_url" value={audio?.media_type === "spotify" ? audio.spotify_url : ""} />
      <input type="hidden" name="spotify_entity_type" value={audio?.media_type === "spotify" ? audio.spotify_entity_type : ""} />
      <input type="hidden" name="spotify_entity_id" value={audio?.media_type === "spotify" ? audio.spotify_entity_id : ""} />
      <input type="hidden" name="spotify_embed_url" value={audio?.media_type === "spotify" ? audio.spotify_embed_url : ""} />
      <input type="hidden" name="spotify_title" value={audio?.media_type === "spotify" ? audio.spotify_title ?? "" : ""} />
      <input type="hidden" name="spotify_thumbnail_url" value={audio?.media_type === "spotify" ? audio.spotify_thumbnail_url ?? "" : ""} />
      <section className="cms-edit-main">
        <div className="cms-edit-bar">
          <Link href="/admin/content" className="cms-back">← Content</Link>
          <span className={`autosave autosave--${saveStatus}`}>{saveStatus === "saving" ? "Saving…" : saveStatus === "saved" ? "Saved" : "Unsaved changes"}</span>
          {entry && <Link href={`/admin/content/${entry.id}/history`} className="cms-back">History</Link>}
          {previewHref && <Link href={previewHref} target="_blank" className="btn btn-secondary btn-small">Preview draft ↗</Link>}
        </div>
        {state.error && <p className="notice notice-error" role="alert">{state.error}</p>}
        {state.success && <p className="notice notice-success" role="status">{state.success}</p>}
        <div className="cms-title-field">
          <label htmlFor="content-title">Title</label>
          <input id="content-title" name="title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Untitled project" required />
          {state.fieldErrors?.title?.map(error => <small key={error}>{error}</small>)}
        </div>
        <div className="field">
          <label htmlFor="excerpt">Summary</label>
          <textarea id="excerpt" name="excerpt" className="input" value={excerpt} onChange={(event) => setExcerpt(event.target.value)} placeholder="A concise introduction for cards and search." />
        </div>
        <div className="field">
          <label>Story</label>
          <RichTextEditor value={content} onChange={setContent} />
        </div>
        {kind === "portfolio" && <PortfolioAudioEditor value={audio} onChange={setAudio} audioAssets={audioMedia} artworkAssets={media} />}
      </section>
      <aside className="cms-edit-sidebar">
        <div className="cms-publish-card">
          <p className="eyebrow">Publishing</p>
          <strong>{entry?.status ?? "New draft"}</strong>
          <div className="cms-publish-actions">
            <button className="btn" name="intent" value="draft" disabled={pending}>Save draft</button>
            <button className="btn btn-secondary" name="intent" value="publish" disabled={pending}>Publish</button>
            {entry?.status === "published" && <button className="cms-text-button" name="intent" value="unpublish" disabled={pending}>Unpublish</button>}
          </div>
          <label className="field"><span>Schedule publishing</span><input className="input" type="datetime-local" name="scheduled_for" defaultValue={entry?.scheduled_for ? formatDateTimeLocal(entry.scheduled_for) : ""} /></label>
          <button className="cms-text-button" name="intent" value="schedule" disabled={pending}>Schedule</button>
        </div>
        <details className="cms-settings" open>
          <summary>Content settings</summary>
          <label className="field"><span>Type</span><select className="input" name="kind" value={kind} onChange={event => setKind(event.target.value as typeof kind)}><option value="portfolio">Portfolio</option><option value="page">Page</option><option value="album">Album</option><option value="song">Song</option></select></label>
          <label className="field"><span>Slug</span><input className="input" name="slug" defaultValue={slugDefault} placeholder="project-name" required /></label>
          <label className="field"><span>Category</span><input className="input" name="category" defaultValue={entry?.category ?? ""} placeholder="Photography" /></label>
          <label className="field"><span>Cover image</span><select className="input" name="cover_asset_id" defaultValue={entry?.cover_asset_id ?? ""}><option value="">No cover image</option>{media.map(asset => <option value={asset.id} key={asset.id}>{asset.title}</option>)}</select></label>
          <label className="field"><span>Collections</span><select className="input cms-multi-select" name="collection_ids" multiple defaultValue={selectedCollections}>{collections.map(collection => <option value={collection.id} key={collection.id}>{collection.name}</option>)}</select><small>Hold Command or Control to choose more than one.</small></label>
          <label className="check-row"><input type="checkbox" name="featured" defaultChecked={entry?.featured} /> Featured</label>
          <label className="check-row"><input type="checkbox" name="pinned" defaultChecked={entry?.pinned} /> Pinned</label>
        </details>
        <details className="cms-settings" open>
          <summary>SEO & social</summary>
          <label className="field"><span>SEO title</span><input className="input" name="seo_title" value={seoTitle} onChange={(event) => setSeoTitle(event.target.value)} maxLength={70} /></label>
          <label className="field"><span>SEO description</span><textarea className="input" name="seo_description" value={seoDescription} onChange={(event) => setSeoDescription(event.target.value)} maxLength={180} /></label>
          <label className="field"><span>OG image</span><select className="input" name="og_asset_id" defaultValue={entry?.og_asset_id ?? ""}><option value="">Use cover image</option>{media.map(asset => <option value={asset.id} key={asset.id}>{asset.title}</option>)}</select></label>
          <label className="field"><span>Canonical URL</span><input className="input" type="url" name="canonical_url" defaultValue={entry?.canonical_url ?? ""} placeholder="https://tyroneperez.com/…" /></label>
          <label className="field"><span>Robots</span><select className="input" name="robots" defaultValue={entry?.robots ?? "index,follow"}><option value="index,follow">Index, follow</option><option value="noindex,follow">No index, follow</option><option value="noindex,nofollow">No index, no follow</option></select></label>
          <div className="search-preview"><small>tyroneperez.com › portfolio</small><strong>{seoTitle || title || "Page title"}</strong><p>{seoDescription || excerpt || "Your search description will appear here."}</p></div>
          <div className="social-preview"><span>Social preview</span><div><strong>{seoTitle || title || "Page title"}</strong><p>{seoDescription || excerpt || "Add a social description."}</p></div></div>
        </details>
        {deleteAction && <div className="cms-danger-zone"><strong>Delete entry</strong><p>This permanently removes this content and its revisions.</p><button type="submit" formAction={deleteAction}>Delete content</button></div>}
      </aside>
    </form>
  );
}
