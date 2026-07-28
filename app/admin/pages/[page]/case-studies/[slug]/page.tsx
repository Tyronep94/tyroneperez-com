import { notFound } from "next/navigation";
import { WebsitePageEditor } from "@/components/cms/website-page-editor";
import { PlaceholderCaseStudy } from "@/components/public/placeholder-case-study";
import { portfolioItems } from "@/content/public-site";
import { requireAdmin } from "@/lib/auth/admin";
import { inspectWebsiteDocumentMedia } from "@/lib/media-integrity";
import {
  isPhotographyCaseStudySlug,
  photographyCaseStudyEditors,
  photographyCaseStudySlotNamespace,
} from "@/lib/photography-case-studies";
import type { MediaAsset } from "@/types/cms";
import { emptyWebsitePageDocument, type WebsitePageDocument } from "@/types/website-editor";
import "@/app/(public)/public-site.css";

export const metadata = { title: "Photography Case Study Editor" };

export default async function PhotographyCaseStudyEditorPage({
  params,
}: {
  params: Promise<{ page: string; slug: string }>;
}) {
  const { page, slug } = await params;
  if (page !== "photography" || !isPhotographyCaseStudySlug(slug)) notFound();
  const item = portfolioItems.find((entry) => entry.slug === slug && entry.category === "Photography");
  const editorMeta = photographyCaseStudyEditors.find((entry) => entry.slug === slug);
  if (!item || !editorMeta) notFound();

  const { supabase } = await requireAdmin();
  const [{ data: draft }, { data: publication }, { data: assets }] = await Promise.all([
    supabase.from("website_page_drafts").select("document").eq("page_key", "photography").maybeSingle(),
    supabase.from("website_page_publications").select("document").eq("page_key", "photography").maybeSingle(),
    supabase.from("media_assets").select("*").eq("kind", "image").order("created_at", { ascending: false }).limit(1000),
  ]);
  const initialDocument = (draft?.document ?? publication?.document ?? emptyWebsitePageDocument("photography")) as WebsitePageDocument;
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
      pageKey="photography"
      title={`Photography · ${editorMeta.label}`}
      previewPath={`/preview/pages/photography/case-studies/${slug}`}
      publishedPath={`/portfolio/${slug}`}
      slotNamespace={photographyCaseStudySlotNamespace(slug)}
      initialDocument={initialDocument}
      initialIntegrityIssues={integrityIssues}
      assets={(assets ?? []) as MediaAsset[]}
    >
      <PlaceholderCaseStudy item={item} editableProjectMedia />
    </WebsitePageEditor>
  );
}
