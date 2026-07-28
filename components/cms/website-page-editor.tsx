"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition, type ReactNode } from "react";
import { publishWebsitePage, saveWebsitePageDraft } from "@/app/admin/pages/actions";
import { IntrinsicImage } from "@/components/media/intrinsic-image";
import { PageRuntime, type DiscoveredWebsiteSlot } from "@/components/public/page-runtime";
import { SiteFooter } from "@/components/public/site-footer";
import { SiteHeader } from "@/components/public/site-header";
import type { MediaAsset } from "@/types/cms";
import type { MediaIntegrityIssue } from "@/lib/media-integrity";
import { isPhotographyCaseStudyMediaSlot, photographyCaseStudyEditors } from "@/lib/photography-case-studies";
import { WebsiteSlotMediaControls } from "@/components/cms/website-slot-media-controls";
import {
  websitePageMeta,
  type WebsitePageDocument,
  type WebsitePageKey,
  type WebsiteSlotLayout,
  type WebsiteSlotOverride,
} from "@/types/website-editor";

type EditorMode = "content" | "layout";
const clone = <T,>(value: T): T => structuredClone(value);

export function WebsitePageEditor({
  pageKey,
  initialDocument,
  initialIntegrityIssues,
  assets,
  title,
  previewPath,
  publishedPath,
  slotNamespace,
  children,
}: {
  pageKey: WebsitePageKey;
  initialDocument: WebsitePageDocument;
  initialIntegrityIssues: MediaIntegrityIssue[];
  assets: MediaAsset[];
  title?: string;
  previewPath?: string;
  publishedPath?: string;
  slotNamespace?: string;
  children: ReactNode;
}) {
  const [document, setDocument] = useState(() => clone(initialDocument));
  const [undoStack, setUndoStack] = useState<WebsitePageDocument[]>([]);
  const [redoStack, setRedoStack] = useState<WebsitePageDocument[]>([]);
  const [mode, setMode] = useState<EditorMode>("content");
  const [selected, setSelected] = useState<DiscoveredWebsiteSlot | null>(null);
  const [saveState, setSaveState] = useState<"saved" | "unsaved" | "saving" | "error">("saved");
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");
  const [integrityIssues, setIntegrityIssues] = useState(initialIntegrityIssues);
  const [busy, startTransition] = useTransition();
  const initialized = useRef(false);
  const page = websitePageMeta[pageKey];

  const selectedOverride = selected ? document.slots[selected.id] : undefined;
  const selectedIsFeaturedSoundAudio = pageKey === "music"
    && selected?.type === "media"
    && selected.id.startsWith("music.featured-sound.")
    && selected.id !== "music.featured-sound.image";
  const selectedIsFeaturedSoundImage = pageKey === "music"
    && selected?.type === "media"
    && selected.id === "music.featured-sound.image";
  const selectedIsAboutPortrait = pageKey === "about"
    && selected?.type === "media"
    && selected.id === "about.portrait";
  const selectedIsPhotographyCaseStudyImage = selected?.type === "media"
    && isPhotographyCaseStudyMediaSlot(selected.id);
  const selectedUsesRichMedia = selected?.type === "media"
    && (pageKey === "portfolio" || selectedIsFeaturedSoundAudio || selectedIsFeaturedSoundImage || selectedIsAboutPortrait || selectedIsPhotographyCaseStudyImage);
  const filteredAssets = useMemo(() => assets.filter((asset) =>
    asset.kind === "image" && `${asset.title} ${asset.filename}`.toLowerCase().includes(query.toLowerCase()),
  ), [assets, query]);
  const imageAssets = useMemo(() => assets.filter((asset) => asset.kind === "image"), [assets]);
  const audioAssets = useMemo(() => assets.filter((asset) => asset.kind === "audio"), [assets]);

  const commitDocument = useCallback((next: WebsitePageDocument) => {
    setUndoStack((history) => [...history, clone(document)].slice(-50));
    setRedoStack([]);
    setDocument(next);
    setSaveState("unsaved");
  }, [document]);

  const updateSelected = useCallback((patch: Partial<WebsiteSlotOverride>) => {
    if (!selected) return;
    commitDocument({
      ...document,
      slots: {
        ...document.slots,
        [selected.id]: {
          text: selected.text,
          href: selected.href,
          alt: selected.alt,
          ...document.slots[selected.id],
          ...patch,
          id: selected.id,
          type: selected.type,
        },
      },
    });
  }, [commitDocument, document, selected]);

  const updateLayout = (patch: Partial<WebsiteSlotLayout>) => {
    updateSelected({ layout: { ...selectedOverride?.layout, ...patch } });
  };

  const selectAsset = (asset: MediaAsset) => {
    if (!selected) return;
    updateSelected({
      assetId: asset.id,
      asset,
      alt: asset.alt_text ?? selected.alt ?? "",
      layout: {
        ...selectedOverride?.layout,
        objectFit: "contain",
        objectPosition: "center",
        manualZoom: 1,
        manualX: 0,
        manualY: 0,
      },
    });
    setIntegrityIssues((issues) => issues.filter((issue) => issue.slotId !== selected.id));
  };

  const removeBrokenOverride = (slotId: string) => {
    const slots = { ...document.slots };
    delete slots[slotId];
    commitDocument({ ...document, slots });
    setIntegrityIssues((issues) => issues.filter((issue) => issue.slotId !== slotId));
    if (selected?.id === slotId) setSelected(null);
  };

  const focusBrokenSlot = (slotId: string) => {
    window.document.querySelector<HTMLElement>(`[data-page-slot="${CSS.escape(slotId)}"]`)?.click();
  };

  const updateManualCropLive = useCallback((patch: Pick<WebsiteSlotLayout, "manualX" | "manualY">) => {
    if (!selected) return;
    setDocument((current) => ({
      ...current,
      slots: {
        ...current.slots,
        [selected.id]: {
          text: selected.text,
          href: selected.href,
          alt: selected.alt,
          ...current.slots[selected.id],
          id: selected.id,
          type: selected.type,
          layout: { ...current.slots[selected.id]?.layout, ...patch },
        },
      },
    }));
    setSaveState("unsaved");
  }, [selected]);

  const restoreSelectedContent = () => {
    if (!selected) return;
    const slots = { ...document.slots };
    delete slots[selected.id];
    commitDocument({ ...document, slots });
  };

  const undo = useCallback(() => {
    const previous = undoStack.at(-1);
    if (!previous) return;
    setUndoStack((history) => history.slice(0, -1));
    setRedoStack((history) => [clone(document), ...history].slice(0, 50));
    setDocument(clone(previous));
    setSaveState("unsaved");
  }, [document, undoStack]);

  const redo = useCallback(() => {
    const next = redoStack[0];
    if (!next) return;
    setRedoStack((history) => history.slice(1));
    setUndoStack((history) => [...history, clone(document)].slice(-50));
    setDocument(clone(next));
    setSaveState("unsaved");
  }, [document, redoStack]);

  const save = useCallback(async (quiet = false) => {
    setSaveState("saving");
    const result = await saveWebsitePageDraft(pageKey, document);
    setSaveState(result.ok ? "saved" : "error");
    if (!quiet) setMessage(result.ok ? "Draft saved." : result.message ?? "Draft could not be saved.");
    return result.ok;
  }, [document, pageKey]);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      return;
    }
    if (saveState !== "unsaved") return;
    const timer = window.setTimeout(() => void save(true), 900);
    return () => window.clearTimeout(timer);
  }, [document, save, saveState]);

  useEffect(() => {
    const handleHistoryShortcut = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== "z") return;
      event.preventDefault();
      if (event.shiftKey) redo();
      else undo();
    };
    window.addEventListener("keydown", handleHistoryShortcut);
    return () => window.removeEventListener("keydown", handleHistoryShortcut);
  }, [redo, undo]);

  const enterLayoutMode = () => {
    if (mode === "layout") {
      setMode("content");
      return;
    }
    if (!window.confirm("Layout Mode can change positioning, sizing, spacing, and structure. Continue?")) return;
    setMode("layout");
  };

  const publish = () => startTransition(async () => {
    const result = await publishWebsitePage(pageKey, document);
    setMessage(result.ok ? `${page.label} page published.` : result.message ?? "Page could not be published.");
    if (result.ok) setSaveState("saved");
  });

  return (
    <div className={`website-page-editor website-page-editor--${mode}`}>
      <header className="website-page-editor__topbar" data-page-editor-ignore>
        <div>
          <Link href="/admin">← Pages</Link>
          <strong>{title ?? page.label}</strong>
          <span className={`visual-save-state visual-save-state--${saveState}`}>
            {saveState === "saving" ? "Saving…" : saveState === "unsaved" ? "Unsaved changes" : saveState === "error" ? "Save failed" : "Draft saved"}
          </span>
        </div>
        <div className="website-page-editor__modes" aria-label="Editing mode">
          <button className={mode === "content" ? "is-active" : ""} onClick={() => setMode("content")}>Content Mode</button>
          <button className={mode === "layout" ? "is-active" : ""} onClick={enterLayoutMode}>Layout Mode</button>
        </div>
        <div>
          <span className="website-page-editor__history">
            <button onClick={undo} disabled={!undoStack.length} aria-label="Undo last page change">Undo</button>
            <button onClick={redo} disabled={!redoStack.length} aria-label="Redo last page change">Redo</button>
          </span>
          <button onClick={() => void save()} disabled={busy}>Save draft</button>
          <Link href={previewPath ?? `/preview/pages/${pageKey}`} target="_blank">Private preview ↗</Link>
          <Link href={publishedPath ?? page.path} target="_blank">View published ↗</Link>
          <button className="website-page-editor__publish" onClick={publish} disabled={busy}>Publish</button>
        </div>
      </header>
      {integrityIssues.length > 0 && <div className="website-media-integrity" role="alert" data-page-editor-ignore>
        <strong>Broken media must be resolved before publishing.</strong>
        {integrityIssues.map((issue) => <div key={`${issue.slotId}-${issue.assetId}`}>
          <span>{issue.filename} · {issue.pageKey}:{issue.slotId} · {issue.reason === "missing_object" ? "storage object missing" : "media record missing"}</span>
          <button type="button" onClick={() => focusBrokenSlot(issue.slotId)}>Replace</button>
          <button type="button" onClick={() => removeBrokenOverride(issue.slotId)}>Remove</button>
        </div>)}
      </div>}
      {message && <div className="visual-toast" role="status">{message}<button onClick={() => setMessage("")}>×</button></div>}
      <div className="website-page-editor__workspace">
        <aside className="website-page-editor__inspector" data-page-editor-ignore>
          {!selected && <div className="website-page-editor__welcome">
            <p className="eyebrow">{mode === "content" ? "Content Mode" : "Advanced"}</p>
            <h2>{mode === "content" ? "Click anything on the page." : "Choose an element to adjust its layout."}</h2>
            <p>{mode === "content"
              ? "Headings, text, buttons, links, and images reveal an Edit affordance when you hover."
              : "Layout changes apply only to the selected element. Content remains unchanged."}</p>
            {pageKey === "photography" && !slotNamespace && <div className="website-page-editor__case-studies">
              <h3>Photography case studies</h3>
              <p>Open a destination page to replace its project image.</p>
              {photographyCaseStudyEditors.map((item) => (
                <Link key={item.slug} href={`/admin/pages/photography/case-studies/${item.slug}`}>
                  <span>{item.label}</span><b aria-hidden="true">Edit →</b>
                </Link>
              ))}
            </div>}
          </div>}
          {selected && <div className="website-slot-inspector">
            <div className="website-slot-inspector__heading">
              <div><p className="eyebrow">{selected.type}</p><h2>{selected.label}</h2></div>
              <button onClick={() => setSelected(null)} aria-label="Close element controls">×</button>
            </div>
            {mode === "content" && <>
              {selected.type !== "media" && <label className="field">
                <span>{selected.type === "link" || selected.type === "button" ? "Label" : "Text"}</span>
                <textarea
                  className="input"
                  value={selectedOverride?.text ?? selected.text}
                  onChange={(event) => updateSelected({ text: event.target.value })}
                />
              </label>}
              {selected.type === "link" && <label className="field">
                <span>Link destination</span>
                <input
                  className="input"
                  value={selectedOverride?.href ?? selected.href ?? ""}
                  onChange={(event) => updateSelected({ href: event.target.value })}
                />
              </label>}
              {selectedUsesRichMedia && <WebsiteSlotMediaControls
                key={selected.id}
                selected={selected}
                override={selectedOverride}
                imageAssets={imageAssets}
                audioAssets={audioAssets}
                audioOnly={selectedIsFeaturedSoundAudio}
                imageOnly={selectedIsFeaturedSoundImage || selectedIsAboutPortrait || selectedIsPhotographyCaseStudyImage}
                onUpdate={updateSelected}
                onRestore={restoreSelectedContent}
              />}
              {selected.type === "media" && !selectedUsesRichMedia && <>
                <label className="field"><span>Alt text</span><textarea className="input" value={selectedOverride?.alt ?? selected.alt ?? ""} onChange={(event) => updateSelected({ alt: event.target.value })} /></label>
                <label className="field"><span>Find a photo</span><input className="input" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search Media Library" /></label>
                <div className="website-page-editor__media-grid">
                  {filteredAssets.slice(0, 80).map((asset) => <button key={asset.id} onClick={() => selectAsset(asset)}>
                    <IntrinsicImage src={asset.variants?.thumbnail?.url ?? asset.public_url} alt="" width={asset.width} height={asset.height} missingLabel="Missing media" />
                    <span>{asset.title}</span>
                  </button>)}
                </div>
              </>}
              {selectedOverride && !selectedUsesRichMedia && (
                <button className="website-slot-layout__reset" onClick={restoreSelectedContent}>
                  Restore original content
                </button>
              )}
            </>}
            {mode === "layout" && <div className="website-slot-layout">
              {(["width", "maxWidth", "marginTop", "marginBottom", "padding"] as const).map((field) => <label className="field" key={field}>
                <span>{field.replace(/([A-Z])/g, " $1")}</span>
                <input className="input" value={selectedOverride?.layout?.[field] ?? ""} placeholder="e.g. 80% or 32px" onChange={(event) => updateLayout({ [field]: event.target.value })} />
              </label>)}
              <label className="field"><span>Text alignment</span><select className="input" value={selectedOverride?.layout?.textAlign ?? ""} onChange={(event) => updateLayout({ textAlign: (event.target.value || undefined) as WebsiteSlotLayout["textAlign"] })}><option value="">Template default</option><option value="left">Left</option><option value="center">Center</option><option value="right">Right</option></select></label>
              {selected.type === "media" && <>
                <fieldset className="website-display-mode">
                  <legend>Display Mode</legend>
                  <label><input type="radio" name="display-mode" checked={selectedOverride?.layout?.objectFit !== "manual"} onChange={() => updateLayout({ objectFit: "contain", objectPosition: "center", manualZoom: 1, manualX: 0, manualY: 0 })} /> Original Proportions <small>No crop</small></label>
                  <label><input type="radio" name="display-mode" checked={selectedOverride?.layout?.objectFit === "manual"} onChange={() => updateLayout({ objectFit: "manual", objectPosition: "center", manualZoom: selectedOverride?.layout?.manualZoom ?? 1, manualX: selectedOverride?.layout?.manualX ?? 0, manualY: selectedOverride?.layout?.manualY ?? 0 })} /> Manual Crop</label>
                </fieldset>
                {selectedOverride?.layout?.objectFit === "manual" && <div className="website-manual-crop">
                  <p>Drag the photo in the preview or use the controls below.</p>
                  <label className="field"><span>Zoom · {(selectedOverride.layout.manualZoom ?? 1).toFixed(2)}×</span><input type="range" min="0.5" max="4" step="0.05" value={selectedOverride.layout.manualZoom ?? 1} onChange={(event) => updateLayout({ manualZoom: Number(event.target.value) })} /></label>
                  <label className="field"><span>Horizontal · {Math.round(selectedOverride.layout.manualX ?? 0)}</span><input type="range" min="-100" max="100" value={selectedOverride.layout.manualX ?? 0} onChange={(event) => updateLayout({ manualX: Number(event.target.value) })} /></label>
                  <label className="field"><span>Vertical · {Math.round(selectedOverride.layout.manualY ?? 0)}</span><input type="range" min="-100" max="100" value={selectedOverride.layout.manualY ?? 0} onChange={(event) => updateLayout({ manualY: Number(event.target.value) })} /></label>
                  <button type="button" onClick={() => updateLayout({ manualZoom: 1, manualX: 0, manualY: 0 })}>Reset Crop</button>
                </div>}
              </>}
              <button className="website-slot-layout__reset" onClick={() => updateSelected({ layout: undefined })}>Restore template layout</button>
            </div>}
          </div>}
        </aside>
        <section className="website-page-editor__stage">
          <div className="website-page-editor__page public-site">
            <SiteHeader />
            <PageRuntime pageKey={pageKey} slotNamespace={slotNamespace} document={document} editing selectedId={selected?.id ?? null} onSelect={setSelected} onManualCropPosition={updateManualCropLive}>
              {children}
            </PageRuntime>
            <SiteFooter />
          </div>
        </section>
      </div>
    </div>
  );
}
