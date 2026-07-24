"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/admin";
import type { ContentStatus, RichTextNode } from "@/types/cms";
import { fromLosAngelesLocal } from "@/lib/utils/dates";

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
  cover_asset_id: z.union([z.uuid(), z.literal(""), z.null()]),
  og_asset_id: z.union([z.uuid(), z.literal(""), z.null()]),
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
  });
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
  const payload = {
    ...parsed.data,
    canonical_url: parsed.data.canonical_url || null,
    content: parsed.data.content,
    status,
    scheduled_for: status === "scheduled" && parsed.data.scheduled_for ? fromLosAngelesLocal(parsed.data.scheduled_for) : null,
    published_at: status === "published" ? new Date().toISOString() : null,
    updated_by: admin.id,
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
  title: string; excerpt: string; content: RichTextNode; seo_title: string; seo_description: string;
}) {
  const { admin, supabase } = await requireAdmin();
  const result = schema.pick({ title: true, excerpt: true, content: true, seo_title: true, seo_description: true }).safeParse({
    ...payload,
    excerpt: payload.excerpt || null,
    seo_title: payload.seo_title || null,
    seo_description: payload.seo_description || null,
  });
  if (!result.success) return { ok: false, message: "Unsaved changes" };
  const { error } = await supabase.from("content_entries").update({ ...result.data, updated_by: admin.id }).eq("id", id).neq("status", "published");
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
