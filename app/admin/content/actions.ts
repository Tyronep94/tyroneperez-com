"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/admin";
import type { ContentStatus, PortfolioAudioMedia, RichTextNode } from "@/types/cms";
import { fromLosAngelesLocal } from "@/lib/utils/dates";
import { validateSpotifyUrlWithOEmbed } from "@/lib/spotify-oembed";
import { isApprovedSpotifyUrl, parseSpotifyEmbedUrl, sanitizeSpotifyThumbnail } from "@/lib/spotify";

const optionalText = (max: number) => z.string().trim().max(max).nullable();
const optionalUuid = z.union([z.uuid(), z.literal(""), z.null()]);
const optionalUrl = z.union([z.url(), z.literal(""), z.null()]);
const audioSharedSchema = z.object({
  audio_asset_id: z.uuid().nullable(),
  audio_title: z.string().trim().max(160),
  audio_role: z.string().trim().max(120),
  audio_caption: z.string().trim().max(500),
  audio_artwork_asset_id: z.uuid().nullable(),
});
const audioMediaPayloadSchema = z.discriminatedUnion("media_type", [
  audioSharedSchema.extend({ media_type: z.literal("uploaded_audio"), audio_asset_id: z.uuid() }),
  audioSharedSchema.extend({
    media_type: z.literal("spotify"),
    audio_asset_id: z.null(),
    spotify_url: z.url(),
    spotify_entity_type: z.enum(["track", "album", "playlist", "artist", "show", "episode"]),
    spotify_entity_id: z.string().regex(/^[A-Za-z0-9]{10,64}$/),
    spotify_embed_url: z.url(),
    spotify_title: z.string().trim().max(240).nullable(),
    spotify_thumbnail_url: z.url().nullable(),
  }),
]).nullable().superRefine((media, context) => {
  if (!media || media.media_type !== "spotify") return;
  const embed = parseSpotifyEmbedUrl(media.spotify_embed_url);
  if (
    !isApprovedSpotifyUrl(media.spotify_url)
    || !embed
    || embed.type !== media.spotify_entity_type
    || embed.id !== media.spotify_entity_id
  ) {
    context.addIssue({ code: "custom", message: "Invalid Spotify player data." });
  }
  if (media.spotify_thumbnail_url && !sanitizeSpotifyThumbnail(media.spotify_thumbnail_url)) {
    context.addIssue({ code: "custom", message: "Invalid Spotify thumbnail." });
  }
});

const schema = z.object({
  title: z.string().trim().min(1, "Title is required.").max(160),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase words separated by hyphens."),
  kind: z.enum(["page", "portfolio", "album", "song"]),
  excerpt: z.string().trim().max(500).nullable(),
  category: z.string().trim().max(80).nullable(),
  content: z.record(z.string(), z.unknown()),
  featured: z.boolean(),
  pinned: z.boolean(),
  seo_title: z.string().trim().max(70).nullable(),
  seo_description: z.string().trim().max(180).nullable(),
  canonical_url: z.union([z.url(), z.literal(""), z.null()]),
  robots: z.enum(["index,follow", "noindex,follow", "noindex,nofollow"]),
  scheduled_for: z.string().nullable(),
  cover_asset_id: optionalUuid,
  og_asset_id: optionalUuid,
  media_type: z.union([z.enum(["uploaded_audio", "spotify"]), z.literal(""), z.null()]),
  audio_asset_id: optionalUuid,
  audio_title: optionalText(160),
  audio_role: optionalText(120),
  audio_caption: optionalText(500),
  audio_artwork_asset_id: optionalUuid,
  spotify_url: optionalUrl,
  spotify_entity_type: z.union([z.enum(["track", "album", "playlist", "artist", "show", "episode"]), z.literal(""), z.null()]),
  spotify_entity_id: optionalText(64),
  spotify_embed_url: optionalUrl,
  spotify_title: optionalText(240),
  spotify_thumbnail_url: optionalUrl,
}).superRefine((data, context) => {
  if (data.media_type === "uploaded_audio" && !data.audio_asset_id) {
    context.addIssue({ code: "custom", path: ["audio_asset_id"], message: "Choose an uploaded audio file." });
  }
  if (data.media_type === "spotify" && !data.spotify_url) {
    context.addIssue({ code: "custom", path: ["spotify_url"], message: "Add a Spotify link." });
  }
});

export type CmsActionState = { error?: string; success?: string; fieldErrors?: Record<string, string[]> };

const nullable = (value: FormDataEntryValue | null) => {
  const text = String(value ?? "").trim();
  return text || null;
};

function parseForm(formData: FormData) {
  let content: unknown = {};
  try { content = JSON.parse(String(formData.get("content") ?? "{}")); } catch { /* validation handles it */ }
  return schema.safeParse({
    title: formData.get("title"),
    slug: formData.get("slug"),
    kind: formData.get("kind"),
    excerpt: nullable(formData.get("excerpt")),
    category: nullable(formData.get("category")),
    content,
    featured: formData.get("featured") === "on",
    pinned: formData.get("pinned") === "on",
    seo_title: nullable(formData.get("seo_title")),
    seo_description: nullable(formData.get("seo_description")),
    canonical_url: nullable(formData.get("canonical_url")),
    robots: formData.get("robots"),
    scheduled_for: nullable(formData.get("scheduled_for")),
    cover_asset_id: nullable(formData.get("cover_asset_id")),
    og_asset_id: nullable(formData.get("og_asset_id")),
    media_type: nullable(formData.get("media_type")),
    audio_asset_id: nullable(formData.get("audio_asset_id")),
    audio_title: nullable(formData.get("audio_title")),
    audio_role: nullable(formData.get("audio_role")),
    audio_caption: nullable(formData.get("audio_caption")),
    audio_artwork_asset_id: nullable(formData.get("audio_artwork_asset_id")),
    spotify_url: nullable(formData.get("spotify_url")),
    spotify_entity_type: nullable(formData.get("spotify_entity_type")),
    spotify_entity_id: nullable(formData.get("spotify_entity_id")),
    spotify_embed_url: nullable(formData.get("spotify_embed_url")),
    spotify_title: nullable(formData.get("spotify_title")),
    spotify_thumbnail_url: nullable(formData.get("spotify_thumbnail_url")),
  });
}

function audioColumns(media: PortfolioAudioMedia | null) {
  const base = {
    media_type: media?.media_type ?? null,
    audio_asset_id: media?.audio_asset_id || null,
    audio_title: media?.audio_title.trim().slice(0, 160) || null,
    audio_role: media?.audio_role.trim().slice(0, 120) || null,
    audio_caption: media?.audio_caption.trim().slice(0, 500) || null,
    audio_artwork_asset_id: media?.audio_artwork_asset_id || null,
    spotify_url: null as string | null,
    spotify_entity_type: null as string | null,
    spotify_entity_id: null as string | null,
    spotify_embed_url: null as string | null,
    spotify_title: null as string | null,
    spotify_thumbnail_url: null as string | null,
  };
  if (media?.media_type !== "spotify") return base;
  return {
    ...base,
    spotify_url: media.spotify_url,
    spotify_entity_type: media.spotify_entity_type,
    spotify_entity_id: media.spotify_entity_id,
    spotify_embed_url: media.spotify_embed_url,
    spotify_title: media.spotify_title,
    spotify_thumbnail_url: media.spotify_thumbnail_url,
  };
}

function mediaFromParsed(data: z.infer<typeof schema>): PortfolioAudioMedia | null {
  const shared = {
    audio_asset_id: data.audio_asset_id || null,
    audio_title: data.audio_title ?? "",
    audio_role: data.audio_role ?? "",
    audio_caption: data.audio_caption ?? "",
    audio_artwork_asset_id: data.audio_artwork_asset_id || null,
  };
  if (data.media_type === "uploaded_audio" && data.audio_asset_id) return { media_type: "uploaded_audio", ...shared };
  if (data.media_type === "spotify" && data.spotify_url && data.spotify_entity_type && data.spotify_entity_id && data.spotify_embed_url) {
    return {
      media_type: "spotify",
      ...shared,
      spotify_url: data.spotify_url,
      spotify_entity_type: data.spotify_entity_type,
      spotify_entity_id: data.spotify_entity_id,
      spotify_embed_url: data.spotify_embed_url,
      spotify_title: data.spotify_title,
      spotify_thumbnail_url: data.spotify_thumbnail_url,
    };
  }
  return null;
}

export async function validateSpotifyLink(url: string) {
  await requireAdmin();
  return validateSpotifyUrlWithOEmbed(url);
}

function statusFromIntent(intent: string, scheduledFor: string | null): ContentStatus {
  if (intent === "publish") return "published";
  if (intent === "schedule" && scheduledFor) return "scheduled";
  if (intent === "unpublish") return "draft";
  return "draft";
}

export async function saveContent(id: string | null, _state: CmsActionState, formData: FormData): Promise<CmsActionState> {
  const parsed = parseForm(formData);
  if (!parsed.success) return { error: "Please correct the highlighted content.", fieldErrors: parsed.error.flatten().fieldErrors };
  const { admin, supabase } = await requireAdmin();
  const intent = String(formData.get("intent") ?? "draft");
  const collectionIds = formData.getAll("collection_ids").map(String).filter(Boolean);
  const status = statusFromIntent(intent, parsed.data.scheduled_for);
  let audio = mediaFromParsed(parsed.data);
  if (parsed.data.media_type === "spotify") {
    const spotify = await validateSpotifyUrlWithOEmbed(parsed.data.spotify_url ?? "");
    if (!spotify.ok) return { error: spotify.message, fieldErrors: { spotify_url: [spotify.message] } };
    audio = {
      media_type: "spotify",
      audio_asset_id: null,
      audio_title: parsed.data.audio_title ?? "",
      audio_role: parsed.data.audio_role ?? "",
      audio_caption: parsed.data.audio_caption ?? "",
      audio_artwork_asset_id: parsed.data.audio_artwork_asset_id || null,
      ...spotify.data,
    };
  }
  const payload = {
    ...parsed.data,
    canonical_url: parsed.data.canonical_url || null,
    content: parsed.data.content,
    status,
    scheduled_for: status === "scheduled" && parsed.data.scheduled_for ? fromLosAngelesLocal(parsed.data.scheduled_for) : null,
    published_at: status === "published" ? new Date().toISOString() : null,
    updated_by: admin.id,
    ...audioColumns(audio),
  };

  if (id) {
    const { error } = await supabase.from("content_entries").update(payload).eq("id", id);
    if (error) return { error: `Content could not be saved: ${error.message}` };
    await supabase.from("content_collections").delete().eq("content_id", id);
    if (collectionIds.length) await supabase.from("content_collections").insert(collectionIds.map((collection_id, index) => ({ content_id: id, collection_id, sort_order: index })));
    await supabase.from("cms_activity").insert({ actor_id: admin.id, action: status, entity_type: "content", entity_id: id, summary: `${status === "published" ? "Published" : "Updated"} “${parsed.data.title}”` });
    revalidatePath("/admin/content");
    revalidatePath("/portfolio", "layout");
    return { success: status === "published" ? "Published successfully." : status === "scheduled" ? "Publishing scheduled." : "Draft saved." };
  }

  const { data, error } = await supabase.from("content_entries").insert({ ...payload, created_by: admin.id }).select("id").single();
  if (error) return { error: `Content could not be created: ${error.message}` };
  if (collectionIds.length) await supabase.from("content_collections").insert(collectionIds.map((collection_id, index) => ({ content_id: data.id, collection_id, sort_order: index })));
  await supabase.from("cms_activity").insert({ actor_id: admin.id, action: "created", entity_type: "content", entity_id: data.id, summary: `Created “${parsed.data.title}”` });
  redirect(`/admin/content/${data.id}?created=1`);
}

export async function autosaveContent(id: string, payload: {
  title: string; excerpt: string; content: RichTextNode; seo_title: string; seo_description: string; audio_media: PortfolioAudioMedia | null;
}) {
  const { admin, supabase } = await requireAdmin();
  const result = schema.pick({ title: true, excerpt: true, content: true, seo_title: true, seo_description: true }).safeParse({
    ...payload,
    excerpt: payload.excerpt || null,
    seo_title: payload.seo_title || null,
    seo_description: payload.seo_description || null,
  });
  const parsedAudio = audioMediaPayloadSchema.safeParse(payload.audio_media);
  if (!result.success || !parsedAudio.success) return { ok: false, message: "Unsaved changes" };
  const { error } = await supabase.from("content_entries").update({ ...result.data, ...audioColumns(parsedAudio.data), updated_by: admin.id }).eq("id", id).neq("status", "published");
  return error ? { ok: false, message: error.message } : { ok: true };
}

export async function deleteContent(id: string) {
  const { admin, supabase } = await requireAdmin();
  const { data: entry } = await supabase.from("content_entries").select("title").eq("id", id).maybeSingle();
  const { error } = await supabase.from("content_entries").delete().eq("id", id);
  if (error) redirect(`/admin/content/${id}?error=delete`);
  await supabase.from("cms_activity").insert({ actor_id: admin.id, action: "deleted", entity_type: "content", entity_id: id, summary: `Deleted “${entry?.title ?? "content entry"}”` });
  revalidatePath("/admin/content");
  revalidatePath("/portfolio", "layout");
  redirect("/admin/content?deleted=1");
}
