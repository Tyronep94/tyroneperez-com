import Link from "next/link";
import { requireAdmin } from "@/lib/auth/admin";

export const metadata = { title: "Search" };
type Result = { group: string; title: string; detail: string; href: string };

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const q = (await searchParams).q?.trim() ?? "";
  const { supabase } = await requireAdmin();
  const term = `%${q.replace(/[,%()]/g, "")}%`;
  let results: Result[] = [];
  let errorMessage = "";
  if (q.length >= 2) {
    const [content, media, clients, bookings, services] = await Promise.all([
      supabase.from("content_entries").select("id,title,kind,slug").or(`title.ilike.${term},slug.ilike.${term},excerpt.ilike.${term}`).limit(8),
      supabase.from("media_assets").select("id,title,filename,kind").or(`title.ilike.${term},filename.ilike.${term},alt_text.ilike.${term}`).limit(8),
      supabase.from("clients").select("id,first_name,last_name,email").or(`first_name.ilike.${term},last_name.ilike.${term},email.ilike.${term}`).limit(8),
      supabase.from("bookings").select("id,title,status").ilike("title", term).limit(8),
      supabase.from("services").select("id,name,category").ilike("name", term).limit(8),
    ]);
    errorMessage = [content.error, media.error, clients.error, bookings.error, services.error].filter(Boolean).map(error => error!.message).join(" · ");
    results = [
      ...(content.data ?? []).map(item => ({ group: item.kind === "portfolio" ? "Portfolio" : item.kind, title: item.title, detail: `/${item.slug}`, href: `/admin/content/${item.id}` })),
      ...(media.data ?? []).map(item => ({ group: "Media", title: item.title, detail: `${item.kind} · ${item.filename}`, href: `/admin/media?asset=${item.id}` })),
      ...(clients.data ?? []).map(item => ({ group: "Clients", title: `${item.first_name} ${item.last_name}`, detail: item.email ?? "No email", href: `/admin/clients/${item.id}` })),
      ...(bookings.data ?? []).map(item => ({ group: "Bookings", title: item.title, detail: item.status, href: `/admin/bookings/${item.id}` })),
      ...(services.data ?? []).map(item => ({ group: "Services", title: item.name, detail: item.category, href: `/admin/services#service-${item.id}` })),
    ];
    if (["settings","seo","site","publishing","storage"].some(value => value.includes(q.toLowerCase()) || q.toLowerCase().includes(value))) {
      results.push({ group:"Settings", title:"CMS settings", detail:"Publishing, storage, SEO, and environment status", href:"/admin/settings" });
    }
  }
  return <div className="page-wrap cms-page"><header className="cms-search-hero"><p className="eyebrow">Find anything</p><h1 className="page-title">Search the studio.</h1><form><input name="q" type="search" defaultValue={q} autoFocus placeholder="Portfolio, media, clients, bookings…" aria-label="Search everything" /><button className="btn">Search</button></form></header>
    {errorMessage && <p className="notice notice-error">Some results could not be loaded: {errorMessage}</p>}
    {q.length === 1 && <div className="empty">Enter at least two characters.</div>}
    {q.length >= 2 && (results.length ? <div className="cms-search-results">{results.map((result,index) => <Link href={result.href} key={`${result.group}-${result.href}-${index}`}><span>{result.group}</span><div><h2>{result.title}</h2><p>{result.detail}</p></div><b>→</b></Link>)}</div> : <div className="card empty"><h2>No matches for “{q}”</h2><p>Try a client name, project title, service, or filename.</p></div>)}
  </div>;
}
