import type { MediaAsset } from "@/types/cms";

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
