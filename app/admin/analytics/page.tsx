import Link from "next/link";
import { requireAdmin } from "@/lib/auth/admin";

export const metadata = { title: "Analytics" };
export default async function AnalyticsPage() {
  const { supabase } = await requireAdmin();
  const [content, inquiries, bookings, media, latest, activity] = await Promise.all([
    supabase.from("content_entries").select("id,title,view_count,status").eq("status","published").order("view_count",{ascending:false}).limit(5),
    supabase.from("inquiries").select("*",{count:"exact",head:true}),
    supabase.from("bookings").select("*",{count:"exact",head:true}),
    supabase.from("media_assets").select("file_size"),
    supabase.from("media_assets").select("id,title,kind,created_at,public_url").order("created_at",{ascending:false}).limit(4),
    supabase.from("cms_activity").select("id,summary,created_at").order("created_at",{ascending:false}).limit(6),
  ]);
  const storage = (media.data ?? []).reduce((sum,item) => sum + Number(item.file_size),0);
  const totalViews = (content.data ?? []).reduce((sum,item) => sum + Number(item.view_count),0);
  const cards = [
    { label:"Portfolio views", value: totalViews.toLocaleString(), note:"Native CMS tracking" },
    { label:"Inquiry count", value:String(inquiries.count ?? 0), note:"All-time inquiries" },
    { label:"Booking count", value:String(bookings.count ?? 0), note:"All-time bookings" },
    { label:"Storage usage", value:storage < 1048576 ? `${Math.round(storage/1024)} KB` : `${(storage/1048576).toFixed(1)} MB`, note:"CMS media library" },
  ];
  return <div className="page-wrap cms-page"><header className="cms-page-header"><div><p className="eyebrow">Studio pulse</p><h1 className="page-title">Analytics</h1><p className="subtle">A calm view of what is being seen, heard, and requested.</p></div><span className="badge">Analytics foundation</span></header>
    <section className="cms-metric-grid">{cards.map(card => <article className="card cms-metric" key={card.label}><p>{card.label}</p><strong>{card.value}</strong><small>{card.note}</small></article>)}</section>
    <div className="cms-analytics-grid"><section className="card panel"><div className="cms-section-head"><div><p className="eyebrow">Performance</p><h2 className="section-title">Top galleries</h2></div></div>{content.data?.length ? <ol className="cms-ranking">{content.data.map((item,index)=><li key={item.id}><span>{String(index+1).padStart(2,"0")}</span><strong>{item.title}</strong><b>{item.view_count} views</b></li>)}</ol>:<div className="empty">Publish portfolio entries to begin native view tracking.</div>}</section>
      <section className="card panel"><p className="eyebrow">Provider connections</p><h2 className="section-title">Listening & contact activity</h2><div className="cms-placeholder-metrics"><div><strong>Most played album</strong><p>Connect an audio analytics provider to see listening activity.</p></div><div><strong>Contact form activity</strong><p>Available when the guided inquiry form is launched.</p></div><div><strong>Most viewed photos</strong><p>Per-asset event tracking is prepared for a future analytics provider.</p></div></div></section>
      <section className="card panel"><p className="eyebrow">Latest uploads</p><h2 className="section-title">Fresh in the library</h2>{latest.data?.length ? <div className="cms-latest">{latest.data.map(item=><Link href={`/admin/media?asset=${item.id}`} key={item.id}><span>{item.kind}</span><strong>{item.title}</strong><time>{new Intl.DateTimeFormat("en-US",{month:"short",day:"numeric"}).format(new Date(item.created_at))}</time></Link>)}</div>:<div className="empty">No media uploaded yet.</div>}</section>
      <section className="card panel"><p className="eyebrow">Recent changes</p><h2 className="section-title">Change history</h2>{activity.data?.length ? <div className="cms-latest">{activity.data.map(item=><div key={item.id}><span>Change</span><strong>{item.summary}</strong><time>{new Intl.DateTimeFormat("en-US",{month:"short",day:"numeric"}).format(new Date(item.created_at))}</time></div>)}</div>:<div className="empty">Changes will appear as the studio is edited.</div>}</section>
    </div>
  </div>;
}
