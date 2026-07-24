export type ContentStatus = "draft" | "scheduled" | "published" | "archived";
export type ContentKind = "page" | "portfolio" | "album" | "song";
export type MediaKind = "image" | "audio" | "video" | "document";

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
  created_at: string;
  updated_at: string;
  og_asset?: Pick<MediaAsset, "public_url" | "width" | "height" | "alt_text"> | null;
  cover_asset?: MediaAsset | null;
};

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
  file_size: number;
  variants: Record<string, { width: number; url?: string }>;
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
  fitMode?: "contain" | "cover";
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
