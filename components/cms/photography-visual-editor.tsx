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
  type GalleryMetaInput,
} from "@/app/admin/photography/galleries/actions";
import { GalleryEditorPreview } from "@/components/cms/gallery-editor-preview";
import { SiteHeader } from "@/components/public/site-header";
import { galleryPhotoOrientation, normalizeGalleryLayout } from "@/lib/gallery-layout";
import type { ContentEntry, GalleryLayout, GalleryPhoto, GallerySection, GallerySettings, MediaAsset } from "@/types/cms";

type Device = "desktop" | "tablet" | "mobile" | "full";
type Panel = "replace" | "upload" | "library" | "details" | "advanced";
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
    size: portrait ? "medium" : "large",
    emphasis: portrait ? "portrait" : "landscape",
    alignment: "center",
    focalPoint: { x: 50, y: 50 },
    crop: "natural",
    featured: false,
    hidden: false,
    altText: asset.alt_text ?? "",
    caption: asset.caption ?? "",
    templateLocked: false,
    fitMode: "contain",
  };
}

function replaceTemplatePhoto(photo: GalleryPhoto, asset: MediaAsset): GalleryPhoto {
  return {
    ...photo,
    assetId: asset.id,
    asset,
    replacementAssetId: asset.id,
    replacementAsset: asset,
    fitMode: "contain",
    focalPoint: { x: 50, y: 50 },
    crop: "natural",
    cropIntent: undefined,
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
  const [layout, setLayout] = useState(() => normalizeGalleryLayout(initialLayout));
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
  const [panel, setPanel] = useState<Panel>("replace");
  const [device, setDevice] = useState<Device>("desktop");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draggedPhotoId, setDraggedPhotoId] = useState<string | null>(null);
  const [draggedAssetId, setDraggedAssetId] = useState<string | null>(null);
  const [draggedSectionId, setDraggedSectionId] = useState<string | null>(null);
  const [history, setHistory] = useState<Snapshot[]>([]);
  const [future, setFuture] = useState<Snapshot[]>([]);
  const [saveState, setSaveState] = useState<"saved" | "saving" | "unsaved" | "error">("saved");
  const [message, setMessage] = useState("");
  const [photoMetrics, setPhotoMetrics] = useState<{
    width: number;
    height: number;
    clipped: boolean;
    anchorLeft: number;
    anchorTop: number;
  } | null>(null);
  const [replacementPicker, setReplacementPicker] = useState<"library" | null>(null);
  const [pendingReplacementId, setPendingReplacementId] = useState<string | null>(null);
  const [photoSettingsOpen, setPhotoSettingsOpen] = useState(false);
  const [repositioningId, setRepositioningId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [busy, startTransition] = useTransition();
  const fileInput = useRef<HTMLInputElement>(null);
  const folderInput = useRef<HTMLInputElement>(null);
  const initialized = useRef(false);
  const uploadRunning = useRef(false);

  useEffect(() => { folderInput.current?.setAttribute("webkitdirectory", ""); }, []);

  const allPhotos = useMemo(() => imageSections(layout).flatMap((section) => section.items), [layout]);
  const templateSlots = allPhotos.filter((photo) => photo.templateLocked);
  const photoLibraryAssets = useMemo(() => {
    const records = new Map<string, MediaAsset>();
    assets.forEach((asset) => records.set(asset.id, asset));
    allPhotos.forEach((photo) => {
      records.set(photo.asset.id, photo.asset);
      if (photo.referenceAsset) records.set(photo.referenceAsset.id, photo.referenceAsset);
      if (photo.replacementAsset) records.set(photo.replacementAsset.id, photo.replacementAsset);
    });
    return [...records.values()];
  }, [allPhotos, assets]);
  const selected = allPhotos.find((photo) => photo.id === selectedId) ?? null;
  const usedAssetIds = useMemo(() => new Set(allPhotos.map((photo) => photo.assetId)), [allPhotos]);
  const filteredAssets = photoLibraryAssets.filter((asset) => asset.kind === "image" && `${asset.title} ${asset.filename}`.toLowerCase().includes(query.toLowerCase()));

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

  const addReferencePhoto = (asset: MediaAsset) => {
    mutate((current) => {
      const referencePhoto = { ...makePhoto(asset), templateLocked: true };
      const firstImageSection = current.sections.find(
        (section): section is Extract<GallerySection, { type: "images" }> => section.type === "images",
      );
      if (firstImageSection) {
        return normalizeGalleryLayout({
          ...current,
          sections: current.sections.map((section) =>
            section.id === firstImageSection.id
              ? { ...firstImageSection, items: [...firstImageSection.items, referencePhoto] }
              : section,
          ),
        });
      }
      return normalizeGalleryLayout({
        ...current,
        sections: [
          ...current.sections,
          { id: crypto.randomUUID(), type: "images", layout: "image", items: [referencePhoto] },
        ],
      });
    });
    setSelectedId(null);
  };

  const addOrMovePhoto = (sectionId: string, beforeId?: string) => {
    if (draggedSectionId) {
      moveSection(sectionId);
      return;
    }
    const asset = photoLibraryAssets.find((item) => item.id === draggedAssetId);
    mutate((current) => {
      let moving: GalleryPhoto | undefined;
      current.sections = current.sections.map((section) => section.type === "images"
        ? { ...section, items: section.items.filter((photo) => {
          if (photo.id === draggedPhotoId) { moving = photo; return false; }
          return true;
        }) }
        : section);
      if (!moving && asset) {
        moving = makePhoto(asset);
        moving.templateLocked = current.mode !== "freeform";
      }
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
    if (selected.templateLocked) {
      updatePhoto(selected.id, replaceTemplatePhoto(selected, asset));
      setReplacementPicker(null);
      setMessage("Photo replaced. The template position is unchanged.");
      return;
    }
    const fresh = makePhoto(asset);
    updatePhoto(selected.id, {
      assetId: asset.id,
      asset,
      altText: asset.alt_text ?? "",
      caption: asset.caption ?? "",
      emphasis: fresh.emphasis,
      size: fresh.size,
      crop: "natural",
      cropIntent: undefined,
    });
  };
  const restoreReference = () => {
    if (!selected?.templateLocked || !selected.referenceAsset || !selected.replacementAssetId) return;
    if (!window.confirm("Restore the original reference photo in this position?")) return;
    updatePhoto(selected.id, {
      assetId: selected.referenceAsset.id,
      asset: selected.referenceAsset,
      replacementAssetId: null,
      replacementAsset: null,
      fitMode: "contain",
      focalPoint: { x: 50, y: 50 },
      altText: selected.referenceAsset.alt_text ?? "",
      caption: selected.referenceAsset.caption ?? "",
    });
    setReplacementPicker(null);
    setRepositioningId(null);
    setMessage("Reference photo restored.");
  };
  const unlockSelectedSlot = () => {
    if (!selected?.templateLocked) return;
    if (!window.confirm("Unlocking this photo allows its layout to change.")) return;
    updatePhoto(selected.id, { templateLocked: false });
    setPhotoSettingsOpen(false);
    setRepositioningId(null);
  };
  const updateFocalPointLive = (id: string, focalPoint: { x: number; y: number }) => {
    setLayout((current) => ({
      ...current,
      sections: current.sections.map((section) => section.type === "images"
        ? { ...section, items: section.items.map((photo) => photo.id === id ? { ...photo, focalPoint } : photo) }
        : section),
    }));
    setSaveState("unsaved");
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
  const removeEmptyPhotoBlock = (id: string) => mutate((current) => ({
    ...current,
    sections: current.sections.filter((section) => section.id !== id || section.type !== "images" || section.items.length > 0),
  }));

  const enqueue = (files: File[]) => {
    const images = files.filter((file) => file.type.startsWith("image/"));
    setUploads((items) => [...items, ...images.map((file) => ({ id: crypto.randomUUID(), file, progress: 0, status: "queued" as const }))]);
    if (!pendingReplacementId) setPanel("upload");
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
        if (pendingReplacementId) {
          setLayout((current) => ({
            ...current,
            sections: current.sections.map((section) => section.type === "images"
              ? { ...section, items: section.items.map((photo) => photo.id === pendingReplacementId ? replaceTemplatePhoto(photo, asset) : photo) }
              : section),
          }));
          setSaveState("unsaved");
          setPendingReplacementId(null);
          setReplacementPicker(null);
          setMessage("Photo uploaded and placed without changing the template.");
        }
        setUploads((items) => items.map((item) => item.id === next.id ? { ...item, status: "complete", progress: 100 } : item));
      } catch (error) {
        setUploads((items) => items.map((item) => item.id === next.id ? { ...item, status: "failed", error: error instanceof Error ? error.message : "Upload failed" } : item));
      } finally {
        uploadRunning.current = false;
        window.setTimeout(() => setUploads((items) => [...items]), 0);
      }
    })();
  }, [pendingReplacementId, uploads]);

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

  const selectedToolbar = selected ? <div
    className={`visual-photo-toolbar${selected.templateLocked ? " visual-photo-toolbar--template" : ""}`}
    role="region"
    aria-label={`Photo controls for ${selected.asset.title}`}
    style={photoMetrics ? {
      "--visual-photo-menu-left": `${photoMetrics.anchorLeft}px`,
      "--visual-photo-menu-top": `${photoMetrics.anchorTop}px`,
    } as React.CSSProperties : undefined}
  >
    <div className="visual-photo-toolbar__summary">
      <strong>{selected.templateLocked ? selected.slotLabel : selected.asset.title}</strong>
      <span>{selected.templateLocked
        ? `${selected.replacementAssetId ? "Your Photo" : "Reference Photo"} · ${selected.fitMode === "cover" ? "Fill Frame" : "Fit Entire Photo"} · template position locked`
        : `Original ${selected.asset.width ?? "?"} × ${selected.asset.height ?? "?"} · Displayed ${photoMetrics ? `${photoMetrics.width} × ${photoMetrics.height}` : "measuring…"} · ${(selected.size ?? (galleryPhotoOrientation(selected) === "portrait" ? "medium" : "large")).replace("full", "full width")}`}</span>
    </div>
    {selected.templateLocked ? <>
      <div className="visual-photo-toolbar__actions">
        <button className="is-primary" onClick={() => { setReplacementPicker("library"); setPhotoSettingsOpen(false); }}>Replace Photo</button>
        <button className={repositioningId === selected.id ? "is-active" : ""} disabled={selected.fitMode !== "cover"} onClick={() => setRepositioningId((id) => id === selected.id ? null : selected.id)}>Reposition</button>
        <button disabled={!selected.replacementAssetId} onClick={restoreReference}>Restore Reference</button>
        <button className={photoSettingsOpen ? "is-active" : ""} onClick={() => { setPhotoSettingsOpen((open) => !open); setReplacementPicker(null); }}>Photo Settings</button>
      </div>
      {replacementPicker === "library" && <div className="visual-replace-library">
        <div><strong>Replace Photo</strong><button onClick={() => { setPendingReplacementId(selected.id); fileInput.current?.click(); }}>Upload New</button></div>
        <div>{photoLibraryAssets.filter((asset) => asset.kind === "image").slice(0, 24).map((asset) => <button key={asset.id} onClick={() => replaceSelected(asset)}>
          {/* Photo-library thumbnails use trusted media records. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={asset.variants?.thumbnail?.url ?? asset.public_url} alt={asset.alt_text ?? ""} />
          <span>{asset.title}</span>
        </button>)}</div>
      </div>}
      {photoSettingsOpen && <div className="visual-template-settings">
        <strong>How should the photo fit?</strong>
        <div>
          <button className={selected.fitMode !== "cover" ? "is-active" : ""} onClick={() => { updatePhoto(selected.id, { fitMode: "contain", focalPoint: { x: 50, y: 50 } }); setRepositioningId(null); }}>Fit Entire Photo</button>
          <button className={selected.fitMode === "cover" ? "is-active" : ""} onClick={() => updatePhoto(selected.id, { fitMode: "cover" })}>Fill Frame</button>
        </div>
        {selected.fitMode === "cover" && <div className="visual-position-actions">
          <span>{repositioningId === selected.id ? "Drag the photo inside its frame." : "Use Reposition to move the crop."}</span>
          <button onClick={() => updatePhoto(selected.id, { focalPoint: { x: 50, y: 50 } })}>Reset Position</button>
        </div>}
        <label className="field"><span>Alt text</span><textarea className="input" value={selected.altText} onChange={(event) => updatePhoto(selected.id, { altText: event.target.value })} /></label>
        <button className="visual-unlock-layout" onClick={unlockSelectedSlot}>Unlock Layout</button>
        <small>Unlocking this photo allows its layout to change.</small>
      </div>}
    </> : <>
      <div className="visual-photo-toolbar__actions">
        {(["small", "medium", "large", "full"] as const).map((size) => <button key={size} className={selected.size === size ? "is-active" : ""} onClick={() => updatePhoto(selected.id, { size })}>{size === "full" ? "Full Width" : size[0].toUpperCase() + size.slice(1)}</button>)}
        <button className={meta.coverAssetId === selected.assetId ? "is-active" : ""} onClick={() => mutateMeta((current) => ({ ...current, coverAssetId: selected.assetId }))}>Set as Cover</button>
        <button className="is-danger" onClick={() => removePhoto(selected.id)}>Remove</button>
      </div>
      <details className="visual-photo-advanced">
        <summary>Advanced photo settings</summary>
        <div className="visual-photo-advanced__body">
          <label className="check-row"><input type="checkbox" checked={selected.crop === "cover"} onChange={(event) => updatePhoto(selected.id, { crop: event.target.checked ? "cover" : "natural", cropIntent: event.target.checked ? "explicit" : undefined })} /> Crop to frame</label>
          <label className="field"><span>Alignment</span><select className="input" value={selected.alignment} onChange={(event) => updatePhoto(selected.id, { alignment: event.target.value as GalleryPhoto["alignment"] })}><option value="left">Left</option><option value="center">Center</option><option value="right">Right</option></select></label>
          <label className="field"><span>Caption</span><textarea className="input" value={selected.caption} onChange={(event) => updatePhoto(selected.id, { caption: event.target.value })} /></label>
          <label className="field"><span>Alt text</span><textarea className="input" value={selected.altText} onChange={(event) => updatePhoto(selected.id, { altText: event.target.value })} /></label>
          <label className="check-row"><input type="checkbox" checked={selected.hidden} onChange={(event) => updatePhoto(selected.id, { hidden: event.target.checked })} /> Hide photo</label>
        </div>
      </details>
    </>}
    <button className="visual-photo-toolbar__close" onClick={() => { setSelectedId(null); setReplacementPicker(null); setPhotoSettingsOpen(false); setRepositioningId(null); }} aria-label="Close photo controls">×</button>
  </div> : null;

  return <div className={`visual-editor visual-editor--${device}`}>
    <header className="visual-editor__topbar">
      <div><Link href="/admin/photography/galleries">← Galleries</Link><span className="visual-editor__divider" /><strong>{meta.title}</strong><span className={`visual-save-state visual-save-state--${saveState}`}>{saveState === "saving" ? "Saving…" : saveState === "unsaved" ? "Unsaved changes" : saveState === "error" ? "Save failed" : "Draft saved"}</span></div>
      <div className="visual-editor__history"><button onClick={undo} disabled={!history.length} title="Undo">↶</button><button onClick={redo} disabled={!future.length} title="Redo">↷</button></div>
      <div className="visual-editor__publish">
        <button onClick={() => void save()} disabled={busy}>Save draft</button>
        <Link href={`/preview/portfolio/${meta.slug}`} target="_blank">Preview ↗</Link>
        {entry.status === "published" && <button onClick={unpublish} disabled={busy}>Unpublish</button>}
        <button className="visual-editor__publish-button" onClick={publish} disabled={busy}>Publish</button>
        <button className="visual-editor__more" onClick={discard} disabled={busy} title="Discard unpublished changes">•••</button>
      </div>
    </header>
    {message && <div className="visual-toast" role="status">{message}<button onClick={() => setMessage("")}>×</button></div>}
    <div className="visual-editor__workspace">
      {device !== "full" && <aside className="visual-editor__panel">
        <nav className="visual-panel-tabs" aria-label="Gallery editing tools">
          {([["replace", "↻", "Replace Photos"], ["upload", "⇧", "Upload Photos"], ["library", "▧", "Photo Library"], ["details", "ⓘ", "Gallery Details"], ["advanced", "⚙", "Advanced Settings"]] as Array<[Panel, string, string]>).map(([id, glyph, label]) => <button key={id} className={panel === id ? "is-active" : ""} onClick={() => setPanel(id)}><i>{glyph}</i><span>{label}</span>{id === "upload" && uploads.some((item) => item.status === "uploading" || item.status === "queued") && <b />}</button>)}
        </nav>
        <div className="visual-panel-body">
          <>
            {panel === "replace" && <><div className="visual-panel-heading"><div><p>Keep the approved layout</p><h2>Replace Photos</h2></div></div>
              <p className="visual-help">Choose a position, then replace only its photograph. Sizes and spacing stay locked.</p>
              <div className="visual-slot-list">
                <strong>{meta.title} Photos</strong>
                {templateSlots.map((photo) => <article key={photo.slotId}>
                  {/* Template thumbnails use trusted media records. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo.asset.variants?.thumbnail?.url ?? photo.asset.public_url} alt="" />
                  <div><strong>{photo.slotLabel}</strong><span>{photo.replacementAssetId ? "Your Photo" : photo.referenceAssetId ? "Reference" : "Empty"}</span></div>
                  <button onClick={() => { setSelectedId(photo.id); setReplacementPicker("library"); setPhotoSettingsOpen(false); }}>Replace</button>
                </article>)}
                {!templateSlots.length && <p className="visual-help">This gallery has no locked template positions. Select a photo and keep its layout locked to add it here.</p>}
              </div>
            </>}
            {panel === "library" && <><div className="visual-panel-heading"><div><p>Choose an existing photo</p><h2>Photo Library</h2></div><button onClick={() => fileInput.current?.click()}>＋</button></div>
              <input className="visual-media-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search photos" />
              <div className="visual-media-grid">{filteredAssets.map((asset) => <article draggable={!usedAssetIds.has(asset.id)} onDragStart={() => { setDraggedAssetId(asset.id); setDraggedPhotoId(null); }} key={asset.id}>
                {/* Admin thumbnails use trusted media records. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={asset.variants?.thumbnail?.url ?? asset.public_url} alt={asset.alt_text ?? ""} />
                <span>{usedAssetIds.has(asset.id) ? "On page" : asset.title}</span>
                {selected && <button onClick={() => replaceSelected(asset)}>Replace selected</button>}
                {!selected && allPhotos.length === 0 && <button onClick={() => addReferencePhoto(asset)}>Use as reference</button>}
              </article>)}</div>
              <button className="visual-upload-button" onClick={() => fileInput.current?.click()}>Upload more photos</button>
            </>}
            {panel === "details" && <><div className="visual-panel-heading"><div><p>About this shoot</p><h2>Gallery Details</h2></div></div>
              <label className="field"><span>Title</span><input className="input" value={meta.title} onChange={(event) => mutateMeta((current) => ({ ...current, title: event.target.value }))} /></label>
              <label className="field"><span>Description</span><textarea className="input" value={meta.description} onChange={(event) => mutateMeta((current) => ({ ...current, description: event.target.value }))} /></label>
              {([["location", "Location"], ["shootDate", "Shoot date"], ["camera", "Camera"], ["lens", "Lens"], ["client", "Client"]] as const).map(([key, label]) => <label className="field" key={key}><span>{label}</span><input className="input" value={meta.settings[key] ?? ""} onChange={(event) => mutateMeta((current) => ({ ...current, settings: { ...current.settings, [key]: event.target.value } }))} /></label>)}
              <label className="field"><span>Tags</span><input className="input" value={(meta.settings.tags ?? []).join(", ")} onChange={(event) => mutateMeta((current) => ({ ...current, settings: { ...current.settings, tags: event.target.value.split(",").map((tag) => tag.trim()).filter(Boolean) } }))} /></label>
              <label className="check-row"><input type="checkbox" checked={meta.settings.showCaptions} onChange={(event) => mutateMeta((current) => ({ ...current, settings: { ...current.settings, showCaptions: event.target.checked } }))} /> Show captions</label>
              <h3>Collections</h3>{collections.map((collection) => <label className="visual-collection-row" key={collection.id}><input type="checkbox" checked={meta.collectionIds.includes(collection.id)} onChange={(event) => mutateMeta((current) => ({ ...current, collectionIds: event.target.checked ? [...current.collectionIds, collection.id] : current.collectionIds.filter((id) => id !== collection.id) }))} /><span>{collection.name}</span></label>)}
            </>}
            {panel === "advanced" && <><div className="visual-panel-heading"><div><p>Optional choices</p><h2>Advanced Settings</h2></div></div>
              <label className="field"><span>Page arrangement</span><select className="input" value={layout.preset} onChange={(event) => mutate((current) => ({ ...current, preset: event.target.value as GalleryLayout["preset"] }))}><option value="editorial-grid">Editorial grid</option><option value="masonry">Masonry</option><option value="full-width-story">Full-width story</option><option value="alternating">Alternating portrait & landscape</option><option value="horizontal-rows">Horizontal rows</option><option value="featured-hero">Featured hero + grid</option><option value="custom">Custom arrangement</option></select></label>
              <label className="field"><span>Page address</span><input className="input" value={meta.slug} onChange={(event) => mutateMeta((current) => ({ ...current, slug: event.target.value }))} /></label>
              <label className="check-row"><input type="checkbox" checked={meta.featured} onChange={(event) => mutateMeta((current) => ({ ...current, featured: event.target.checked }))} /> Feature this gallery</label>
              <div className="visual-section-add"><strong>Add a photo block</strong>{(["images", "text", "spacer", "divider", "quote"] as GallerySection["type"][]).map((type) => <button key={type} onClick={() => addSection(type)}>＋ {type === "images" ? "Photo block" : type[0].toUpperCase() + type.slice(1)}</button>)}</div>
              {imageSections(layout).filter((section) => section.items.length === 0).map((section) => <button className="visual-remove-empty-block" key={section.id} onClick={() => removeEmptyPhotoBlock(section.id)}>Remove empty photo block</button>)}
              <h3>Hidden photos</h3><div className="visual-media-grid">{allPhotos.filter((photo) => photo.hidden).map((photo) => <article key={photo.id} onClick={() => setSelectedId(photo.id)}>
              {/* Hidden-photo thumbnails use trusted media records. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.asset.variants?.thumbnail?.url ?? photo.asset.public_url} alt="" />
              <span>{photo.asset.title}</span><button onClick={(event) => { event.stopPropagation(); updatePhoto(photo.id, { hidden: false }); }}>Unhide</button></article>)}</div>{!allPhotos.some((photo) => photo.hidden) && <p className="visual-help">Hidden photographs stay in the gallery draft and media library, but never enter the published snapshot.</p>}</>}
            {panel === "upload" && <><div className="visual-panel-heading"><div><p>Add to this gallery</p><h2>Upload Photos</h2></div><button onClick={() => fileInput.current?.click()}>＋</button></div>
              <div className="visual-dropzone" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); enqueue([...event.dataTransfer.files]); }}><strong>Drop a shoot here</strong><span>JPG, PNG, WebP or AVIF</span><div><button onClick={() => fileInput.current?.click()}>Choose files</button><button onClick={() => folderInput.current?.click()}>Choose folder</button></div></div>
              <div className="visual-upload-list">{uploads.map((item) => <article key={item.id}><div><strong>{item.file.name}</strong><span>{item.status}{item.error ? ` · ${item.error}` : ""}</span></div><progress value={item.progress} max="100" /><div>{item.status === "queued" && <button onClick={() => setUploads((items) => items.map((upload) => upload.id === item.id ? { ...upload, status: "paused" } : upload))}>Pause</button>}{item.status === "paused" && <button onClick={() => setUploads((items) => items.map((upload) => upload.id === item.id ? { ...upload, status: "queued" } : upload))}>Resume</button>}{item.status === "failed" && <button onClick={() => setUploads((items) => items.map((upload) => upload.id === item.id ? { ...upload, status: "queued", error: undefined, progress: 0 } : upload))}>Retry</button>}</div></article>)}</div>
              {!uploads.length && <p className="visual-help">Uploads continue while you work. Completed photos appear in the Photo Library.</p>}
            </>}
          </>
        </div>
      </aside>}
      <section className="visual-editor__canvas">
        <div className="visual-device-toolbar">
          <div><button className={device === "desktop" ? "is-active" : ""} onClick={() => setDevice("desktop")}>Desktop</button><button className={device === "tablet" ? "is-active" : ""} onClick={() => setDevice("tablet")}>Tablet</button><button className={device === "mobile" ? "is-active" : ""} onClick={() => setDevice("mobile")}>390px</button><button className={device === "full" ? "is-active" : ""} onClick={() => setDevice(device === "full" ? "desktop" : "full")}>Full width</button></div>
          <Link href={`/preview/portfolio/${meta.slug}`} target="_blank">Open preview in new tab ↗</Link>
        </div>
        {selectedToolbar}
        <div className="visual-preview-stage">
          <div className="visual-preview-page">
            <div className="public-site">
              <SiteHeader />
              <GalleryEditorPreview entry={{ ...entry, title: meta.title, slug: meta.slug, excerpt: meta.description, category: meta.category, cover_asset_id: meta.coverAssetId, cover_asset: assets.find((asset) => asset.id === meta.coverAssetId) ?? null }} layout={layout} settings={meta.settings} selectedId={selectedId} onSelect={(id) => { setSelectedId(id); setReplacementPicker(null); setPhotoSettingsOpen(false); setRepositioningId(null); }} onPhotoMetrics={setPhotoMetrics} repositioningId={repositioningId} onReposition={updateFocalPointLive} onDropPhoto={addOrMovePhoto} onDragPhoto={(id) => { setDraggedPhotoId(id); setDraggedAssetId(null); setDraggedSectionId(null); }} onDragSection={(id) => { setDraggedSectionId(id); setDraggedPhotoId(null); setDraggedAssetId(null); }} />
            </div>
          </div>
        </div>
      </section>
    </div>
    <input ref={fileInput} type="file" accept="image/*" multiple hidden onChange={(event) => enqueue([...(event.target.files ?? [])])} />
    <input ref={folderInput} type="file" accept="image/*" multiple hidden onChange={(event) => enqueue([...(event.target.files ?? [])])} />
  </div>;
}
