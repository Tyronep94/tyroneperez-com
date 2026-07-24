"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/admin";

const metadataSchema = z.object({
  storage_path: z.string().min(1),
  public_url: z.url(),
  title: z.string().trim().min(1),
  filename: z.string().min(1),
  alt_text: z.string().trim().nullable(),
  mime_type: z.string().min(1),
  width: z.number().int().positive().nullable(),
  height: z.number().int().positive().nullable(),
  file_size: z.number().int().nonnegative(),
});

export async function registerMedia(input: z.infer<typeof metadataSchema>) {
  const parsed = metadataSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "The uploaded file metadata is invalid." };
  const { admin, supabase } = await requireAdmin();
  const kind = input.mime_type.startsWith("image/") ? "image" : input.mime_type.startsWith("audio/") ? "audio" : input.mime_type.startsWith("video/") ? "video" : "document";
  const transformBase = input.public_url.replace("/storage/v1/object/public/", "/storage/v1/render/image/public/");
  const { data, error } = await supabase.from("media_assets").insert({
    ...parsed.data,
    kind,
    uploaded_by: admin.id,
    variants: kind === "image" ? {
      thumbnail: { width: 320, url: `${transformBase}?width=320&quality=80` },
      medium: { width: 960, url: `${transformBase}?width=960&quality=84` },
      large: { width: 1920, url: `${transformBase}?width=1920&quality=88` },
      original: { width: input.width ?? 0, url: input.public_url },
    } : {},
  }).select("*").single();
  if (error) return { ok: false, message: error.message };
  await supabase.from("cms_activity").insert({ actor_id: admin.id, action: "uploaded", entity_type: "media", summary: `Uploaded “${input.title}”` });
  revalidatePath("/admin/media");
  return { ok: true, asset: data };
}

export async function deleteMedia(ids: string[]) {
  const { admin, supabase } = await requireAdmin();
  if (!ids.length) return { ok: false, message: "Select at least one asset." };
  const { data: used } = await supabase.from("content_asset_usage").select("asset_id").in("asset_id", ids);
  if (used?.length) return { ok: false, message: `${used.length} selected asset${used.length === 1 ? " is" : "s are"} currently in use. Remove those references before deleting.` };
  const { data: assets } = await supabase.from("media_assets").select("id,storage_path,title").in("id", ids);
  const paths = (assets ?? []).map(asset => asset.storage_path);
  if (paths.length) {
    const { error: storageError } = await supabase.storage.from("cms-media").remove(paths);
    if (storageError) return { ok: false, message: storageError.message };
  }
  const { error } = await supabase.from("media_assets").delete().in("id", ids);
  if (error) return { ok: false, message: error.message };
  await supabase.from("cms_activity").insert({ actor_id: admin.id, action: "deleted", entity_type: "media", summary: `Deleted ${ids.length} media asset${ids.length === 1 ? "" : "s"}` });
  revalidatePath("/admin/media");
  return { ok: true };
}

export async function updateMediaDetails(id: string, values: { title?: string; alt_text?: string; caption?: string; description?: string; copyright?: string; photographer?: string }) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("media_assets").update(values).eq("id", id);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/admin/media");
  return { ok: true };
}

export async function bulkTagMedia(ids: string[], tagName: string) {
  const name = tagName.trim();
  if (!ids.length || !name) return { ok: false, message: "Select assets and enter a tag." };
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  if (!slug) return { ok: false, message: "That tag name is not valid." };
  const { supabase } = await requireAdmin();
  const { data: tag, error: tagError } = await supabase.from("tags").upsert({ name, slug }, { onConflict: "slug" }).select("id").single();
  if (tagError || !tag) return { ok: false, message: tagError?.message ?? "Tag could not be created." };
  const { error } = await supabase.from("media_tags").upsert(ids.map(asset_id => ({ asset_id, tag_id: tag.id })), { onConflict: "asset_id,tag_id" });
  if (error) return { ok: false, message: error.message };
  revalidatePath("/admin/media");
  return { ok: true };
}

export async function bulkMoveMedia(ids: string[], collectionId: string) {
  if (!ids.length || !collectionId) return { ok: false, message: "Select assets and a collection." };
  const { supabase } = await requireAdmin();
  await supabase.from("media_collections").delete().in("asset_id", ids);
  const { error } = await supabase.from("media_collections").insert(ids.map(asset_id => ({ asset_id, collection_id: collectionId })));
  if (error) return { ok: false, message: error.message };
  revalidatePath("/admin/media");
  return { ok: true };
}

export async function replaceMediaMetadata(id: string, values: { filename: string; mime_type: string; file_size: number; width: number | null; height: number | null; public_url: string }) {
  const { supabase } = await requireAdmin();
  const transformBase = values.public_url.replace("/storage/v1/object/public/", "/storage/v1/render/image/public/");
  const variants = values.mime_type.startsWith("image/") ? {
    thumbnail: { width: 320, url: `${transformBase}?width=320&quality=80` },
    medium: { width: 960, url: `${transformBase}?width=960&quality=84` },
    large: { width: 1920, url: `${transformBase}?width=1920&quality=88` },
    original: { width: values.width ?? 0, url: values.public_url },
  } : {};
  const { error } = await supabase.from("media_assets").update({ ...values, variants }).eq("id", id);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/admin/media");
  return { ok: true };
}
