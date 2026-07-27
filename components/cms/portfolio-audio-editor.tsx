"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { registerMedia } from "@/app/admin/media/actions";
import { validateSpotifyLink } from "@/app/admin/content/actions";
import { createClient } from "@/lib/supabase/client";
import type { MediaAsset, PortfolioAudioMedia } from "@/types/cms";
import { PortfolioAudioPlayer } from "@/components/public/portfolio-audio-player";

type Choice = null | "choose" | "upload" | "spotify";

const clone = (value: PortfolioAudioMedia | null) => value ? structuredClone(value) : null;

export function PortfolioAudioEditor({
  value,
  onChange,
  audioAssets,
  artworkAssets,
}: {
  value: PortfolioAudioMedia | null;
  onChange: (value: PortfolioAudioMedia | null) => void;
  audioAssets: MediaAsset[];
  artworkAssets: MediaAsset[];
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [choice, setChoice] = useState<Choice>(null);
  const [spotifyUrl, setSpotifyUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [localAudio, setLocalAudio] = useState(audioAssets);
  const [past, setPast] = useState<Array<PortfolioAudioMedia | null>>([]);
  const [future, setFuture] = useState<Array<PortfolioAudioMedia | null>>([]);

  const commit = (next: PortfolioAudioMedia | null) => {
    setPast(history => [...history, clone(value)].slice(-50));
    setFuture([]);
    onChange(next);
  };

  const undo = () => {
    const previous = past.at(-1);
    if (previous === undefined) return;
    setPast(history => history.slice(0, -1));
    setFuture(history => [clone(value), ...history].slice(0, 50));
    onChange(clone(previous));
  };

  const redo = () => {
    const next = future[0];
    if (next === undefined) return;
    setFuture(history => history.slice(1));
    setPast(history => [...history, clone(value)].slice(-50));
    onChange(clone(next));
  };

  const upload = async (file?: File) => {
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
      setLocalAudio(current => [asset, ...current]);
      commit({
        media_type: "uploaded_audio",
        audio_asset_id: asset.id,
        audio_title: asset.title,
        audio_role: "",
        audio_caption: "",
        audio_artwork_asset_id: null,
      });
      setChoice(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Audio could not be uploaded.");
    } finally {
      setLoading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  };

  const selectExistingAudio = (id: string) => {
    const asset = localAudio.find(item => item.id === id);
    if (!asset) return;
    commit({
      media_type: "uploaded_audio",
      audio_asset_id: asset.id,
      audio_title: asset.title,
      audio_role: "",
      audio_caption: "",
      audio_artwork_asset_id: null,
    });
    setChoice(null);
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
    commit({
      media_type: "spotify",
      audio_asset_id: null,
      audio_title: "",
      audio_role: "",
      audio_caption: "",
      audio_artwork_asset_id: null,
      ...result.data,
    });
    setSpotifyUrl("");
    setChoice(null);
  };

  const update = (patch: Partial<PortfolioAudioMedia>) => {
    if (value) commit({ ...value, ...patch } as PortfolioAudioMedia);
  };

  const selectedAudio = value?.media_type === "uploaded_audio" ? localAudio.find(asset => asset.id === value.audio_asset_id) : null;

  return (
    <section className="portfolio-audio-editor">
      <div className="portfolio-audio-editor__heading">
        <div><span>Audio media</span><small>Playback starts only when a visitor presses play.</small></div>
        {(value || past.length > 0 || future.length > 0) && <div className="portfolio-audio-editor__history"><button type="button" onClick={undo} disabled={!past.length} aria-label="Undo audio change">Undo</button><button type="button" onClick={redo} disabled={!future.length} aria-label="Redo audio change">Redo</button></div>}
      </div>

      {!value && !choice && <button type="button" className="portfolio-audio-editor__add" onClick={() => setChoice("choose")}>＋ Add Audio</button>}

      {choice === "choose" && (
        <div className="portfolio-audio-choice">
          <button type="button" onClick={() => setChoice("upload")}><strong>Upload Audio File</strong><span>Use an audio file from your media library.</span></button>
          <button type="button" onClick={() => setChoice("spotify")}><strong>Add Spotify Player</strong><span>Validate a Spotify link and add the official player.</span></button>
          <button type="button" className="cms-text-button" onClick={() => setChoice(null)}>Cancel</button>
        </div>
      )}

      {choice === "upload" && (
        <div className="portfolio-audio-dialog">
          <h3>Upload Audio File</h3>
          <input ref={fileInput} type="file" accept="audio/*" hidden onChange={event => void upload(event.target.files?.[0])} />
          <button type="button" className="btn" disabled={loading} onClick={() => fileInput.current?.click()}>{loading ? "Uploading…" : "Choose audio file"}</button>
          {localAudio.length > 0 && <label className="field"><span>Or use existing audio</span><select className="input" defaultValue="" onChange={event => selectExistingAudio(event.target.value)}><option value="" disabled>Select from media library…</option>{localAudio.map(asset => <option key={asset.id} value={asset.id}>{asset.title}</option>)}</select></label>}
          <Link href="/admin/media" target="_blank">Open media library ↗</Link>
          <button type="button" className="cms-text-button" onClick={() => { setChoice("choose"); setError(""); }}>Cancel</button>
        </div>
      )}

      {choice === "spotify" && (
        <div className="portfolio-audio-dialog">
          <h3>Spotify Player</h3>
          <label className="field"><span>Spotify link</span><input className="input" type="url" value={spotifyUrl} onChange={event => setSpotifyUrl(event.target.value)} placeholder="https://open.spotify.com/…" autoFocus aria-describedby={error ? "spotify-link-error" : "spotify-link-help"} /></label>
          <small id="spotify-link-help">Tracks, albums, playlists, artists, podcasts, and episodes are supported.</small>
          <small>Playback length and availability are controlled by Spotify.</small>
          {error && <p id="spotify-link-error" className="notice notice-error" role="alert">{error}</p>}
          <div><button type="button" className="btn" disabled={loading || !spotifyUrl.trim()} onClick={() => void addSpotify()}>{loading ? "Validating…" : "Add Player"}</button><button type="button" className="btn btn-secondary" disabled={loading} onClick={() => { setChoice("choose"); setError(""); }}>Cancel</button></div>
        </div>
      )}

      {choice !== "spotify" && error && <p className="notice notice-error" role="alert">{error}</p>}

      {value && (
        <div className="portfolio-audio-editor__card">
          <PortfolioAudioPlayer media={value} audioAsset={selectedAudio} className="portfolio-audio-card--editor" />
          <div className="portfolio-audio-editor__fields">
            <label className="field"><span>Custom title</span><input className="input" value={value.audio_title} onChange={event => update({ audio_title: event.target.value })} maxLength={160} /></label>
            <label className="field"><span>Role</span><input className="input" value={value.audio_role} onChange={event => update({ audio_role: event.target.value })} maxLength={120} placeholder="Producer, artist, host…" /></label>
            <label className="field span-2"><span>Caption</span><textarea className="input" value={value.audio_caption} onChange={event => update({ audio_caption: event.target.value })} maxLength={500} /></label>
            <label className="field span-2"><span>Artwork</span><select className="input" value={value.audio_artwork_asset_id ?? ""} onChange={event => update({ audio_artwork_asset_id: event.target.value || null })}><option value="">Use the Portfolio cover</option>{artworkAssets.map(asset => <option value={asset.id} key={asset.id}>{asset.title}</option>)}</select></label>
          </div>
          <div className="portfolio-audio-editor__actions">
            <button type="button" onClick={() => { commit(null); setChoice(null); }}>Remove audio</button>
            <button type="button" onClick={() => setChoice("choose")}>Replace audio</button>
          </div>
        </div>
      )}
    </section>
  );
}
