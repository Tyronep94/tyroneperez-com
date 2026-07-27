"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/admin";
import type { MediaAsset } from "@/types/cms";
import { inspectWebsiteDocumentMedia } from "@/lib/media-integrity";
import { websitePageMeta, websitePageKeys, type WebsitePageDocument, type WebsitePageKey } from "@/types/website-editor";
import { isApprovedSpotifyUrl, parseSpotifyEmbedUrl, sanitizeSpotifyThumbnail } from "@/lib/spotify";
import { validateSpotifyUrlWithOEmbed } from "@/lib/spotify-oembed";

const cssValue = z.string().max(80).regex(/^[a-z0-9.%(),\s+\-/]*$/i).optional();
const layoutSchema = z.object({
  width: cssValue,
  maxWidth: cssValue,
  marginTop: cssValue,
  marginBottom: cssValue,
  padding: cssValue,
  textAlign: z.enum(["left", "center", "right"]).optional(),
  objectFit: z.enum(["contain", "cover", "manual"]).optional(),
  objectPosition: z.string().max(40).regex(/^[a-z0-9.%\s-]*$/i).optional(),
  manualZoom: z.number().min(0.5).max(4).optional(),
  manualX: z.number().min(-100).max(100).optional(),
  manualY: z.number().min(-100).max(100).optional(),
}).optional();
const slotSchema = z.object({
  id: z.string().min(1).max(120),
  type: z.enum(["text", "link", "button", "media"]),
  text: z.string().max(10000).optional(),
  href: z.string().max(1000).optional(),
  assetId: z.string().uuid().optional(),
  alt: z.string().max(1000).optional(),
  layout: layoutSchema,
  media_type: z.enum(["image", "uploaded_audio", "spotify"]).optional(),
  audio_asset_id: z.string().uuid().optional(),
  spotify_url: z.url().optional(),
  spotify_entity_type: z.enum(["track", "album", "playlist", "artist", "show", "episode"]).optional(),
  spotify_entity_id: z.string().regex(/^[A-Za-z0-9]{10,64}$/).optional(),
  spotify_embed_url: z.url().optional(),
  spotify_title: z.string().max(240).nullable().optional(),
  spotify_thumbnail_url: z.url().nullable().optional(),
  title: z.string().max(160).optional(),
  role: z.string().max(120).optional(),
  caption: z.string().max(500).optional(),
  artwork_asset_id: z.string().uuid().optional(),
}).superRefine((slot, context) => {
  if (slot.media_type === "uploaded_audio" && !slot.audio_asset_id) {
    context.addIssue({ code: "custom", path: ["audio_asset_id"], message: "Uploaded audio requires an audio asset." });
  }
  if (slot.media_type === "spotify") {
    const embed = slot.spotify_embed_url ? parseSpotifyEmbedUrl(slot.spotify_embed_url) : null;
    if (
      !slot.spotify_url
      || !isApprovedSpotifyUrl(slot.spotify_url)
      || !slot.spotify_entity_type
      || !slot.spotify_entity_id
      || !embed
      || embed.type !== slot.spotify_entity_type
      || embed.id !== slot.spotify_entity_id
    ) {
      context.addIssue({ code: "custom", path: ["spotify_url"], message: "Invalid Spotify player data." });
    }
    if (slot.spotify_thumbnail_url && !sanitizeSpotifyThumbnail(slot.spotify_thumbnail_url)) {
      context.addIssue({ code: "custom", path: ["spotify_thumbnail_url"], message: "Invalid Spotify thumbnail." });
    }
  }
});
const documentSchema = z.object({
  version: z.literal(1),
  pageKey: z.enum(websitePageKeys),
  slots: z.record(z.string(), slotSchema),
});

function safeHref(value?: string) {
  if (!value) return value;
  return /^(\/(?!\/)|#|mailto:|tel:|https:\/\/)/i.test(value) ? value : undefined;
}

async function validateDocument(pageKey: WebsitePageKey, input: WebsitePageDocument, verifySpotify = false) {
  const parsed = documentSchema.safeParse(input);
  if (!parsed.success || parsed.data.pageKey !== pageKey) {
    return { error: "The page draft is invalid." } as const;
  }
  const assetIds = [...new Set(Object.values(parsed.data.slots).flatMap((slot) => [
    slot.assetId,
    slot.audio_asset_id,
    slot.artwork_asset_id,
  ].filter((id): id is string => Boolean(id))))];
  const { supabase } = await requireAdmin();
  const { data, error } = assetIds.length
    ? await supabase.from("media_assets").select("*").in("id", assetIds)
    : { data: [], error: null };
  if (error) return { error: error.message } as const;
  const assets = new Map(((data ?? []) as MediaAsset[]).map((asset) => [asset.id, asset]));
  if (assetIds.some((id) => !assets.has(id))) return { error: "A selected media asset no longer exists." } as const;
  const slots: WebsitePageDocument["slots"] = {};
  for (const [id, slot] of Object.entries(parsed.data.slots)) {
    const imageAsset = slot.assetId ? assets.get(slot.assetId) : undefined;
    const audioAsset = slot.audio_asset_id ? assets.get(slot.audio_asset_id) : undefined;
    const artworkAsset = slot.artwork_asset_id ? assets.get(slot.artwork_asset_id) : undefined;
    if (slot.assetId && imageAsset?.kind !== "image") return { error: "Portfolio image media must use an image asset." } as const;
    if (slot.audio_asset_id && audioAsset?.kind !== "audio") return { error: "Portfolio audio media must use an audio asset." } as const;
    if (slot.artwork_asset_id && artworkAsset?.kind !== "image") return { error: "Portfolio artwork must use an image asset." } as const;

    let spotify = slot.media_type === "spotify" ? {
      spotify_url: slot.spotify_url,
      spotify_entity_type: slot.spotify_entity_type,
      spotify_entity_id: slot.spotify_entity_id,
      spotify_embed_url: slot.spotify_embed_url,
      spotify_title: slot.spotify_title,
      spotify_thumbnail_url: slot.spotify_thumbnail_url,
    } : {};
    if (verifySpotify && slot.media_type === "spotify") {
      const result = await validateSpotifyUrlWithOEmbed(slot.spotify_url ?? "");
      if (!result.ok) return { error: result.message } as const;
      spotify = result.data;
    }

    slots[id] = {
      ...slot,
      href: safeHref(slot.href),
      asset: slot.media_type === "image" || (!slot.media_type && slot.assetId) ? imageAsset : undefined,
      assetId: slot.media_type === "image" || !slot.media_type ? slot.assetId : undefined,
      audio_asset: slot.media_type === "uploaded_audio" ? audioAsset : undefined,
      audio_asset_id: slot.media_type === "uploaded_audio" ? slot.audio_asset_id : undefined,
      artwork_asset: slot.media_type === "spotify" || slot.media_type === "uploaded_audio" ? artworkAsset : undefined,
      artwork_asset_id: slot.media_type === "spotify" || slot.media_type === "uploaded_audio" ? slot.artwork_asset_id : undefined,
      title: slot.title?.trim(),
      role: slot.role?.trim(),
      caption: slot.caption?.trim(),
      ...(slot.media_type === "spotify" ? spotify : {
        spotify_url: undefined,
        spotify_entity_type: undefined,
        spotify_entity_id: undefined,
        spotify_embed_url: undefined,
        spotify_title: undefined,
        spotify_thumbnail_url: undefined,
      }),
    };
  }
  return { document: { ...parsed.data, slots } as WebsitePageDocument } as const;
}

export async function saveWebsitePageDraft(pageKey: WebsitePageKey, input: WebsitePageDocument) {
  const validation = await validateDocument(pageKey, input);
  if ("error" in validation) return { ok: false, message: validation.error };
  const { admin, supabase } = await requireAdmin();
  const { error } = await supabase.from("website_page_drafts").upsert({
    page_key: pageKey,
    document: validation.document,
    updated_by: admin.id,
  });
  revalidatePath(`/admin/pages/${pageKey}`);
  return error ? { ok: false, message: error.message } : { ok: true };
}

export async function publishWebsitePage(pageKey: WebsitePageKey, input: WebsitePageDocument) {
  const validation = await validateDocument(pageKey, input, true);
  if ("error" in validation) return { ok: false, message: validation.error };
  const { admin, supabase } = await requireAdmin();
  const integrityIssues = await inspectWebsiteDocumentMedia(supabase, validation.document);
  if (integrityIssues.length) {
    const issue = integrityIssues[0];
    return {
      ok: false,
      message: `Publish blocked: ${issue.filename} is missing from storage in ${issue.pageKey}:${issue.slotId}. Replace or remove that media before publishing.`,
    };
  }
  const current = await supabase.from("website_page_publications").select("version").eq("page_key", pageKey).maybeSingle();
  const { error } = await supabase.from("website_page_publications").upsert({
    page_key: pageKey,
    document: validation.document,
    version: (current.data?.version ?? 0) + 1,
    published_by: admin.id,
    published_at: new Date().toISOString(),
  });
  if (!error) {
    await supabase.from("website_page_drafts").upsert({
      page_key: pageKey,
      document: validation.document,
      updated_by: admin.id,
    });
    revalidatePath(websitePageMeta[pageKey].path);
    revalidatePath(`/admin/pages/${pageKey}`);
  }
  return error ? { ok: false, message: error.message } : { ok: true };
}
