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

export const emptyDocument: RichTextNode = { type: "doc", content: [{ type: "paragraph" }] };
