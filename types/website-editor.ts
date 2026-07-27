import type { MediaAsset, PortfolioAudioMedia, SpotifyEntityType } from "@/types/cms";

export const websitePageKeys = ["home", "photography", "music", "portfolio", "about", "contact"] as const;
export type WebsitePageKey = (typeof websitePageKeys)[number];
export type WebsiteSlotType = "text" | "link" | "button" | "media";

export type WebsiteSlotLayout = {
  width?: string;
  maxWidth?: string;
  marginTop?: string;
  marginBottom?: string;
  padding?: string;
  textAlign?: "left" | "center" | "right";
  /** "cover" is a legacy persisted value and is rendered as natural proportions. */
  objectFit?: "contain" | "cover" | "manual";
  objectPosition?: string;
  manualZoom?: number;
  manualX?: number;
  manualY?: number;
};

export type WebsiteSlotOverride = {
  id: string;
  type: WebsiteSlotType;
  text?: string;
  href?: string;
  assetId?: string;
  asset?: MediaAsset;
  alt?: string;
  layout?: WebsiteSlotLayout;
  media_type?: "image" | "uploaded_audio" | "spotify";
  audio_asset_id?: string;
  audio_asset?: MediaAsset;
  spotify_url?: string;
  spotify_entity_type?: SpotifyEntityType;
  spotify_entity_id?: string;
  spotify_embed_url?: string;
  spotify_title?: string | null;
  spotify_thumbnail_url?: string | null;
  title?: string;
  role?: string;
  caption?: string;
  artwork_asset_id?: string;
  artwork_asset?: MediaAsset;
};

export type WebsitePageDocument = {
  version: 1;
  pageKey: WebsitePageKey;
  slots: Record<string, WebsiteSlotOverride>;
};

export const emptyWebsitePageDocument = (pageKey: WebsitePageKey): WebsitePageDocument => ({
  version: 1,
  pageKey,
  slots: {},
});

export const websitePageMeta: Record<WebsitePageKey, { label: string; path: string; description: string }> = {
  home: { label: "Home", path: "/", description: "Hero, featured paths, imagery, and primary calls to action." },
  photography: { label: "Photography", path: "/photography", description: "Photography services, selected work, process, and calls to action." },
  music: { label: "Music", path: "/music", description: "Music services, featured projects, process, and calls to action." },
  portfolio: { label: "Portfolio", path: "/portfolio", description: "Selected work, project imagery, descriptions, filters, and collections." },
  about: { label: "About", path: "/about", description: "Biography, portrait, disciplines, values, and calls to action." },
  contact: { label: "Contact", path: "/contact", description: "Contact copy, project routes, response details, and links." },
};

export function isWebsitePageKey(value: string): value is WebsitePageKey {
  return websitePageKeys.includes(value as WebsitePageKey);
}

export function websiteSlotAudioMedia(slot?: WebsiteSlotOverride): PortfolioAudioMedia | null {
  if (!slot) return null;
  const shared = {
    audio_asset_id: slot.audio_asset_id ?? null,
    audio_title: slot.title ?? "",
    audio_role: slot.role ?? "",
    audio_caption: slot.caption ?? "",
    audio_artwork_asset_id: slot.artwork_asset_id ?? null,
  };
  if (slot.media_type === "uploaded_audio" && slot.audio_asset_id) {
    return { media_type: "uploaded_audio", ...shared };
  }
  if (
    slot.media_type === "spotify"
    && slot.spotify_url
    && slot.spotify_entity_type
    && slot.spotify_entity_id
    && slot.spotify_embed_url
  ) {
    return {
      media_type: "spotify",
      ...shared,
      spotify_url: slot.spotify_url,
      spotify_entity_type: slot.spotify_entity_type,
      spotify_entity_id: slot.spotify_entity_id,
      spotify_embed_url: slot.spotify_embed_url,
      spotify_title: slot.spotify_title ?? null,
      spotify_thumbnail_url: slot.spotify_thumbnail_url ?? null,
    };
  }
  return null;
}
