import Link from "next/link";
import { requireAdmin } from "@/lib/auth/admin";
import { CmsImage } from "@/components/cms/cms-image";
import type { ContentEntry } from "@/types/cms";

export const metadata = { title: "Photography Galleries" };

export default async function PhotographyGalleriesPage() {
  const { supabase } = await requireAdmin();
  const [{ data, error }, { data: publicationRows }] = await Promise.all([
    supabase.from("content_entries").select("*,cover_asset:media_assets!content_cover_asset_fk(*)").eq("kind", "portfolio").order("updated_at", { ascending: false }),
    supabase.from("photography_gallery_publications").select("content_id,layout"),
  ]);
  const publications = new Map((publicationRows ?? []).map((row) => [row.content_id, row.layout as { sections?: Array<{ type: string; items?: unknown[] }> }]));
  const galleries = (data ?? []) as ContentEntry[];
  return <div className="page-wrap cms-page photography-index">
    <header className="cms-page-header">
      <div><p className="eyebrow">Photography</p><h1 className="page-title">Galleries</h1><p className="subtle">Build, arrange, and publish photography as it appears on the site.</p></div>
      <Link href="/admin/photography/galleries/new" className="btn">New gallery</Link>
    </header>
    <div className="photography-index__tools">
      <label><span className="sr-only">Search galleries</span><input className="input" type="search" placeholder="Search galleries" /></label>
      <select className="input" aria-label="Filter gallery status"><option>All statuses</option><option>Published</option><option>Draft</option></select>
      <select className="input" aria-label="Sort galleries"><option>Recently updated</option><option>Newest</option><option>Title</option></select>
      <div className="photography-view-toggle" aria-label="View options"><button className="is-active" aria-label="Grid view">▦</button><button aria-label="List view">☷</button></div>
    </div>
    {error && <p className="notice notice-error">Galleries could not be loaded: {error.message}</p>}
    <div className="photography-gallery-cards">
      {galleries.map((gallery) => {
        const layout = publications.get(gallery.id);
        const count = layout?.sections?.reduce((total, section) => total + (section.type === "images" ? section.items?.length ?? 0 : 0), 0) ?? 0;
        return <article className="photography-gallery-card" key={gallery.id}>
          <Link href={`/admin/photography/galleries/${gallery.id}`} className="photography-gallery-card__cover">
            {gallery.cover_asset ? <CmsImage asset={gallery.cover_asset} sizes="(max-width: 740px) 100vw, 42vw" /> : <span>Add a cover photograph</span>}
            <div className="photography-gallery-card__badges">{gallery.featured && <b>Featured</b>}<b className={`status-${gallery.status}`}>{gallery.status}</b></div>
          </Link>
          <div className="photography-gallery-card__copy">
            <div><p>{gallery.category || "Photography"}</p><h2><Link href={`/admin/photography/galleries/${gallery.id}`}>{gallery.title}</Link></h2></div>
            <dl><div><dt>Photos</dt><dd>{count}</dd></div><div><dt>Updated</dt><dd>{new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(gallery.updated_at))}</dd></div></dl>
            <div className="photography-gallery-card__actions">
              <Link href={`/admin/photography/galleries/${gallery.id}`}>Edit</Link>
              <Link href={`/preview/portfolio/${gallery.slug}`} target="_blank">Preview ↗</Link>
            </div>
          </div>
        </article>;
      })}
    </div>
    {!galleries.length && !error && <div className="photography-empty"><span>□</span><h2>Your first gallery starts here.</h2><p>Upload a shoot, arrange it on the real page, and publish when it feels right.</p><Link href="/admin/photography/galleries/new" className="btn">Create gallery</Link></div>}
  </div>;
}
