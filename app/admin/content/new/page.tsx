import { ContentEditor } from "@/components/cms/content-editor";
import { requireAdmin } from "@/lib/auth/admin";
import { saveContent } from "../actions";

export const metadata = { title: "New Content" };
export default async function NewContentPage() {
  const { supabase } = await requireAdmin();
  const [{ data: collections }, { data: media }] = await Promise.all([
    supabase.from("collections").select("id,name").order("sort_order"),
    supabase.from("media_assets").select("id,title").eq("kind","image").order("created_at",{ascending:false}),
  ]);
  const action = saveContent.bind(null, null);
  return <ContentEditor action={action} collections={collections ?? []} media={media ?? []} />;
}
