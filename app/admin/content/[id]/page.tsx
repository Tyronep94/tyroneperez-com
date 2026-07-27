import { notFound } from "next/navigation";
import { ContentEditor } from "@/components/cms/content-editor";
import { requireAdmin } from "@/lib/auth/admin";
import type { ContentEntry, MediaAsset } from "@/types/cms";
import { deleteContent, saveContent } from "../actions";

export const metadata = { title: "Edit Content" };
export default async function EditContentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireAdmin();
  const [{ data }, { data: collections }, { data: memberships }, { data: media }, { data: audioMedia }] = await Promise.all([
    supabase.from("content_entries").select("*").eq("id", id).maybeSingle(),
    supabase.from("collections").select("id,name").order("sort_order"),
    supabase.from("content_collections").select("collection_id").eq("content_id", id),
    supabase.from("media_assets").select("*").eq("kind","image").order("created_at",{ascending:false}),
    supabase.from("media_assets").select("*").eq("kind","audio").order("created_at",{ascending:false}),
  ]);
  if (!data) notFound();
  return <ContentEditor entry={data as ContentEntry} action={saveContent.bind(null, id)} deleteAction={deleteContent.bind(null,id)} collections={collections ?? []} selectedCollections={(memberships ?? []).map(row => row.collection_id)} media={(media ?? []) as MediaAsset[]} audioMedia={(audioMedia ?? []) as MediaAsset[]} />;
}
