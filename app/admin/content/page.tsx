import Link from "next/link";
import { requireAdmin } from "@/lib/auth/admin";

export const metadata = { title: "Content Studio" };

export default async function ContentPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { supabase } = await requireAdmin();
  const params = await searchParams;
  let query = supabase.from("content_entries").select("id,title,slug,kind,status,featured,pinned,updated_at").order("updated_at", { ascending: false });
  if (params.status) query = query.eq("status", params.status);
  const { data, error } = await query;
  return <div className="page-wrap cms-page">
    <header className="cms-page-header"><div><p className="eyebrow">Creative studio</p><h1 className="page-title">Content</h1><p className="subtle">Draft, preview, and publish the work without changing its visual language.</p></div><Link href="/admin/content/new" className="btn">New entry</Link></header>
    <nav className="cms-tabs" aria-label="Filter content"><Link href="/admin/content">All</Link><Link href="/admin/content?status=draft">Drafts</Link><Link href="/admin/content?status=published">Published</Link><Link href="/admin/content?status=scheduled">Scheduled</Link></nav>
    {error ? <p className="notice notice-error">Content could not be loaded: {error.message}. Apply the Part 16 migration first.</p> :
      data?.length ? <div className="cms-content-list">{data.map(item => <Link href={`/admin/content/${item.id}`} className="cms-content-row" key={item.id}><div><span className="cms-kind">{item.kind}</span><h2>{item.title}</h2><p>/{item.slug}</p></div><div className="cms-row-meta">{item.pinned && <span>Pinned</span>}{item.featured && <span>Featured</span>}<b className={`cms-status cms-status--${item.status}`}>{item.status}</b><time>{new Intl.DateTimeFormat("en-US",{month:"short",day:"numeric",year:"numeric"}).format(new Date(item.updated_at))}</time></div></Link>)}</div> :
      <div className="card empty"><h2>Begin with one story.</h2><p>Create a portfolio entry, save it privately, and preview it before publishing.</p><Link href="/admin/content/new" className="btn btn-secondary">Create a draft</Link></div>}
  </div>;
}
