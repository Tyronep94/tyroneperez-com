"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { bulkMoveMedia, bulkTagMedia, deleteMedia, registerMedia, replaceMediaMetadata, updateMediaDetails } from "@/app/admin/media/actions";
import { IntrinsicImage } from "@/components/media/intrinsic-image";
import type { MediaAsset } from "@/types/cms";

const fileSize = (bytes: number) => bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;

async function intrinsicMetadata(file: File) {
  if (!file.type.startsWith("image/")) return { width: null, height: null, aspect_ratio: null, orientation: null };
  const url = URL.createObjectURL(file);
  try {
    const image = new window.Image();
    await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = reject; image.src = url; });
    const width = image.naturalWidth;
    const height = image.naturalHeight;
    return {
      width,
      height,
      aspect_ratio: width / height,
      orientation: width === height ? "square" as const : width > height ? "landscape" as const : "portrait" as const,
    };
  } finally { URL.revokeObjectURL(url); }
}

export function MediaLibrary({ assets, collections }: { assets: MediaAsset[]; collections: Array<{id:string;name:string}> }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [optimisticAssets, setOptimisticAssets] = useState<MediaAsset[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("all");
  const [sort, setSort] = useState("newest");
  const [tag, setTag] = useState("all");
  const [dragging, setDragging] = useState(false);
  const [view, setView] = useState<"masonry" | "compact">("masonry");
  const [message, setMessage] = useState("");
  const [busy, startTransition] = useTransition();
  const replaceInput = useRef<HTMLInputElement>(null);
  const localAssets = useMemo(() => {
    const optimisticIds = new Set(optimisticAssets.map(asset => asset.id));
    return [...optimisticAssets, ...assets.filter(asset => !optimisticIds.has(asset.id))];
  }, [assets, optimisticAssets]);
  const changeView = (next: "masonry" | "compact") => {
    setView(next);
  };
  const allTags = useMemo(() => [...new Set(localAssets.flatMap(asset => asset.tags ?? []))].sort(), [localAssets]);
  const filtered = useMemo(() => localAssets.filter(asset => (kind === "all" || asset.kind === kind) && (tag === "all" || asset.tags?.includes(tag)) && `${asset.title} ${asset.filename} ${asset.alt_text ?? ""} ${(asset.tags ?? []).join(" ")}`.toLowerCase().includes(query.toLowerCase())).sort((a,b) => sort === "name" ? a.title.localeCompare(b.title) : sort === "size" ? b.file_size - a.file_size : new Date(b.created_at).getTime() - new Date(a.created_at).getTime()), [localAssets, kind, query, sort, tag]);

  const upload = async (files: File[]) => {
    if (!files.length) return;
    setMessage(`Uploading ${files.length} asset${files.length === 1 ? "" : "s"}…`);
    const supabase = createClient();
    for (const file of files) {
      const metadata = await intrinsicMetadata(file);
      const safeName = file.name.toLowerCase().replace(/[^a-z0-9._-]+/g, "-");
      const path = `${new Date().getFullYear()}/${crypto.randomUUID()}-${safeName}`;
      const { error } = await supabase.storage.from("cms-media").upload(path, file, { cacheControl: "31536000", upsert: false });
      if (error) { setMessage(`Upload failed: ${error.message}`); return; }
      const { data } = supabase.storage.from("cms-media").getPublicUrl(path);
      const result = await registerMedia({ storage_path: path, public_url: data.publicUrl, title: file.name.replace(/\.[^.]+$/, ""), filename: file.name, alt_text: null, mime_type: file.type || "application/octet-stream", file_size: file.size, ...metadata });
      if (!result.ok) { setMessage(`Metadata could not be saved: ${result.message ?? "Unknown error"}`); return; }
      if (result.asset) {
        setOptimisticAssets(current => [{ ...(result.asset as MediaAsset), usage_count: 0, tags: [] }, ...current]);
      }
    }
    setMessage("Upload complete.");
    router.refresh();
  };

  const remove = () => {
    if (!window.confirm(`Delete ${selected.length} selected asset${selected.length === 1 ? "" : "s"}? Assets in use will be protected.`)) return;
    startTransition(async () => {
      const result = await deleteMedia(selected);
      setMessage(result.ok ? "Assets deleted." : result.message ?? "Assets could not be deleted.");
      if (result.ok) {
        setOptimisticAssets(current => current.filter(asset => !selected.includes(asset.id)));
        setSelected([]);
        router.refresh();
      }
    });
  };

  const copy = async (value: string, label: string) => { await navigator.clipboard.writeText(value); setMessage(`${label} copied.`); };
  const selectedAsset = selected.length === 1 ? localAssets.find(asset => asset.id === selected[0]) : undefined;
  const addTag = () => {
    const tag = window.prompt("Tag selected assets");
    if (!tag) return;
    startTransition(async () => { const result = await bulkTagMedia(selected, tag); setMessage(result.ok ? "Tag added." : result.message ?? "Tagging failed."); if (result.ok) router.refresh(); });
  };
  const move = (collectionId: string) => {
    if (!collectionId) return;
    startTransition(async () => { const result = await bulkMoveMedia(selected, collectionId); setMessage(result.ok ? "Assets moved." : result.message ?? "Move failed."); if (result.ok) router.refresh(); });
  };
  const replace = async (file?: File) => {
    if (!file || !selectedAsset) return;
    const supabase = createClient();
    setMessage("Replacing asset…");
    const { error } = await supabase.storage.from("cms-media").upload(selectedAsset.storage_path, file, { cacheControl:"31536000", upsert:true });
    if (error) { setMessage(error.message); return; }
    const metadata = await intrinsicMetadata(file);
    const result = await replaceMediaMetadata(selectedAsset.id, { filename:file.name, mime_type:file.type || "application/octet-stream", file_size:file.size, public_url:selectedAsset.public_url, ...metadata });
    setMessage(result.ok ? "Asset replaced. Existing URLs were preserved." : result.message ?? "Replacement failed.");
    if (result.ok) {
      setOptimisticAssets(current => [
        { ...selectedAsset, filename: file.name, mime_type: file.type || "application/octet-stream", file_size: file.size, ...metadata, updated_at: new Date().toISOString() },
        ...current.filter(asset => asset.id !== selectedAsset.id),
      ]);
      router.refresh();
    }
  };
  const saveDetails = (formData: FormData) => startTransition(async () => {
    if (!selectedAsset) return;
    const keys = ["title","alt_text","caption","description","copyright","photographer"] as const;
    const values = Object.fromEntries(keys.map(key => [key,String(formData.get(key) ?? "")]));
    const result = await updateMediaDetails(selectedAsset.id, values);
    setMessage(result.ok ? "Asset details saved." : result.message ?? "Details could not be saved.");
    if (result.ok) router.refresh();
  });
  return <div className="cms-media">
    <div className={`cms-dropzone ${dragging ? "is-dragging" : ""}`} onDragOver={event => {event.preventDefault(); setDragging(true);}} onDragLeave={() => setDragging(false)} onDrop={event => {event.preventDefault(); setDragging(false); void upload([...event.dataTransfer.files]);}} onClick={() => input.current?.click()} role="button" tabIndex={0}>
      <input ref={input} type="file" multiple hidden onChange={event => void upload([...(event.target.files ?? [])])} />
      <span>＋</span><strong>Drop assets here</strong><p>or choose files · images, audio, video, and PDF up to 50 MB</p>
    </div>
    <div className="cms-library-tools">
      <input className="input" type="search" placeholder="Search media" value={query} onChange={event => setQuery(event.target.value)} aria-label="Search media" />
      <select className="input" value={kind} onChange={event => setKind(event.target.value)} aria-label="Filter media type"><option value="all">All media</option><option value="image">Images</option><option value="audio">Audio</option><option value="video">Video</option><option value="document">Documents</option></select>
      <select className="input" value={tag} onChange={event => setTag(event.target.value)} aria-label="Filter media tag"><option value="all">All tags</option>{allTags.map(item=><option value={item} key={item}>{item}</option>)}</select>
      <select className="input" value={sort} onChange={event => setSort(event.target.value)} aria-label="Sort media"><option value="newest">Newest</option><option value="name">Name</option><option value="size">File size</option></select>
      {selected.length > 0 && <button className="btn btn-danger btn-small" onClick={remove} disabled={busy}>Delete {selected.length}</button>}
    </div>
    <div className="cms-media-viewbar">
      <span>{filtered.length} visible asset{filtered.length === 1 ? "" : "s"}</span>
      <div role="group" aria-label="Media library view">
        <button type="button" className={view === "masonry" ? "is-active" : ""} aria-pressed={view === "masonry"} onClick={() => changeView("masonry")}>Masonry</button>
        <button type="button" className={view === "compact" ? "is-active" : ""} aria-pressed={view === "compact"} onClick={() => changeView("compact")}>Compact Grid</button>
      </div>
    </div>
    {selected.length > 0 && <div className="cms-bulk-bar"><strong>{selected.length} selected</strong><button type="button" onClick={addTag} disabled={busy}>Add tag</button><select defaultValue="" onChange={event => move(event.target.value)} disabled={busy}><option value="" disabled>Move to collection…</option>{collections.map(collection=><option value={collection.id} key={collection.id}>{collection.name}</option>)}</select>{selectedAsset && <><input ref={replaceInput} type="file" hidden onChange={event=>void replace(event.target.files?.[0])}/><button type="button" onClick={()=>replaceInput.current?.click()} disabled={busy}>Replace file</button></>}</div>}
    {message && <p className="notice notice-success" role="status">{message}</p>}
    <div className={`cms-media-grid cms-media-grid--${view}`}>
      {filtered.map(asset => <article className={`cms-asset ${selected.includes(asset.id) ? "is-selected" : ""}${asset.object_status === "missing" ? " is-missing" : ""}`} key={asset.id}>
        <div className="cms-asset-preview">{asset.kind === "image"
          ? <IntrinsicImage src={asset.variants?.thumbnail?.url ?? asset.public_url} alt={asset.alt_text || asset.filename} width={asset.width} height={asset.height} missingLabel={`${asset.filename} is missing`} />
          : <span>{asset.kind}</span>}</div>
        <div className="cms-asset-copy">
          <label className="cms-asset-select"><input type="checkbox" checked={selected.includes(asset.id)} onChange={() => setSelected(current => current.includes(asset.id) ? current.filter(id => id !== asset.id) : [...current, asset.id])} /><span className="sr-only">Select {asset.title}</span></label>
          <div><strong title={asset.filename}>{asset.filename}</strong><p>{asset.width && asset.height ? `${asset.width} × ${asset.height}` : asset.kind}<span>·</span>{fileSize(asset.file_size)}{asset.object_status === "missing" && <><span>·</span>Missing object</>}</p></div>
        </div>
        <div className="cms-asset-actions"><button onClick={() => void copy(asset.public_url, "URL")}>URL</button><button onClick={() => void copy(`![${asset.alt_text ?? asset.title}](${asset.public_url})`, "Markdown")}>MD</button><button onClick={() => void copy(`<img src="${asset.public_url}" alt="${asset.alt_text ?? ""}">`, "HTML")}>HTML</button></div>
      </article>)}
    </div>
    {selectedAsset && <form action={saveDetails} className="card cms-asset-inspector" key={selectedAsset.id}><div><p className="eyebrow">Asset details</p><h2 className="section-title">{selectedAsset.filename}</h2><dl><div><dt>Uploaded</dt><dd>{new Intl.DateTimeFormat("en-US",{dateStyle:"medium"}).format(new Date(selectedAsset.created_at))}</dd></div><div><dt>Dimensions</dt><dd>{selectedAsset.width && selectedAsset.height ? `${selectedAsset.width} × ${selectedAsset.height}` : "Not applicable"}</dd></div><div><dt>File size</dt><dd>{fileSize(selectedAsset.file_size)}</dd></div><div><dt>Usage</dt><dd>{selectedAsset.usage_count ?? 0}</dd></div></dl></div><div className="form-grid"><label className="field"><span>Title</span><input className="input" name="title" defaultValue={selectedAsset.title}/></label><label className="field"><span>Alt text</span><input className="input" name="alt_text" defaultValue={selectedAsset.alt_text ?? ""}/></label><label className="field"><span>Caption</span><input className="input" name="caption" defaultValue={selectedAsset.caption ?? ""}/></label><label className="field"><span>Photographer</span><input className="input" name="photographer" defaultValue={selectedAsset.photographer ?? ""}/></label><label className="field"><span>Copyright</span><input className="input" name="copyright" defaultValue={selectedAsset.copyright ?? ""}/></label><label className="field span-2"><span>Description</span><textarea className="input" name="description" defaultValue={selectedAsset.description ?? ""}/></label><button className="btn" disabled={busy}>Save details</button></div></form>}
    {!filtered.length && <div className="card empty">No assets match this view.</div>}
  </div>;
}
