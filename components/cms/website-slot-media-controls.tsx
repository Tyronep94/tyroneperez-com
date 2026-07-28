"use client";

import { useRef, useState } from "react";
import { registerMedia } from "@/app/admin/media/actions";
import { validateSpotifyLink } from "@/app/admin/content/actions";
import { IntrinsicImage } from "@/components/media/intrinsic-image";
import { PortfolioAudioPlayer } from "@/components/public/portfolio-audio-player";
import { createClient } from "@/lib/supabase/client";
import type { MediaAsset } from "@/types/cms";
import type { DiscoveredWebsiteSlot } from "@/components/public/page-runtime";
import { websiteSlotAudioMedia, type WebsiteSlotOverride } from "@/types/website-editor";

type ChangeMode = null | "choose" | "image" | "uploaded_audio" | "spotify";

const clearedMedia = {
  assetId: undefined,
  asset: undefined,
  audio_asset_id: undefined,
  audio_asset: undefined,
  spotify_url: undefined,
  spotify_entity_type: undefined,
  spotify_entity_id: undefined,
  spotify_embed_url: undefined,
  spotify_title: undefined,
  spotify_thumbnail_url: undefined,
  title: undefined,
  role: undefined,
  caption: undefined,
  artwork_asset_id: undefined,
  artwork_asset: undefined,
};

export function WebsiteSlotMediaControls({
  selected,
  override,
  imageAssets,
  audioAssets,
  audioOnly = false,
  imageOnly = false,
  onUpdate,
  onRestore,
}: {
  selected: DiscoveredWebsiteSlot;
  override?: WebsiteSlotOverride;
  imageAssets: MediaAsset[];
  audioAssets: MediaAsset[];
  audioOnly?: boolean;
  imageOnly?: boolean;
  onUpdate: (patch: Partial<WebsiteSlotOverride>) => void;
  onRestore: () => void;
}) {
  const audioFileInput = useRef<HTMLInputElement>(null);
  const imageFileInput = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<ChangeMode>(null);
  const [query, setQuery] = useState("");
  const [spotifyUrl, setSpotifyUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [localImageAssets, setLocalImageAssets] = useState(imageAssets);
  const [localAudioAssets, setLocalAudioAssets] = useState(audioAssets);
  const mediaType = override?.media_type
    ?? (override?.audio_asset_id ? "uploaded_audio" : override?.spotify_url ? "spotify" : audioOnly ? null : "image");
  const audioMedia = websiteSlotAudioMedia(override);
  const selectedAudio = audioMedia?.media_type === "uploaded_audio"
    ? override?.audio_asset ?? localAudioAssets.find((asset) => asset.id === audioMedia.audio_asset_id)
    : null;

  const chooseImage = (asset: MediaAsset) => {
    onUpdate({
      ...clearedMedia,
      media_type: "image",
      assetId: asset.id,
      asset,
      alt: asset.alt_text ?? selected.alt ?? "",
      layout: {
        ...override?.layout,
        objectFit: "contain",
        objectPosition: "center",
        displayMode: "fit",
        zoom: 1,
        positionX: 50,
        positionY: 50,
        manualZoom: 1,
        manualX: 0,
        manualY: 0,
      },
    });
    setMode(null);
  };

  const chooseUploadedAudio = (asset: MediaAsset) => {
    onUpdate({
      ...clearedMedia,
      media_type: "uploaded_audio",
      audio_asset_id: asset.id,
      audio_asset: asset,
      title: "",
      role: "",
      caption: "",
    });
    setMode(null);
  };

  const uploadImage = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Choose an image file.");
      return;
    }
    setLoading(true);
    setError("");
    const objectUrl = URL.createObjectURL(file);
    try {
      const image = new window.Image();
      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(new Error("Image dimensions could not be read."));
        image.src = objectUrl;
      });
      const width = image.naturalWidth;
      const height = image.naturalHeight;
      const supabase = createClient();
      const safeName = file.name.toLowerCase().replace(/[^a-z0-9._-]+/g, "-");
      const path = `${new Date().getFullYear()}/${crypto.randomUUID()}-${safeName}`;
      const uploaded = await supabase.storage.from("cms-media").upload(path, file, { cacheControl: "31536000", upsert: false });
      if (uploaded.error) throw new Error(uploaded.error.message);
      const { data } = supabase.storage.from("cms-media").getPublicUrl(path);
      const registered = await registerMedia({
        storage_path: path,
        public_url: data.publicUrl,
        title: file.name.replace(/\.[^.]+$/, ""),
        filename: file.name,
        alt_text: null,
        mime_type: file.type,
        file_size: file.size,
        width,
        height,
        aspect_ratio: width / height,
        orientation: width === height ? "square" : width > height ? "landscape" : "portrait",
      });
      if (!registered.ok || !registered.asset) throw new Error(registered.message ?? "Image metadata could not be saved.");
      const asset = registered.asset as MediaAsset;
      setLocalImageAssets((current) => [asset, ...current]);
      chooseImage(asset);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Image could not be uploaded.");
    } finally {
      URL.revokeObjectURL(objectUrl);
      setLoading(false);
      if (imageFileInput.current) imageFileInput.current.value = "";
    }
  };

  const uploadAudio = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("audio/")) {
      setError("Choose an audio file.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const supabase = createClient();
      const safeName = file.name.toLowerCase().replace(/[^a-z0-9._-]+/g, "-");
      const path = `${new Date().getFullYear()}/${crypto.randomUUID()}-${safeName}`;
      const uploaded = await supabase.storage.from("cms-media").upload(path, file, { cacheControl: "31536000", upsert: false });
      if (uploaded.error) throw new Error(uploaded.error.message);
      const { data } = supabase.storage.from("cms-media").getPublicUrl(path);
      const registered = await registerMedia({
        storage_path: path,
        public_url: data.publicUrl,
        title: file.name.replace(/\.[^.]+$/, ""),
        filename: file.name,
        alt_text: null,
        mime_type: file.type,
        file_size: file.size,
        width: null,
        height: null,
        aspect_ratio: null,
        orientation: null,
      });
      if (!registered.ok || !registered.asset) throw new Error(registered.message ?? "Audio metadata could not be saved.");
      const asset = registered.asset as MediaAsset;
      setLocalAudioAssets((current) => [asset, ...current]);
      chooseUploadedAudio(asset);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Audio could not be uploaded.");
    } finally {
      setLoading(false);
      if (audioFileInput.current) audioFileInput.current.value = "";
    }
  };

  const addSpotify = async () => {
    setLoading(true);
    setError("");
    const result = await validateSpotifyLink(spotifyUrl);
    setLoading(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    onUpdate({
      ...clearedMedia,
      media_type: "spotify",
      title: "",
      role: "",
      caption: "",
      ...result.data,
    });
    setSpotifyUrl("");
    setMode(null);
  };

  const filteredImages = localImageAssets.filter((asset) =>
    `${asset.title} ${asset.filename}`.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="website-card-media-controls">
      <div className={`website-card-media-status website-card-media-status--${mediaType}`}>
        <span>{imageOnly ? "Current image" : "Current media"}</span>
        <strong>{imageOnly
          ? override?.asset?.title || "Placeholder"
          : mediaType === "spotify" ? "Spotify Player" : mediaType === "uploaded_audio" ? "Uploaded Audio" : audioOnly ? "No audio" : "Image"}</strong>
      </div>

      <button
        type="button"
        className="website-card-media-change"
        onClick={() => setMode(imageOnly ? "image" : "choose")}
      >
        {imageOnly ? "Replace image" : "Change Media"}
      </button>

      {mode === "choose" && <div className="website-card-media-choices">
        {!audioOnly && <button type="button" onClick={() => setMode("image")}><strong>Image</strong><span>Choose from the Media Library.</span></button>}
        {!imageOnly && <button type="button" onClick={() => setMode("uploaded_audio")}><strong>Upload Audio File</strong><span>Upload or select existing audio.</span></button>}
        {!imageOnly && <button type="button" onClick={() => setMode("spotify")}><strong>Spotify Player</strong><span>Add an official Spotify embed.</span></button>}
        <button type="button" className="cms-text-button" onClick={() => setMode(null)}>Cancel</button>
      </div>}

      {mode === "image" && <div className="website-card-media-panel">
        <h3>Media Library</h3>
        <input ref={imageFileInput} type="file" accept="image/*" hidden onChange={(event) => void uploadImage(event.target.files?.[0])} />
        <button type="button" className="btn" disabled={loading} onClick={() => imageFileInput.current?.click()}>
          {loading ? "Uploading…" : "Upload image"}
        </button>
        <label className="field"><span>Find an image</span><input className="input" type="search" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        <div className="website-page-editor__media-grid">
          {filteredImages.slice(0, 80).map((asset) => <button type="button" key={asset.id} onClick={() => chooseImage(asset)}>
            <IntrinsicImage src={asset.variants?.thumbnail?.url ?? asset.public_url} alt="" width={asset.width} height={asset.height} missingLabel="Missing media" />
            <span>{asset.title}</span>
          </button>)}
        </div>
        {error && <p className="notice notice-error" role="alert">{error}</p>}
        <button type="button" className="cms-text-button" onClick={() => setMode(imageOnly ? null : "choose")}>Cancel</button>
      </div>}

      {mode === "uploaded_audio" && <div className="website-card-media-panel">
        <input ref={audioFileInput} type="file" accept="audio/*" hidden onChange={(event) => void uploadAudio(event.target.files?.[0])} />
        <button type="button" className="btn" disabled={loading} onClick={() => audioFileInput.current?.click()}>{loading ? "Uploading…" : "Choose audio file"}</button>
        {localAudioAssets.length > 0 && <label className="field"><span>Existing audio</span><select className="input" defaultValue="" onChange={(event) => {
          const asset = localAudioAssets.find((candidate) => candidate.id === event.target.value);
          if (asset) chooseUploadedAudio(asset);
        }}><option value="" disabled>Select from Media Library…</option>{localAudioAssets.map((asset) => <option value={asset.id} key={asset.id}>{asset.title}</option>)}</select></label>}
        {error && <p className="notice notice-error" role="alert">{error}</p>}
        <button type="button" className="cms-text-button" onClick={() => { setMode("choose"); setError(""); }}>Cancel</button>
      </div>}

      {mode === "spotify" && <div className="website-card-media-panel">
        <h3>Spotify Player</h3>
        <label className="field"><span>Spotify URL</span><input className="input" type="url" value={spotifyUrl} onChange={(event) => setSpotifyUrl(event.target.value)} placeholder="https://open.spotify.com/…" autoFocus /></label>
        <small>Playback length and availability are controlled by Spotify.</small>
        {error && <p className="notice notice-error" role="alert">{error}</p>}
        <div className="website-card-media-panel__actions"><button type="button" className="btn" disabled={loading || !spotifyUrl.trim()} onClick={() => void addSpotify()}>{loading ? "Validating…" : "Add Player"}</button><button type="button" className="btn btn-secondary" disabled={loading} onClick={() => { setMode("choose"); setError(""); }}>Cancel</button></div>
      </div>}

      {audioOnly && audioMedia && (
        <div className="website-card-audio-preview">
          <span>Preview</span>
          <PortfolioAudioPlayer media={audioMedia} audioAsset={selectedAudio} className="portfolio-audio-card--editor" />
        </div>
      )}

      {!audioOnly && (mediaType === "spotify" || mediaType === "uploaded_audio") && <>
        <label className="field"><span>Optional title</span><input className="input" value={override?.title ?? ""} onChange={(event) => onUpdate({ title: event.target.value })} maxLength={160} /></label>
        <label className="field"><span>Optional role</span><input className="input" value={override?.role ?? ""} onChange={(event) => onUpdate({ role: event.target.value })} maxLength={120} /></label>
        <label className="field"><span>Optional caption</span><textarea className="input" value={override?.caption ?? ""} onChange={(event) => onUpdate({ caption: event.target.value })} maxLength={500} /></label>
        <label className="field"><span>Optional custom artwork</span><select className="input" value={override?.artwork_asset_id ?? ""} onChange={(event) => {
          const asset = imageAssets.find((candidate) => candidate.id === event.target.value);
          onUpdate({ artwork_asset_id: asset?.id, artwork_asset: asset });
        }}><option value="">No custom artwork</option>{imageAssets.map((asset) => <option value={asset.id} key={asset.id}>{asset.title}</option>)}</select></label>
        <button type="button" className="website-slot-layout__reset" onClick={onRestore}>Restore original image</button>
      </>}

      {audioOnly && audioMedia && <button type="button" className="website-slot-layout__reset" onClick={onRestore}>Remove media</button>}
      {imageOnly && override?.assetId && <button type="button" className="website-slot-layout__reset" onClick={onRestore}>Restore placeholder</button>}
      {mediaType === "image" && <label className="field"><span>Alt text</span><textarea className="input" value={override?.alt ?? selected.alt ?? ""} onChange={(event) => onUpdate({ alt: event.target.value })} /></label>}
    </div>
  );
}
