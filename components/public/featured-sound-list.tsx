"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef } from "react";
import { useWebsitePageDocument } from "@/components/public/page-runtime";
import type { PortfolioItem } from "@/content/public-site";
import type { PortfolioAudioMedia } from "@/types/cms";
import { websiteSlotAudioMedia } from "@/types/website-editor";

type SpotifyEmbedController = {
  addListener: (event: "playback_started", callback: () => void) => void;
  destroy: () => void;
  pause: () => void;
  play: () => void;
};

type SpotifyIframeApi = {
  createController: (
    element: HTMLElement,
    options: { height: number; uri: string; width: number },
    callback: (controller: SpotifyEmbedController) => void,
  ) => void;
};

declare global {
  interface Window {
    onSpotifyIframeApiReady?: (api: SpotifyIframeApi) => void;
  }
}

let spotifyIframeApiPromise: Promise<SpotifyIframeApi> | null = null;

function loadSpotifyIframeApi() {
  if (spotifyIframeApiPromise) return spotifyIframeApiPromise;
  spotifyIframeApiPromise = new Promise<SpotifyIframeApi>((resolve, reject) => {
    const previousReady = window.onSpotifyIframeApiReady;
    window.onSpotifyIframeApiReady = (api) => {
      previousReady?.(api);
      resolve(api);
    };

    const existing = document.querySelector<HTMLScriptElement>('script[src="https://open.spotify.com/embed/iframe-api/v1"]');
    if (existing) {
      existing.addEventListener("error", () => reject(new Error("Spotify player could not be loaded.")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://open.spotify.com/embed/iframe-api/v1";
    script.async = true;
    script.addEventListener("error", () => reject(new Error("Spotify player could not be loaded.")), { once: true });
    document.body.appendChild(script);
  });
  return spotifyIframeApiPromise;
}

function slotId(slug: string) {
  return `music.featured-sound.${slug}`;
}

export function FeaturedSoundList({ items }: { items: PortfolioItem[] }) {
  const document = useWebsitePageDocument();
  const audioElements = useRef(new Map<string, HTMLAudioElement>());
  const spotifyHosts = useRef(new Map<string, HTMLDivElement>());
  const spotifyControllers = useRef(new Map<string, SpotifyEmbedController>());
  const pendingSpotifyPlay = useRef<string | null>(null);

  const entries = useMemo(() => items.map((item) => {
    const id = slotId(item.slug);
    const override = document?.slots[id];
    return {
      id,
      item,
      media: websiteSlotAudioMedia(override),
      audioAsset: override?.audio_asset,
    };
  }), [document, items]);

  const spotifySignature = entries
    .map(({ id, media }) => media?.media_type === "spotify" ? `${id}:${media.spotify_entity_type}:${media.spotify_entity_id}` : "")
    .filter(Boolean)
    .join("|");

  const stopOtherPlayers = (nextId: string) => {
    for (const [id, audio] of audioElements.current) {
      if (id === nextId) continue;
      audio.pause();
      audio.currentTime = 0;
    }
    for (const [id, controller] of spotifyControllers.current) {
      if (id !== nextId) controller.pause();
    }
  };

  useEffect(() => {
    const controllers = spotifyControllers.current;
    const spotifyEntries = entries.filter(
      (entry): entry is typeof entry & { media: Extract<PortfolioAudioMedia, { media_type: "spotify" }> } =>
        entry.media?.media_type === "spotify",
    );
    if (!spotifyEntries.length) return;

    let cancelled = false;
    const createdControllers: SpotifyEmbedController[] = [];
    void loadSpotifyIframeApi().then((api) => {
      if (cancelled) return;
      for (const entry of spotifyEntries) {
        const host = spotifyHosts.current.get(entry.id);
        if (!host) continue;
        api.createController(host, {
          width: 300,
          height: 152,
          uri: `spotify:${entry.media.spotify_entity_type}:${entry.media.spotify_entity_id}`,
        }, (controller) => {
          if (cancelled) {
            controller.destroy();
            return;
          }
          createdControllers.push(controller);
          controllers.set(entry.id, controller);
          controller.addListener("playback_started", () => stopOtherPlayers(entry.id));
          if (pendingSpotifyPlay.current === entry.id) {
            pendingSpotifyPlay.current = null;
            stopOtherPlayers(entry.id);
            controller.play();
          }
        });
      }
    }).catch(() => {
      pendingSpotifyPlay.current = null;
    });

    return () => {
      cancelled = true;
      for (const controller of createdControllers) controller.destroy();
      controllers.clear();
    };
    // Rebuild controllers only when the attached Spotify entities change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spotifySignature]);

  const play = (id: string, media: PortfolioAudioMedia | null) => {
    if (!media) return;
    stopOtherPlayers(id);
    if (media.media_type === "uploaded_audio") {
      const audio = audioElements.current.get(id);
      if (!audio) return;
      audio.currentTime = 0;
      void audio.play();
      return;
    }
    const controller = spotifyControllers.current.get(id);
    if (controller) controller.play();
    else pendingSpotifyPlay.current = id;
  };

  return (
    <div className="music-project-list">
      {entries.map(({ id, item, media, audioAsset }) => {
        const hasPlayableAudio = media?.media_type === "spotify"
          || (media?.media_type === "uploaded_audio" && Boolean(audioAsset?.public_url));
        return (
          <article key={item.slug}>
            <span className="music-project-list__number">{String(item.sortOrder).padStart(2, "0")}</span>
            <div className="music-project-list__copy">
              <p>{item.client}</p>
              <h3>{item.title}</h3>
            </div>
            <button
              type="button"
              data-page-media-slot={id}
              data-page-media-label={`Featured Sound · ${item.title}`}
              data-page-media-type={media?.media_type ?? "uploaded_audio"}
              disabled={!hasPlayableAudio}
              aria-label={hasPlayableAudio ? `Play ${item.title}` : `Audio for ${item.title} will be added later`}
              onClick={() => play(id, media)}
            >
              <span aria-hidden="true">▶</span>
            </button>
            {media?.media_type === "uploaded_audio" && audioAsset?.public_url && (
              <audio
                ref={(element) => {
                  if (element) audioElements.current.set(id, element);
                  else audioElements.current.delete(id);
                }}
                className="featured-sound-player"
                preload="metadata"
                src={audioAsset.public_url}
                onPlay={() => stopOtherPlayers(id)}
              />
            )}
            {media?.media_type === "spotify" && (
              <div
                className="featured-sound-player"
                aria-label={`${item.title} Spotify player`}
              >
                <div ref={(element) => {
                  if (element) spotifyHosts.current.set(id, element);
                  else spotifyHosts.current.delete(id);
                }} />
              </div>
            )}
            <Link href={`/portfolio/${item.slug}`} aria-label={`View project notes for ${item.title}`}>→</Link>
          </article>
        );
      })}
    </div>
  );
}
