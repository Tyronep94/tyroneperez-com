import Link from "next/link";
import { Geist } from "next/font/google";
import { notFound } from "next/navigation";
import { AboutPageView } from "@/app/(public)/about/page";
import { ContactPageView } from "@/app/(public)/contact/page";
import { HomePageView } from "@/app/(public)/page";
import { MusicPageView } from "@/app/(public)/music/page";
import { PhotographyPageView } from "@/app/(public)/photography/page";
import { PortfolioPageView } from "@/app/(public)/portfolio/page";
import { PageRuntime } from "@/components/public/page-runtime";
import { SiteFooter } from "@/components/public/site-footer";
import { SiteHeader } from "@/components/public/site-header";
import { requireAdmin } from "@/lib/auth/admin";
import {
  emptyWebsitePageDocument,
  isWebsitePageKey,
  websitePageMeta,
  type WebsitePageDocument,
  type WebsitePageKey,
} from "@/types/website-editor";
import "@/app/(public)/public-site.css";

export const metadata = { title: "Private Page Preview", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
const geist = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" });

function PageView({ pageKey }: { pageKey: WebsitePageKey }) {
  if (pageKey === "home") return <HomePageView />;
  if (pageKey === "photography") return <PhotographyPageView />;
  if (pageKey === "music") return <MusicPageView />;
  if (pageKey === "portfolio") return <PortfolioPageView />;
  if (pageKey === "about") return <AboutPageView />;
  return <ContactPageView />;
}

export default async function PrivateWebsitePagePreview({ params }: { params: Promise<{ page: string }> }) {
  const { page } = await params;
  if (!isWebsitePageKey(page)) notFound();
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("website_page_drafts").select("document").eq("page_key", page).maybeSingle();
  const document = (data?.document ?? emptyWebsitePageDocument(page)) as WebsitePageDocument;
  return (
    <div className={`${geist.variable} public-site`}>
      <aside className="preview-bar" data-page-editor-ignore>
        <div><strong>Private draft preview</strong><span>{websitePageMeta[page].label} · only administrators can see this page</span></div>
        <Link href={`/admin/pages/${page}`}>Return to page editor</Link>
      </aside>
      <SiteHeader />
      <PageRuntime pageKey={page} document={document}><PageView pageKey={page} /></PageRuntime>
      <SiteFooter />
    </div>
  );
}
