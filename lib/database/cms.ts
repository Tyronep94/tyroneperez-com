import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import type { ContentEntry, GalleryLayout, GallerySettings } from "@/types/cms";

export async function getPublishedPortfolio(): Promise<ContentEntry[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("content_entries")
    .select("*,cover_asset:media_assets!content_cover_asset_fk(*)")
    .eq("kind", "portfolio")
    .or(`status.eq.published,and(status.eq.scheduled,scheduled_for.lte.${new Date().toISOString()})`)
    .order("pinned", { ascending: false })
    .order("featured", { ascending: false })
    .order("published_at", { ascending: false });
  if (error) {
    // The migration may not have been applied yet. Keep the existing public site available.
    console.error("CMS portfolio query failed:", error.message);
    return [];
  }
  return (data ?? []) as ContentEntry[];
}

export async function getPublishedPortfolioEntry(slug: string): Promise<ContentEntry | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("content_entries")
    .select("*,cover_asset:media_assets!content_cover_asset_fk(*),og_asset:media_assets!content_og_asset_fk(public_url,width,height,alt_text)")
    .eq("kind", "portfolio")
    .eq("slug", slug)
    .or(`status.eq.published,and(status.eq.scheduled,scheduled_for.lte.${new Date().toISOString()})`)
    .maybeSingle();
  if (error) {
    console.error("CMS portfolio entry query failed:", error.message);
    return null;
  }
  return data as ContentEntry | null;
}

export async function getPublishedGallery(contentId: string): Promise<{ layout: GalleryLayout; settings: GallerySettings } | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("photography_gallery_publications")
    .select("layout,settings")
    .eq("content_id", contentId)
    .maybeSingle();
  if (error) {
    // Keep legacy portfolio entries working before the photography migration is applied.
    if (error.code !== "PGRST205" && error.code !== "42P01") console.error("Published gallery query failed:", error.message);
    return null;
  }
  return data ? { layout: data.layout as GalleryLayout, settings: data.settings as GallerySettings } : null;
}

export async function getPublicCollections() {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data, error } = await supabase.from("collections").select("id,name,slug,description").order("sort_order");
  if (error) return [];
  return data ?? [];
}

export async function getCollectionPortfolio(slug: string): Promise<{ collection: {name:string;slug:string;description:string|null}; entries: ContentEntry[] } | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data: collection } = await supabase.from("collections").select("id,name,slug,description").eq("slug",slug).maybeSingle();
  if (!collection) return null;
  const { data } = await supabase.from("content_collections").select("sort_order,content_entries(*)").eq("collection_id",collection.id).order("sort_order");
  const now = Date.now();
  const entries = (data ?? []).map(row => row.content_entries as unknown as ContentEntry).filter(entry => entry && (entry.status === "published" || (entry.status === "scheduled" && entry.scheduled_for && new Date(entry.scheduled_for).getTime() <= now)));
  return { collection, entries };
}
