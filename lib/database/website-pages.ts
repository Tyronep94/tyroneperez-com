import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { emptyWebsitePageDocument, type WebsitePageDocument, type WebsitePageKey } from "@/types/website-editor";

export async function getPublishedWebsitePage(pageKey: WebsitePageKey): Promise<WebsitePageDocument> {
  if (!isSupabaseConfigured()) return emptyWebsitePageDocument(pageKey);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("website_page_publications")
    .select("document")
    .eq("page_key", pageKey)
    .maybeSingle();
  if (error) {
    if (error.code !== "PGRST205" && error.code !== "42P01") {
      console.error("Published website page query failed:", error.message);
    }
    return emptyWebsitePageDocument(pageKey);
  }
  return (data?.document as WebsitePageDocument | undefined) ?? emptyWebsitePageDocument(pageKey);
}
