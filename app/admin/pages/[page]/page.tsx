import { notFound } from "next/navigation";
import { AboutPageView } from "@/app/(public)/about/page";
import { ContactPageView } from "@/app/(public)/contact/page";
import { HomePageView } from "@/app/(public)/page";
import { MusicPageView } from "@/app/(public)/music/page";
import { PhotographyPageView } from "@/app/(public)/photography/page";
import { PortfolioPageView } from "@/app/(public)/portfolio/page";
import { WebsitePageEditor } from "@/components/cms/website-page-editor";
import { requireAdmin } from "@/lib/auth/admin";
import { inspectWebsiteDocumentMedia } from "@/lib/media-integrity";
import type { MediaAsset } from "@/types/cms";
import {
  emptyWebsitePageDocument,
  isWebsitePageKey,
  type WebsitePageDocument,
  type WebsitePageKey,
} from "@/types/website-editor";
import "@/app/(public)/public-site.css";

export const metadata = { title: "Website Page Editor" };

function PageView({ pageKey }: { pageKey: WebsitePageKey }) {
  if (pageKey === "home") return <HomePageView />;
  if (pageKey === "photography") return <PhotographyPageView />;
  if (pageKey === "music") return <MusicPageView />;
  if (pageKey === "portfolio") return <PortfolioPageView />;
  if (pageKey === "about") return <AboutPageView />;
  return <ContactPageView />;
}

export default async function WebsitePageEditorPage({ params }: { params: Promise<{ page: string }> }) {
  const { page } = await params;
  if (!isWebsitePageKey(page)) notFound();
  const { supabase } = await requireAdmin();
  const [{ data: draft }, { data: publication }, { data: assets }] = await Promise.all([
    supabase.from("website_page_drafts").select("document").eq("page_key", page).maybeSingle(),
    supabase.from("website_page_publications").select("document").eq("page_key", page).maybeSingle(),
    supabase.from("media_assets").select("*").in("kind", ["image", "audio"]).order("created_at", { ascending: false }).limit(1000),
  ]);
  const initialDocument = (draft?.document ?? publication?.document ?? emptyWebsitePageDocument(page)) as WebsitePageDocument;
  const [draftIssues, publicationIssues] = await Promise.all([
    inspectWebsiteDocumentMedia(supabase, initialDocument),
    publication?.document
      ? inspectWebsiteDocumentMedia(supabase, publication.document as WebsitePageDocument)
      : Promise.resolve([]),
  ]);
  const integrityIssues = [...draftIssues, ...publicationIssues].filter((issue, index, issues) =>
    issues.findIndex((candidate) => candidate.slotId === issue.slotId && candidate.assetId === issue.assetId && candidate.reason === issue.reason) === index,
  );
  return (
    <WebsitePageEditor
      pageKey={page}
      initialDocument={initialDocument}
      assets={(assets ?? []) as MediaAsset[]}
      initialIntegrityIssues={integrityIssues}
    >
      <PageView pageKey={page} />
    </WebsitePageEditor>
  );
}
