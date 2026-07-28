import Link from "next/link";
import { Geist } from "next/font/google";
import { notFound } from "next/navigation";
import { PageRuntime } from "@/components/public/page-runtime";
import { PlaceholderCaseStudy } from "@/components/public/placeholder-case-study";
import { SiteFooter } from "@/components/public/site-footer";
import { SiteHeader } from "@/components/public/site-header";
import { portfolioItems } from "@/content/public-site";
import { requireAdmin } from "@/lib/auth/admin";
import {
  isPhotographyCaseStudySlug,
  photographyCaseStudyEditors,
  photographyCaseStudySlotNamespace,
} from "@/lib/photography-case-studies";
import { emptyWebsitePageDocument, type WebsitePageDocument } from "@/types/website-editor";
import "@/app/(public)/public-site.css";

export const metadata = { title: "Private Case Study Preview", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
const geist = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" });

export default async function PrivatePhotographyCaseStudyPreview({
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
  const { data } = await supabase.from("website_page_drafts").select("document").eq("page_key", "photography").maybeSingle();
  const document = (data?.document ?? emptyWebsitePageDocument("photography")) as WebsitePageDocument;

  return (
    <div className={`${geist.variable} public-site`}>
      <aside className="preview-bar" data-page-editor-ignore>
        <div><strong>Private draft preview</strong><span>{editorMeta.label} · only administrators can see this page</span></div>
        <Link href={`/admin/pages/photography/case-studies/${slug}`}>Return to page editor</Link>
      </aside>
      <SiteHeader />
      <PageRuntime
        pageKey="photography"
        slotNamespace={photographyCaseStudySlotNamespace(slug)}
        document={document}
      >
        <PlaceholderCaseStudy item={item} editableProjectMedia />
      </PageRuntime>
      <SiteFooter />
    </div>
  );
}
