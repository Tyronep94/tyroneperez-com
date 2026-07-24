"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/admin";
import type { GalleryLayout, MediaAsset } from "@/types/cms";

const galleryMetaSchema = z.object({
  title: z.string().trim().min(1).max(160),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().trim().max(500),
  category: z.string().trim().max(80),
  featured: z.boolean(),
  coverAssetId: z.string().uuid().nullable(),
  collectionIds: z.array(z.string().uuid()).max(50),
  settings: z.object({
    location: z.string().max(160).optional(),
    shootDate: z.string().max(40).optional(),
    camera: z.string().max(120).optional(),
    lens: z.string().max(120).optional(),
    client: z.string().max(160).optional(),
    tags: z.array(z.string().max(50)).max(30).optional(),
    showCaptions: z.boolean().optional(),
  }),
});

const photoSchema = z.object({
  id: z.string().min(1).max(100),
  type: z.literal("photo"),
  assetId: z.string().uuid(),
  width: z.enum(["full", "half", "third"]),
  emphasis: z.enum(["natural", "portrait", "landscape"]),
  alignment: z.enum(["left", "center", "right"]),
  focalPoint: z.object({ x: z.number().min(0).max(100), y: z.number().min(0).max(100) }),
  crop: z.enum(["natural", "cover"]),
  featured: z.boolean(),
  hidden: z.boolean(),
  altText: z.string().max(500),
  caption: z.string().max(1000),
});

const sectionSchema = z.discriminatedUnion("type", [
  z.object({ id: z.string().min(1), type: z.literal("images"), layout: z.enum(["image", "full-width", "pair", "three"]), items: z.array(photoSchema) }),
  z.object({ id: z.string().min(1), type: z.literal("text"), heading: z.string().max(200), body: z.string().max(3000) }),
  z.object({ id: z.string().min(1), type: z.literal("spacer"), size: z.enum(["small", "medium", "large"]) }),
  z.object({ id: z.string().min(1), type: z.literal("divider") }),
  z.object({ id: z.string().min(1), type: z.literal("quote"), quote: z.string().max(2000), attribution: z.string().max(200) }),
]);

const layoutSchema = z.object({
  version: z.literal(1),
  preset: z.enum(["editorial-grid", "masonry", "full-width-story", "alternating", "horizontal-rows", "featured-hero", "custom"]),
  sections: z.array(sectionSchema).max(250),
});

export type GalleryMetaInput = z.infer<typeof galleryMetaSchema>;

async function hydrateLayout(layout: z.infer<typeof layoutSchema>, assets: MediaAsset[]) {
  const byId = new Map(assets.map((asset) => [asset.id, asset]));
  return {
    ...layout,
    sections: layout.sections.map((section) => section.type === "images"
      ? { ...section, items: section.items.flatMap((photo) => {
        const asset = byId.get(photo.assetId);
        return asset ? [{ ...photo, asset }] : [];
      }) }
      : section),
  } as GalleryLayout;
}

async function validateAndHydrate(layoutInput: GalleryLayout) {
  const parsed = layoutSchema.safeParse(layoutInput);
  if (!parsed.success) return { error: "The gallery layout is invalid." } as const;
  const assetIds = [...new Set(parsed.data.sections.flatMap((section) => section.type === "images" ? section.items.map((photo) => photo.assetId) : []))];
  const { supabase } = await requireAdmin();
  const { data, error } = assetIds.length
    ? await supabase.from("media_assets").select("*").in("id", assetIds)
    : { data: [], error: null };
  if (error) return { error: error.message } as const;
  return { layout: await hydrateLayout(parsed.data, (data ?? []) as MediaAsset[]) } as const;
}

export async function createPhotographyGallery(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  const category = String(formData.get("category") ?? "Photography").trim() || "Photography";
  const description = String(formData.get("description") ?? "").trim();
  if (!title || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) redirect("/admin/photography/galleries/new?error=invalid");
  const { admin, supabase } = await requireAdmin();
  const { data, error } = await supabase.from("content_entries").insert({
    kind: "portfolio", title, slug, excerpt: description || null, category, status: "draft",
    featured: false, pinned: false, content: { type: "doc", content: [] }, robots: "index,follow",
    created_by: admin.id, updated_by: admin.id,
  }).select("id").single();
  if (error || !data) redirect(`/admin/photography/galleries/new?error=${encodeURIComponent(error?.message ?? "create")}`);
  await supabase.from("photography_gallery_drafts").insert({
    content_id: data.id,
    layout: { version: 1, preset: "editorial-grid", sections: [{ id: crypto.randomUUID(), type: "images", layout: "image", items: [] }] },
    settings: { title, slug, description, category, featured: false, gallery: {} },
    updated_by: admin.id,
  });
  redirect(`/admin/photography/galleries/${data.id}`);
}

export async function savePhotographyDraft(contentId: string, layoutInput: GalleryLayout, metaInput: GalleryMetaInput) {
  const meta = galleryMetaSchema.safeParse(metaInput);
  if (!meta.success) return { ok: false, message: "Check the gallery title, slug, and settings." };
  const hydrated = await validateAndHydrate(layoutInput);
  if ("error" in hydrated) return { ok: false, message: hydrated.error };
  const { admin, supabase } = await requireAdmin();
  const { error } = await supabase.from("photography_gallery_drafts").upsert({
    content_id: contentId,
    layout: hydrated.layout,
    settings: { ...meta.data.settings, editor: { ...meta.data, settings: undefined } },
    updated_by: admin.id,
  }, { onConflict: "content_id" });
  return error ? { ok: false, message: error.message } : { ok: true, savedAt: new Date().toISOString() };
}

export async function publishPhotographyGallery(contentId: string, layoutInput: GalleryLayout, metaInput: GalleryMetaInput) {
  const meta = galleryMetaSchema.safeParse(metaInput);
  if (!meta.success) return { ok: false, message: "Check the gallery settings before publishing." };
  const hydrated = await validateAndHydrate(layoutInput);
  if ("error" in hydrated) return { ok: false, message: hydrated.error };
  const { admin, supabase } = await requireAdmin();
  const publicationLayout: GalleryLayout = {
    ...hydrated.layout,
    sections: hydrated.layout.sections.map((section) => section.type === "images"
      ? { ...section, items: section.items.filter((photo) => !photo.hidden) }
      : section),
  };
  const assetIds = [...new Set(publicationLayout.sections.flatMap((section) => section.type === "images" ? section.items.map((photo) => photo.assetId) : []))];
  const publishedCoverAssetId = meta.data.coverAssetId && assetIds.includes(meta.data.coverAssetId) ? meta.data.coverAssetId : assetIds[0] ?? null;
  const versionResult = await supabase.from("photography_gallery_publications").select("version").eq("content_id", contentId).maybeSingle();
  const now = new Date().toISOString();
  const { error: publicationError } = await supabase.from("photography_gallery_publications").upsert({
    content_id: contentId,
    layout: publicationLayout,
    settings: meta.data.settings,
    version: (versionResult.data?.version ?? 0) + 1,
    published_at: now,
  }, { onConflict: "content_id" });
  if (publicationError) return { ok: false, message: publicationError.message };
  const { error: entryError } = await supabase.from("content_entries").update({
    title: meta.data.title,
    slug: meta.data.slug,
    excerpt: meta.data.description || null,
    category: meta.data.category || "Photography",
    featured: meta.data.featured,
    cover_asset_id: publishedCoverAssetId,
    status: "published",
    published_at: now,
    updated_by: admin.id,
  }).eq("id", contentId);
  if (entryError) return { ok: false, message: entryError.message };
  await supabase.from("content_asset_usage").delete().eq("content_id", contentId).like("usage_role", "gallery:%");
  if (assetIds.length) await supabase.from("content_asset_usage").insert(assetIds.map((assetId, index) => ({
    content_id: contentId, asset_id: assetId, usage_role: `gallery:${String(index).padStart(5, "0")}`,
  })));
  await supabase.from("content_collections").delete().eq("content_id", contentId);
  if (meta.data.collectionIds.length) await supabase.from("content_collections").insert(meta.data.collectionIds.map((collectionId, index) => ({
    content_id: contentId, collection_id: collectionId, sort_order: index,
  })));
  await supabase.from("cms_activity").insert({ actor_id: admin.id, action: "published", entity_type: "photography_gallery", entity_id: contentId, summary: `Published “${meta.data.title}”` });
  revalidatePath("/portfolio", "layout");
  revalidatePath(`/portfolio/${meta.data.slug}`);
  revalidatePath("/sitemap.xml");
  return { ok: true, publishedAt: now };
}

export async function unpublishPhotographyGallery(contentId: string) {
  const { admin, supabase } = await requireAdmin();
  const { error } = await supabase.from("content_entries").update({ status: "draft", published_at: null, updated_by: admin.id }).eq("id", contentId);
  if (error) return { ok: false, message: error.message };
  await supabase.from("content_asset_usage").delete().eq("content_id", contentId).like("usage_role", "gallery:%");
  revalidatePath("/portfolio", "layout");
  return { ok: true };
}

export async function discardPhotographyDraft(contentId: string) {
  const { admin, supabase } = await requireAdmin();
  const [{ data: publication }, { data: entry }] = await Promise.all([
    supabase.from("photography_gallery_publications").select("layout,settings").eq("content_id", contentId).maybeSingle(),
    supabase.from("content_entries").select("title,slug,excerpt,category,featured,cover_asset_id").eq("id", contentId).single(),
  ]);
  if (!publication || !entry) return { ok: false, message: "There is no published version to restore." };
  const { error } = await supabase.from("photography_gallery_drafts").upsert({
    content_id: contentId,
    layout: publication.layout,
    settings: { ...publication.settings, editor: { title: entry.title, slug: entry.slug, description: entry.excerpt ?? "", category: entry.category ?? "Photography", featured: entry.featured, coverAssetId: entry.cover_asset_id, collectionIds: [] } },
    updated_by: admin.id,
  });
  revalidatePath(`/admin/photography/galleries/${contentId}`);
  return error ? { ok: false, message: error.message } : { ok: true };
}

export async function updateGalleryPhotoMetadata(assetId: string, altText: string, caption: string) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("media_assets").update({ alt_text: altText.trim() || null, caption: caption.trim() || null }).eq("id", assetId);
  return error ? { ok: false, message: error.message } : { ok: true };
}
