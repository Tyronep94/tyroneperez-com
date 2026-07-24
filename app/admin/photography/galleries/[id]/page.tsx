import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/admin";
import { PhotographyVisualEditor } from "@/components/cms/photography-visual-editor";
import { normalizeGalleryLayout } from "@/lib/gallery-layout";
import type { ContentEntry, GalleryLayout, GallerySettings, MediaAsset } from "@/types/cms";
import type { GalleryMetaInput } from "../actions";
import "@/app/(public)/public-site.css";

export const metadata = { title: "Photography Visual Editor" };

export default async function PhotographyVisualEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireAdmin();
  const [{ data: entry }, { data: draft }, { data: publication }, { data: assets }, { data: collections }, { data: memberships }] = await Promise.all([
    supabase.from("content_entries").select("*,cover_asset:media_assets!content_cover_asset_fk(*)").eq("id", id).eq("kind", "portfolio").maybeSingle(),
    supabase.from("photography_gallery_drafts").select("layout,settings").eq("content_id", id).maybeSingle(),
    supabase.from("photography_gallery_publications").select("layout").eq("content_id", id).maybeSingle(),
    supabase.from("media_assets").select("*").eq("kind", "image").order("created_at", { ascending: false }).limit(1000),
    supabase.from("collections").select("id,name").order("sort_order"),
    supabase.from("content_collections").select("collection_id").eq("content_id", id),
  ]);
  if (!entry) notFound();
  const fallback: GalleryLayout = { version: 1, preset: "editorial-grid", sections: [{ id: crypto.randomUUID(), type: "images", layout: "image", items: [] }] };
  const draftLayout = (draft?.layout ?? fallback) as GalleryLayout;
  const draftPhotoCount = draftLayout.sections.reduce(
    (count, section) => count + (section.type === "images" ? section.items.length : 0),
    0,
  );
  const publicationLayout = publication?.layout as GalleryLayout | undefined;
  const publicationPhotoCount = publicationLayout?.sections.reduce(
    (count, section) => count + (section.type === "images" ? section.items.length : 0),
    0,
  ) ?? 0;
  const initialLayout = draftPhotoCount === 0 && publicationPhotoCount > 0
    ? publicationLayout!
    : draftLayout;
  return <PhotographyVisualEditor
    entry={entry as ContentEntry}
    initialLayout={normalizeGalleryLayout(initialLayout)}
    initialSettings={(draft?.settings ?? {}) as GallerySettings & { editor?: Partial<GalleryMetaInput> }}
    assets={(assets ?? []) as MediaAsset[]}
    collections={collections ?? []}
    selectedCollections={(memberships ?? []).map((row) => row.collection_id)}
  />;
}
