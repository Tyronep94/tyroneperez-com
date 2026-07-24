"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { registerMedia } from "@/app/admin/media/actions";
import {
  discardPhotographyDraft,
  publishPhotographyGallery,
  savePhotographyDraft,
  unpublishPhotographyGallery,
  updateGalleryPhotoMetadata,
  type GalleryMetaInput,
} from "@/app/admin/photography/galleries/actions";
import { GalleryEditorPreview } from "@/components/cms/gallery-editor-preview";
import { SiteHeader } from "@/components/public/site-header";
import type { ContentEntry, GalleryLayout, GalleryPhoto, GallerySection, GallerySettings, MediaAsset } from "@/types/cms";

type Device = "desktop" | "tablet" | "mobile" | "full";
type Panel = "photos" | "settings" | "collections" | "metadata" | "hidden" | "uploads";
type UploadItem = { id: string; file: File; progress: number; status: "queued" | "uploading" | "paused" | "complete" | "failed"; error?: string };
type Snapshot = { layout: GalleryLayout; meta: GalleryMetaInput };

const clone = <T,>(value: T): T => structuredClone(value);
const imageSections = (layout: GalleryLayout) => layout.sections.filter((section): section is Extract<GallerySection, { type: "images" }> => section.type === "images");

async function imageDimensions(file: File) {
  const url = URL.createObjectURL(file);
  try {
    const image = new window.Image();
    await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = reject; image.src = url; });
    return { width: image.naturalWidth, height: image.naturalHeight };
  } finally { URL.revokeObjectURL(url); }
}

function makePhoto(asset: MediaAsset): GalleryPhoto {
  const portrait = Boolean(asset.width && asset.height && asset.height > asset.width);
  return {
    id: crypto.randomUUID(),
    type: "photo",
    assetId: asset.id,
    asset,
    width: "half",
    emphasis: portrait ? "portrait" : "landscape",
    alignment: "center",
    focalPoint: { x: 50, y: 50 },
    crop: "natural",
    featured: false,
    hidden: false,
    altText: asset.alt_text ?? "",
    caption: asset.caption ?? "",
  };
}

export function PhotographyVisualEditor({
  entry,
  initialLayout,
  initialSettings,
  assets: initialAssets,
  collections,
  selectedCollections,
}: {
  entry: ContentEntry;
  initialLayout: GalleryLayout;
  initialSettings: GallerySettings & { editor?: Partial<GalleryMetaInput> };
  assets: MediaAsset[];
  collections: Array<{ id: string; name: string }>;
  selectedCollections: string[];
}) {
  const router = useRouter();
  const editorSettings = initialSettings.editor ?? {};
  const [layout, setLayout] = useState(initialLayout);
  const [meta, setMeta] = useState<GalleryMetaInput>({
    title: editorSettings.title ?? entry.title,
    slug: editorSettings.slug ?? entry.slug,
    description: editorSettings.description ?? entry.excerpt ?? "",
    category: editorSettings.category ?? entry.category ?? "Photography",
    featured: editorSettings.featured ?? entry.featured,
    coverAssetId: editorSettings.coverAssetId ?? entry.cover_asset_id,
    collectionIds: editorSettings.collectionIds ?? selectedCollections,
    settings: {
      location: initialSettings.location ?? "",
      shootDate: initialSettings.shootDate ?? "",
      camera: initialSettings.camera ?? "",
      lens: initialSettings.lens ?? "",
      client: initialSettings.client ?? "",
      tags: initialSettings.tags ?? [],
      showCaptions: initialSettings.showCaptions ?? true,
    },
  });
  const [assets, setAssets] = useState(initialAssets);
  const [panel, setPanel] = useState<Panel>("photos");
  const [device, setDevice] = useState<Device>("desktop");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draggedPhotoId, setDraggedPhotoId] = useState<string | null>(null);
  const [draggedAssetId, setDraggedAssetId] = useState<string | null>(null);
  const [draggedSectionId, setDraggedSectionId] = useState<string | null>(null);
  const [history, setHistory] = useState<Snapshot[]>([]);
  const [future, setFuture] = useState<Snapshot[]>([]);
  const [saveState, setSaveState] = useState<"saved" | "saving" | "unsaved" | "error">("saved");
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [busy, startTransition] = useTransition();
  const fileInput = useRef<HTMLInputElement>(null);
  const folderInput = useRef<HTMLInputElement>(null);
  const initialized = useRef(false);
  const uploadRunning = useRef(false);

  useEffect(() => { folderInput.current?.setAttribute("webkitdirectory", ""); }, []);

  const allPhotos = useMemo(() => imageSections(layout).flatMap((section) => section.items), [layout]);
  const selected = allPhotos.find((photo) => photo.id === selectedId) ?? null;
  const usedAssetIds = useMemo(() => new Set(allPhotos.map((photo) => photo.assetId)), [allPhotos]);
  const filteredAssets = assets.filter((asset) => asset.kind === "image" && `${asset.title} ${asset.filename}`.toLowerCase().includes(query.toLowerCase()));

  const mutate = useCallback((change: (current: GalleryLayout) => GalleryLayout) => {
    setHistory((items) => [...items.slice(-39), { layout: clone(layout), meta: clone(meta) }]);
    setFuture([]);
    setLayout((current) => change(clone(current)));
    setSaveState("unsaved");
  }, [layout, meta]);

  const mutateMeta = (change: (current: GalleryMetaInput) => GalleryMetaInput) => {
    setHistory((items) => [...items.slice(-39), { layout: clone(layout), meta: clone(meta) }]);
    setFuture([]);
    setMeta((current) => change(clone(current)));
    setSaveState("unsaved");
  };

  const undo = () => {
    const previous = history.at(-1);
    if (!previous) return;
    setFuture((items) => [{ layout: clone(layout), meta: clone(meta) }, ...items]);
    setHistory((items) => items.slice(0, -1));
    setLayout(previous.layout);
    setMeta(previous.meta);
    setSaveState("unsaved");
  };
  const redo = () => {
    const next = future[0];
    if (!next) return;
    setHistory((items) => [...items, { layout: clone(layout), meta: clone(meta) }]);
    setFuture((items) => items.slice(1));
    setLayout(next.layout);
    setMeta(next.meta);
    setSaveState("unsaved");
  };

  const save = useCallback(async (quiet = false) => {
    setSaveState("saving");
    const result = await savePhotographyDraft(entry.id, layout, meta);
    setSaveState(result.ok ? "saved" : "error");
    if (!quiet) setMessage(result.ok ? "Draft saved." : result.message ?? "Draft could not be saved.");
    return result.ok;
  }, [entry.id, layout, meta]);

  useEffect(() => {
    if (!initialized.current) { initialized.current = true; return; }
    if (saveState !== "unsaved") return;
    const timer = window.setTimeout(() => void save(true), 1400);
    return () => window.clearTimeout(timer);
  }, [layout, meta, save, saveState]);

  const addOrMovePhoto = (sectionId: string, beforeId?: string) => {
    if (draggedSectionId) {
      moveSection(sectionId);
      return;
    }
    const asset = assets.find((item) => item.id === draggedAssetId);
    mutate((current) => {
      let moving: GalleryPhoto | undefined;
      current.sections = current.sections.map((section) => section.type === "images"
        ? { ...section, items: section.items.filter((photo) => {
          if (photo.id === draggedPhotoId) { moving = photo; return false; }
          return true;
        }) }
        : section);
      if (!moving && asset) moving = makePhoto(asset);
      if (!moving) return current;
      current.sections = current.sections.map((section) => {
        if (section.type !== "images" || section.id !== sectionId) return section;
        const index = beforeId ? section.items.findIndex((photo) => photo.id === beforeId) : section.items.length;
        const items = [...section.items];
        items.splice(index < 0 ? items.length : index, 0, moving!);
        return { ...section, items };
      });
      return current;
    });
    setDraggedAssetId(null);
    setDraggedPhotoId(null);
  };
  const moveSection = (beforeId: string) => {
    if (!draggedSectionId || draggedSectionId === beforeId) { setDraggedSectionId(null); return; }
    mutate((current) => {
      const moving = current.sections.find((section) => section.id === draggedSectionId);
      if (!moving) return current;
      const sections = current.sections.filter((section) => section.id !== draggedSectionId);
      const index = sections.findIndex((section) => section.id === beforeId);
      sections.splice(index < 0 ? sections.length : index, 0, moving);
      return { ...current, sections };
    });
    setDraggedSectionId(null);
  };

  const updatePhoto = (id: string, patch: Partial<GalleryPhoto>) => mutate((current) => ({
    ...current,
    sections: current.sections.map((section) => section.type === "images"
      ? { ...section, items: section.items.map((photo) => photo.id === id ? { ...photo, ...patch } : photo) }
      : section),
  }));
  const removePhoto = (id: string) => {
    mutate((current) => ({ ...current, sections: current.sections.map((section) => section.type === "images" ? { ...section, items: section.items.filter((photo) => photo.id !== id) } : section) }));
    setSelectedId(null);
  };
  const replaceSelected = (asset: MediaAsset) => {
    if (!selected) return;
    const fresh = makePhoto(asset);
    updatePhoto(selected.id, { assetId: asset.id, asset, altText: asset.alt_text ?? "", caption: asset.caption ?? "", emphasis: fresh.emphasis });
  };

  const addSection = (type: GallerySection["type"]) => mutate((current) => {
    const id = crypto.randomUUID();
    const section: GallerySection = type === "images" ? { id, type, layout: "image", items: [] }
      : type === "text" ? { id, type, heading: "A moment in the story", body: "Add the context that belongs between these photographs." }
      : type === "spacer" ? { id, type, size: "medium" }
      : type === "quote" ? { id, type, quote: "Add a line that gives the gallery room to breathe.", attribution: "" }
      : { id, type: "divider" };
    return { ...current, sections: [...current.sections, section] };
  });

  const enqueue = (files: File[]) => {
    const images = files.filter((file) => file.type.startsWith("image/"));
    setUploads((items) => [...items, ...images.map((file) => ({ id: crypto.randomUUID(), file, progress: 0, status: "queued" as const }))]);
    setPanel("uploads");
  };

  useEffect(() => {
    if (uploadRunning.current) return;
    const next = uploads.find((item) => item.status === "queued");
    if (!next) return;
    uploadRunning.current = true;
    setUploads((items) => items.map((item) => item.id === next.id ? { ...item, status: "uploading", progress: 12 } : item));
    void (async () => {
      try {
        const supabase = createClient();
        const safeName = next.file.name.toLowerCase().replace(/[^a-z0-9._-]+/g, "-");
        const path = `${new Date().getFullYear()}/${crypto.randomUUID()}-${safeName}`;
        setUploads((items) => items.map((item) => item.id === next.id ? { ...item, progress: 42 } : item));
        const { error } = await supabase.storage.from("cms-media").upload(path, next.file, { cacheControl: "31536000", upsert: false });
        if (error) throw error;
        const { data } = supabase.storage.from("cms-media").getPublicUrl(path);
        const dimensions = await imageDimensions(next.file);
        setUploads((items) => items.map((item) => item.id === next.id ? { ...item, progress: 82 } : item));
        const result = await registerMedia({ storage_path: path, public_url: data.publicUrl, title: next.file.name.replace(/\.[^.]+$/, ""), filename: next.file.name, alt_text: null, mime_type: next.file.type, file_size: next.file.size, ...dimensions });
        if (!result.ok || !result.asset) throw new Error(result.message ?? "Metadata registration failed.");
        const asset = result.asset as MediaAsset;
        setAssets((items) => [asset, ...items]);
        setUploads((items) => items.map((item) => item.id === next.id ? { ...item, status: "complete", progress: 100 } : item));
      } catch (error) {
        setUploads((items) => items.map((item) => item.id === next.id ? { ...item, status: "failed", error: error instanceof Error ? error.message : "Upload failed" } : item));
      } finally {
        uploadRunning.current = false;
        window.setTimeout(() => setUploads((items) => [...items]), 0);
      }
    })();
  }, [uploads]);

  const publish = () => startTransition(async () => {
    const result = await publishPhotographyGallery(entry.id, layout, meta);
    setMessage(result.ok ? "Gallery published. The public page is live." : result.message ?? "Publishing failed.");
    if (result.ok) { setSaveState("saved"); router.refresh(); }
  });
  const unpublish = () => startTransition(async () => {
    const result = await unpublishPhotographyGallery(entry.id);
    setMessage(result.ok ? "Gallery unpublished." : result.message ?? "Unpublishing failed.");
    if (result.ok) router.refresh();
  });
  const discard = () => {
    if (!window.confirm("Discard all unpublished layout and metadata changes?")) return;
    startTransition(async () => {
      const result = await discardPhotographyDraft(entry.id);
      if (result.ok) window.location.reload();
      else setMessage(result.message ?? "Draft could not be restored.");
    });
  };

  const selectPhotoPanel = selected ? <div className="visual-inspector">
    <div className="visual-inspector__heading"><button onClick={() => setSelectedId(null)} aria-label="Close photo controls">←</button><div><span>Selected photograph</span><strong>{selected.asset.title}</strong></div></div>
    <div className="visual-focal" onClick={(event) => {
      const rect = event.currentTarget.getBoundingClientRect();
      updatePhoto(selected.id, { focalPoint: { x: Math.round(((event.clientX - rect.left) / rect.width) * 100), y: Math.round(((event.clientY - rect.top) / rect.height) * 100) } });
    }}>
      {/* The focal-point editor intentionally displays the original asset directly. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={selected.asset.public_url} alt="" />
      <i style={{ left: `${selected.focalPoint.x}%`, top: `${selected.focalPoint.y}%` }} />
      <span>Click the important point</span>
    </div>
    <div className="visual-crop-contexts">{(["Desktop", "Tablet", "390px", "Card", "Cover", "Homepage"] as const).map((context) => <div className={`context-${context.toLowerCase()}`} key={context}>
      {/* These small context previews intentionally share the selected asset and focal coordinates. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={selected.asset.variants?.thumbnail?.url ?? selected.asset.public_url} alt="" style={{ objectPosition: `${selected.focalPoint.x}% ${selected.focalPoint.y}%` }} />
      <span>{context}</span>
    </div>)}</div>
    <label className="field"><span>Width</span><select className="input" value={selected.width} onChange={(event) => updatePhoto(selected.id, { width: event.target.value as GalleryPhoto["width"] })}><option value="full">Full width</option><option value="half">Half width</option><option value="third">One-third width</option></select></label>
    <label className="field"><span>Emphasis</span><select className="input" value={selected.emphasis} onChange={(event) => updatePhoto(selected.id, { emphasis: event.target.value as GalleryPhoto["emphasis"] })}><option value="natural">Natural aspect</option><option value="portrait">Portrait</option><option value="landscape">Landscape</option></select></label>
    <label className="field"><span>Alignment</span><select className="input" value={selected.alignment} onChange={(event) => updatePhoto(selected.id, { alignment: event.target.value as GalleryPhoto["alignment"] })}><option value="left">Left</option><option value="center">Center</option><option value="right">Right</option></select></label>
    <label className="check-row"><input type="checkbox" checked={selected.crop === "cover"} onChange={(event) => updatePhoto(selected.id, { crop: event.target.checked ? "cover" : "natural" })} /> Crop to layout frame</label>
    <label className="field"><span>Alt text</span><textarea className="input" value={selected.altText} onChange={(event) => updatePhoto(selected.id, { altText: event.target.value })} /></label>
    <label className="field"><span>Caption</span><textarea className="input" value={selected.caption} onChange={(event) => updatePhoto(selected.id, { caption: event.target.value })} /></label>
    <button className="btn btn-secondary btn-small" onClick={() => startTransition(async () => {
      const result = await updateGalleryPhotoMetadata(selected.assetId, selected.altText, selected.caption);
      setMessage(result.ok ? "Photo metadata saved." : result.message ?? "Metadata could not be saved.");
    })}>Save photo metadata</button>
    <div className="visual-inspector__toggles">
      <button className={meta.coverAssetId === selected.assetId ? "is-active" : ""} onClick={() => mutateMeta((current) => ({ ...current, coverAssetId: selected.assetId }))}>Set cover</button>
      <button className={selected.featured ? "is-active" : ""} onClick={() => updatePhoto(selected.id, { featured: !selected.featured })}>Featured</button>
      <button onClick={() => updatePhoto(selected.id, { hidden: !selected.hidden })}>{selected.hidden ? "Unhide" : "Hide"}</button>
      <button className="is-danger" onClick={() => removePhoto(selected.id)}>Remove from page</button>
    </div>
  </div> : null;

  return <div className={`visual-editor visual-editor--${device}`}>
    <header className="visual-editor__topbar">
      <div><Link href="/admin/photography/galleries">← Galleries</Link><span className="visual-editor__divider" /><strong>{meta.title}</strong><span className={`visual-save-state visual-save-state--${saveState}`}>{saveState === "saving" ? "Saving…" : saveState === "unsaved" ? "Unsaved changes" : saveState === "error" ? "Save failed" : "Draft saved"}</span></div>
      <div className="visual-editor__history"><button onClick={undo} disabled={!history.length} title="Undo">↶</button><button onClick={redo} disabled={!future.length} title="Redo">↷</button></div>
      <div className="visual-editor__publish">
        <button onClick={() => void save()} disabled={busy}>Save draft</button>
        <Link href={`/preview/portfolio/${meta.slug}`} target="_blank">Private preview ↗</Link>
        {entry.status === "published" && <button onClick={unpublish} disabled={busy}>Unpublish</button>}
        <button className="visual-editor__publish-button" onClick={publish} disabled={busy}>Publish</button>
        <button className="visual-editor__more" onClick={discard} disabled={busy} title="Discard unpublished changes">•••</button>
      </div>
    </header>
    {message && <div className="visual-toast" role="status">{message}<button onClick={() => setMessage("")}>×</button></div>}
    <div className="visual-editor__workspace">
      {device !== "full" && <aside className="visual-editor__panel">
        <nav className="visual-panel-tabs" aria-label="Gallery editing tools">
          {([["photos", "▧", "Photos"], ["settings", "⚙", "Settings"], ["collections", "◫", "Collections"], ["metadata", "ⓘ", "Metadata"], ["hidden", "◉", "Hidden"], ["uploads", "⇧", "Uploads"]] as Array<[Panel, string, string]>).map(([id, glyph, label]) => <button key={id} className={panel === id ? "is-active" : ""} onClick={() => setPanel(id)}><i>{glyph}</i><span>{label}</span>{id === "uploads" && uploads.some((item) => item.status === "uploading" || item.status === "queued") && <b />}</button>)}
        </nav>
        <div className="visual-panel-body">
          {selectPhotoPanel ?? <>
            {panel === "photos" && <><div className="visual-panel-heading"><div><p>Media panel</p><h2>Photographs</h2></div><button onClick={() => fileInput.current?.click()}>＋</button></div>
              <input className="visual-media-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search uploaded photos" />
              <div className="visual-media-grid">{filteredAssets.map((asset) => <article draggable onDragStart={() => { setDraggedAssetId(asset.id); setDraggedPhotoId(null); }} key={asset.id}>
                {/* Admin thumbnails use trusted media records. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={asset.variants?.thumbnail?.url ?? asset.public_url} alt={asset.alt_text ?? ""} />
                <span>{usedAssetIds.has(asset.id) ? "On page" : asset.title}</span>
                {selected && <button onClick={() => replaceSelected(asset)}>Replace selected</button>}
              </article>)}</div>
              <button className="visual-upload-button" onClick={() => fileInput.current?.click()}>Upload photographs</button>
            </>}
            {panel === "settings" && <><div className="visual-panel-heading"><div><p>Gallery</p><h2>Page settings</h2></div></div>
              <label className="field"><span>Layout</span><select className="input" value={layout.preset} onChange={(event) => mutate((current) => ({ ...current, preset: event.target.value as GalleryLayout["preset"] }))}><option value="editorial-grid">Editorial grid</option><option value="masonry">Masonry</option><option value="full-width-story">Full-width story</option><option value="alternating">Alternating portrait & landscape</option><option value="horizontal-rows">Horizontal rows</option><option value="featured-hero">Featured hero + grid</option><option value="custom">Custom arrangement</option></select></label>
              <label className="field"><span>Title</span><input className="input" value={meta.title} onChange={(event) => mutateMeta((current) => ({ ...current, title: event.target.value }))} /></label>
              <label className="field"><span>Description</span><textarea className="input" value={meta.description} onChange={(event) => mutateMeta((current) => ({ ...current, description: event.target.value }))} /></label>
              <label className="field"><span>URL slug</span><input className="input" value={meta.slug} onChange={(event) => mutateMeta((current) => ({ ...current, slug: event.target.value }))} /></label>
              <label className="check-row"><input type="checkbox" checked={meta.featured} onChange={(event) => mutateMeta((current) => ({ ...current, featured: event.target.checked }))} /> Featured gallery</label>
              <div className="visual-section-add"><strong>Add section</strong>{(["images", "text", "spacer", "divider", "quote"] as GallerySection["type"][]).map((type) => <button key={type} onClick={() => addSection(type)}>＋ {type === "images" ? "Image section" : type[0].toUpperCase() + type.slice(1)}</button>)}</div>
            </>}
            {panel === "collections" && <><div className="visual-panel-heading"><div><p>Organization</p><h2>Collections</h2></div></div>{collections.map((collection) => <label className="visual-collection-row" key={collection.id}><input type="checkbox" checked={meta.collectionIds.includes(collection.id)} onChange={(event) => mutateMeta((current) => ({ ...current, collectionIds: event.target.checked ? [...current.collectionIds, collection.id] : current.collectionIds.filter((id) => id !== collection.id) }))} /><span>{collection.name}</span></label>)}<p className="visual-help">Collection membership is staged with this draft and finalized when published.</p></>}
            {panel === "metadata" && <><div className="visual-panel-heading"><div><p>Shoot details</p><h2>Metadata</h2></div></div>
              {([["location", "Location"], ["shootDate", "Shoot date"], ["camera", "Camera"], ["lens", "Lens"], ["client", "Client"]] as const).map(([key, label]) => <label className="field" key={key}><span>{label}</span><input className="input" value={meta.settings[key] ?? ""} onChange={(event) => mutateMeta((current) => ({ ...current, settings: { ...current.settings, [key]: event.target.value } }))} /></label>)}
              <label className="field"><span>Tags</span><input className="input" value={(meta.settings.tags ?? []).join(", ")} onChange={(event) => mutateMeta((current) => ({ ...current, settings: { ...current.settings, tags: event.target.value.split(",").map((tag) => tag.trim()).filter(Boolean) } }))} /></label>
              <label className="check-row"><input type="checkbox" checked={meta.settings.showCaptions} onChange={(event) => mutateMeta((current) => ({ ...current, settings: { ...current.settings, showCaptions: event.target.checked } }))} /> Show captions</label>
            </>}
            {panel === "hidden" && <><div className="visual-panel-heading"><div><p>Not public</p><h2>Hidden photos</h2></div></div><div className="visual-media-grid">{allPhotos.filter((photo) => photo.hidden).map((photo) => <article key={photo.id} onClick={() => setSelectedId(photo.id)}>
              {/* Hidden-photo thumbnails use trusted media records. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.asset.variants?.thumbnail?.url ?? photo.asset.public_url} alt="" />
              <span>{photo.asset.title}</span><button onClick={(event) => { event.stopPropagation(); updatePhoto(photo.id, { hidden: false }); }}>Unhide</button></article>)}</div>{!allPhotos.some((photo) => photo.hidden) && <p className="visual-help">Hidden photographs stay in the gallery draft and media library, but never enter the published snapshot.</p>}</>}
            {panel === "uploads" && <><div className="visual-panel-heading"><div><p>Background uploads</p><h2>Upload queue</h2></div><button onClick={() => fileInput.current?.click()}>＋</button></div>
              <div className="visual-dropzone" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); enqueue([...event.dataTransfer.files]); }}><strong>Drop a shoot here</strong><span>JPG, PNG, WebP or AVIF</span><div><button onClick={() => fileInput.current?.click()}>Choose files</button><button onClick={() => folderInput.current?.click()}>Choose folder</button></div></div>
              <div className="visual-upload-list">{uploads.map((item) => <article key={item.id}><div><strong>{item.file.name}</strong><span>{item.status}{item.error ? ` · ${item.error}` : ""}</span></div><progress value={item.progress} max="100" /><div>{item.status === "queued" && <button onClick={() => setUploads((items) => items.map((upload) => upload.id === item.id ? { ...upload, status: "paused" } : upload))}>Pause</button>}{item.status === "paused" && <button onClick={() => setUploads((items) => items.map((upload) => upload.id === item.id ? { ...upload, status: "queued" } : upload))}>Resume</button>}{item.status === "failed" && <button onClick={() => setUploads((items) => items.map((upload) => upload.id === item.id ? { ...upload, status: "queued", error: undefined, progress: 0 } : upload))}>Retry</button>}</div></article>)}</div>
              {!uploads.length && <p className="visual-help">Uploads continue while you arrange the gallery. Completed photographs appear in the Photos panel automatically.</p>}
            </>}
          </>}
        </div>
      </aside>}
      <section className="visual-editor__canvas">
        <div className="visual-device-toolbar">
          <div><button className={device === "desktop" ? "is-active" : ""} onClick={() => setDevice("desktop")}>Desktop</button><button className={device === "tablet" ? "is-active" : ""} onClick={() => setDevice("tablet")}>Tablet</button><button className={device === "mobile" ? "is-active" : ""} onClick={() => setDevice("mobile")}>390px</button><button className={device === "full" ? "is-active" : ""} onClick={() => setDevice(device === "full" ? "desktop" : "full")}>Full width</button></div>
          <Link href={`/preview/portfolio/${meta.slug}`} target="_blank">Open preview in new tab ↗</Link>
        </div>
        <div className="visual-preview-stage">
          <div className="visual-preview-page">
            <div className="public-site">
              <SiteHeader />
              <GalleryEditorPreview entry={{ ...entry, title: meta.title, slug: meta.slug, excerpt: meta.description, category: meta.category, cover_asset_id: meta.coverAssetId, cover_asset: assets.find((asset) => asset.id === meta.coverAssetId) ?? null }} layout={layout} settings={meta.settings} selectedId={selectedId} onSelect={setSelectedId} onDropPhoto={addOrMovePhoto} onDragPhoto={(id) => { setDraggedPhotoId(id); setDraggedAssetId(null); setDraggedSectionId(null); }} onDragSection={(id) => { setDraggedSectionId(id); setDraggedPhotoId(null); setDraggedAssetId(null); }} />
            </div>
          </div>
        </div>
      </section>
    </div>
    <input ref={fileInput} type="file" accept="image/*" multiple hidden onChange={(event) => enqueue([...(event.target.files ?? [])])} />
    <input ref={folderInput} type="file" accept="image/*" multiple hidden onChange={(event) => enqueue([...(event.target.files ?? [])])} />
  </div>;
}
