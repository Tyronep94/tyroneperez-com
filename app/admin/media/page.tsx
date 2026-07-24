import { MediaLibrary } from "@/components/cms/media-library";
import { requireAdmin } from "@/lib/auth/admin";
import type { MediaAsset } from "@/types/cms";

export const metadata = { title: "Media Library" };
export default async function MediaPage() {
  const { supabase } = await requireAdmin();
  const [{ data, error }, { data: usage }, { data: collections }, { data: tagRows }] = await Promise.all([
    supabase.from("media_assets").select("*").order("created_at", { ascending: false }),
    supabase.from("content_asset_usage").select("asset_id"),
    supabase.from("collections").select("id,name").order("sort_order"),
    supabase.from("media_tags").select("asset_id,tags(name)"),
  ]);
  const counts = new Map<string,number>();
  for (const row of usage ?? []) counts.set(row.asset_id, (counts.get(row.asset_id) ?? 0) + 1);
  const tagsByAsset = new Map<string,string[]>();
  for (const row of tagRows ?? []) {
    const relation = row.tags as unknown as {name?:string} | null;
    if (relation?.name) tagsByAsset.set(row.asset_id,[...(tagsByAsset.get(row.asset_id) ?? []),relation.name]);
  }
  const assets = (data ?? []).map(asset => ({ ...asset, usage_count: counts.get(asset.id) ?? 0, tags:tagsByAsset.get(asset.id) ?? [] })) as MediaAsset[];
  return <div className="page-wrap cms-page"><header className="cms-page-header"><div><p className="eyebrow">Asset manager</p><h1 className="page-title">Media library</h1><p className="subtle">One considered home for every image, recording, and document.</p></div><span className="badge">{assets.length} assets</span></header>{error ? <p className="notice notice-error">Media could not be loaded: {error.message}. Apply the Part 16 migration first.</p> : <MediaLibrary assets={assets} collections={collections ?? []} />}</div>;
}
