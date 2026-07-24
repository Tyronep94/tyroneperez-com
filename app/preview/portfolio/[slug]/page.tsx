import Link from "next/link";
import { Geist } from "next/font/google";
import { notFound } from "next/navigation";
import { CtaBanner } from "@/components/public/cta-banner";
import { MediaPlaceholder } from "@/components/public/media-placeholder";
import { RichContent } from "@/components/cms/rich-content";
import { requireAdmin } from "@/lib/auth/admin";
import { SiteHeader } from "@/components/public/site-header";
import { SiteFooter } from "@/components/public/site-footer";
import type { ContentEntry } from "@/types/cms";
import { CmsImage } from "@/components/cms/cms-image";
import { GalleryPage } from "@/components/public/gallery-page";
import type { GalleryLayout, GallerySettings } from "@/types/cms";
import "@/app/(public)/public-site.css";

export const metadata = { title: "Draft Preview", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
const geist = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" });

export default async function DraftPreviewPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("content_entries").select("*,cover_asset:media_assets!content_cover_asset_fk(*)").eq("kind", "portfolio").eq("slug", slug).maybeSingle();
  if (!data) notFound();
  const item = data as ContentEntry;
  const { data: draft } = await supabase.from("photography_gallery_drafts").select("layout,settings").eq("content_id", item.id).maybeSingle();
  if (draft) return <div className={`${geist.variable} public-site`}>
    <aside className="preview-bar"><div><strong>Private draft preview</strong><span>{item.status} · only administrators can see this page</span></div><Link href={`/admin/photography/galleries/${item.id}`}>Return to visual editor</Link></aside>
    <SiteHeader />
    <GalleryPage entry={item} layout={draft.layout as GalleryLayout} settings={draft.settings as GallerySettings} />
    <SiteFooter />
  </div>;
  const mediaType = item.kind === "album" || item.kind === "song" ? "audio" : "image";
  return <div className={`${geist.variable} public-site`}>
    <aside className="preview-bar"><div><strong>Draft preview</strong><span>{item.status} · only administrators can see this page</span></div><Link href={`/admin/content/${item.id}`}>Return to editor</Link></aside>
    <SiteHeader />
    <main id="main-content" className={`project-page project-page--${mediaType} preview-page`}>
      <section className="project-hero"><div className="public-container"><Link href="/portfolio" className="public-text-link project-back">Back to portfolio</Link><div className="project-hero__copy"><p className="public-kicker">{item.category || "Selected work"} · Preview</p><h1>{item.title}</h1>{item.excerpt && <p>{item.excerpt}</p>}</div>{item.cover_asset ? <CmsImage asset={item.cover_asset} className="cms-project-cover" sizes="(max-width: 1320px) calc(100vw - 40px), 1280px" priority /> : <MediaPlaceholder item={{title:item.title,mediaType,format:"wide",palette:"noir"}} />}</div></section>
      <section className="project-story public-section"><div className="public-container project-story__grid"><div><p className="public-kicker">Project story</p><h2>The work behind the work.</h2></div><RichContent document={item.content} /></div></section>
      <CtaBanner heading={`Have a ${(item.category || "creative").toLowerCase()} project in mind?`} />
    </main>
    <SiteFooter />
  </div>;
}
