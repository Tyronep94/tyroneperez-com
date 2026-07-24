import Link from "next/link";
import { MediaLibrary } from "@/components/cms/media-library";
import { requireAdmin } from "@/lib/auth/admin";
import type { MediaAsset } from "@/types/cms";

export const metadata = { title: "Photography Uploads" };

export default async function PhotographyUploadsPage() {
  const { supabase } = await requireAdmin();
  const [{ data }, { data: collections }] = await Promise.all([
    supabase.from("media_assets").select("*").eq("kind", "image").order("created_at", { ascending: false }),
    supabase.from("collections").select("id,name").order("sort_order"),
  ]);
  return <div className="page-wrap cms-page"><header className="cms-page-header"><div><p className="eyebrow">Photography</p><h1 className="page-title">Uploads</h1><p className="subtle">Upload and prepare photographs before placing them into a gallery. For the fastest workflow, upload directly inside the visual editor.</p></div><Link href="/admin/photography/galleries/new" className="btn">New gallery</Link></header><MediaLibrary assets={(data ?? []) as MediaAsset[]} collections={collections ?? []} /></div>;
}
