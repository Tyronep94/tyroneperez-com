export type ContentStatus = "draft" | "scheduled" | "published" | "archived";
export type ContentKind = "page" | "portfolio" | "album" | "song";
export type MediaKind = "image" | "audio" | "video" | "document";
export type SpotifyEntityType = "track" | "album" | "playlist" | "artist" | "show" | "episode";

type PortfolioAudioBase = {
  audio_asset_id: string | null;
  audio_title: string;
  audio_role: string;
  audio_caption: string;
  audio_artwork_asset_id: string | null;
};

export type PortfolioAudioMedia =
  | (PortfolioAudioBase & { media_type: "uploaded_audio" })
  | (PortfolioAudioBase & {
      media_type: "spotify";
      spotify_url: string;
      spotify_entity_type: SpotifyEntityType;
      spotify_entity_id: string;
      spotify_embed_url: string;
      spotify_title: string | null;
      spotify_thumbnail_url: string | null;
    });

export type RichTextNode = {
  type: string;
  attrs?: Record<string, unknown>;
  content?: RichTextNode[];
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>;
  text?: string;
};

export type ContentEntry = {
  id: string;
  kind: ContentKind;
  title: string;
  slug: string;
  excerpt: string | null;
  content: RichTextNode;
  status: ContentStatus;
  category: string | null;
  featured: boolean;
  pinned: boolean;
  view_count: number;
  cover_asset_id: string | null;
  seo_title: string | null;
  seo_description: string | null;
  og_asset_id: string | null;
  canonical_url: string | null;
  robots: string;
  scheduled_for: string | null;
  published_at: string | null;
  media_type: "uploaded_audio" | "spotify" | null;
  audio_asset_id: string | null;
  audio_title: string | null;
  audio_role: string | null;
  audio_caption: string | null;
  audio_artwork_asset_id: string | null;
  spotify_url: string | null;
  spotify_entity_type: SpotifyEntityType | null;
  spotify_entity_id: string | null;
  spotify_embed_url: string | null;
  spotify_title: string | null;
  spotify_thumbnail_url: string | null;
  created_at: string;
  updated_at: string;
  og_asset?: Pick<MediaAsset, "public_url" | "width" | "height" | "alt_text"> | null;
  cover_asset?: MediaAsset | null;
  audio_asset?: MediaAsset | null;
  audio_artwork_asset?: MediaAsset | null;
};

export function portfolioAudioMedia(entry: ContentEntry): PortfolioAudioMedia | null {
  const shared = {
    audio_asset_id: entry.audio_asset_id,
    audio_title: entry.audio_title ?? "",
    audio_role: entry.audio_role ?? "",
    audio_caption: entry.audio_caption ?? "",
    audio_artwork_asset_id: entry.audio_artwork_asset_id,
  };
  if (entry.media_type === "uploaded_audio" && entry.audio_asset_id) {
    return { media_type: "uploaded_audio", ...shared };
  }
  if (
    entry.media_type === "spotify"
    && entry.spotify_url
    && entry.spotify_entity_type
    && entry.spotify_entity_id
    && entry.spotify_embed_url
  ) {
    return {
      media_type: "spotify",
      ...shared,
      spotify_url: entry.spotify_url,
      spotify_entity_type: entry.spotify_entity_type,
      spotify_entity_id: entry.spotify_entity_id,
      spotify_embed_url: entry.spotify_embed_url,
      spotify_title: entry.spotify_title,
      spotify_thumbnail_url: entry.spotify_thumbnail_url,
    };
  }
  return null;
}

export type MediaAsset = {
  id: string;
  storage_path: string;
  public_url: string;
  title: string;
  filename: string;
  alt_text: string | null;
  caption: string | null;
  description: string | null;
  copyright: string | null;
  photographer: string | null;
  kind: MediaKind;
  mime_type: string;
  width: number | null;
  height: number | null;
  aspect_ratio?: number | null;
  orientation?: "landscape" | "portrait" | "square" | null;
  object_status?: "available" | "missing" | "unknown";
  object_checked_at?: string | null;
  file_size: number;
  variants: Record<string, {
    width?: number;
    url?: string;
    aspect_ratio?: number | null;
    orientation?: "landscape" | "portrait" | "square" | null;
  }>;
  created_at: string;
  updated_at: string;
  usage_count?: number;
  tags?: string[];
};

export type GalleryLayoutPreset =
  | "editorial-grid"
  | "masonry"
  | "full-width-story"
  | "alternating"
  | "horizontal-rows"
  | "featured-hero"
  | "custom";

export type GalleryPhotoWidth = "full" | "half" | "third";
export type GalleryPhotoSize = "small" | "medium" | "large" | "full";
export type GalleryPhotoEmphasis = "natural" | "portrait" | "landscape";
export type GalleryPhotoAlignment = "left" | "center" | "right";
export type GallerySlotDimensions = {
  desktopWidth: string;
  tabletWidth: string;
  mobileWidth: string;
  aspectRatio: number;
};

export type GalleryPhoto = {
  id: string;
  type: "photo";
  assetId: string;
  asset: MediaAsset;
  /** Legacy layout value retained while saved drafts are normalized. */
  width?: GalleryPhotoWidth;
  size?: GalleryPhotoSize;
  emphasis: GalleryPhotoEmphasis;
  alignment: GalleryPhotoAlignment;
  focalPoint: { x: number; y: number };
  crop: "natural" | "cover";
  /** A cover crop is honored only when it was explicitly selected in the editor. */
  cropIntent?: "explicit";
  featured: boolean;
  hidden: boolean;
  altText: string;
  caption: string;
  tags?: string[];
  copyright?: string;
  slotId?: string;
  slotLabel?: string;
  templateLocked?: boolean;
  referenceAssetId?: string;
  referenceAsset?: MediaAsset;
  replacementAssetId?: string | null;
  replacementAsset?: MediaAsset | null;
  /** "cover" is a legacy persisted value and is normalized to natural proportions. */
  fitMode?: "contain" | "cover" | "manual";
  manualCrop?: {
    zoom: number;
    x: number;
    y: number;
  };
  slotDimensions?: GallerySlotDimensions;
};

export type GallerySection =
  | { id: string; type: "images"; layout: "image" | "full-width" | "pair" | "three"; items: GalleryPhoto[] }
  | { id: string; type: "text"; heading: string; body: string }
  | { id: string; type: "spacer"; size: "small" | "medium" | "large" }
  | { id: string; type: "divider" }
  | { id: string; type: "quote"; quote: string; attribution: string };

export type GalleryLayout = {
  version: 1;
  mode?: "template" | "freeform";
  preset: GalleryLayoutPreset;
  sections: GallerySection[];
};

export type GallerySettings = {
  location?: string;
  shootDate?: string;
  camera?: string;
  lens?: string;
  client?: string;
  tags?: string[];
  showCaptions?: boolean;
};

export const emptyDocument: RichTextNode = { type: "doc", content: [{ type: "paragraph" }] };
