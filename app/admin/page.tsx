import Link from "next/link";
import { getDashboardData } from "@/lib/database/dashboard";
import { BookingCard } from "@/components/dashboard/booking-card";
import { formatDate, greeting } from "@/lib/utils/dates";
import { requireAdmin } from "@/lib/auth/admin";
import { websitePageKeys, websitePageMeta } from "@/types/website-editor";

export const metadata = { title: "Today’s Agenda" };
export default async function DashboardPage() {
  const [{ admin }, data] = await Promise.all([requireAdmin(), getDashboardData()]);
  const firstName = (admin.display_name || "Tyrone").split(" ")[0];
  return <div className="page-wrap">
    <header style={{marginBottom:36}}><p className="eyebrow">Today’s Agenda</p><h1 className="page-title">{greeting()}, {firstName}.</h1><p className="subtle" style={{fontFamily:"Georgia,serif",fontSize:18}}>{formatDate(new Date(),{weekday:"long",month:"long",day:"numeric"})}</p></header>
    <section className="dashboard-page-launcher">
      <div className="dashboard-page-launcher__heading">
        <div><p className="eyebrow">Website editor</p><h2>Edit the live pages</h2></div>
        <p>Choose a page, then click its text, buttons, links, or images directly.</p>
      </div>
      <div className="dashboard-page-launcher__grid">
        {websitePageKeys.map((pageKey, index) => {
          const page = websitePageMeta[pageKey];
          return <Link href={`/admin/pages/${pageKey}`} key={pageKey}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <div><h3>{page.label}</h3><p>{page.description}</p></div>
            <b aria-hidden="true">Edit →</b>
          </Link>;
        })}
      </div>
    </section>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(min(100%,320px),1fr))",gap:18,alignItems:"start"}}>
      <section className="card panel" style={{gridRow:"span 2"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><h2 className="section-title">Today</h2><span className="badge">{data.today.length} confirmed</span></div>
        {data.today.length ? data.today.map(b=><BookingCard key={b.id} booking={b}/>) : <div className="empty"><p style={{fontFamily:"Georgia,serif",fontSize:20,color:"var(--ink)"}}>Your schedule is clear.</p><p>No confirmed bookings today.</p><Link className="btn btn-secondary btn-small" href="/admin/bookings/new">Add a booking</Link></div>}
      </section>
      <section className="card panel"><h2 className="section-title">Needs Attention</h2><div style={{display:"grid",gap:12,marginTop:20}}>
        <Link href="/admin/inquiries" style={{display:"flex",justifyContent:"space-between"}}><span>New inquiries</span><strong>{data.inquiries.length}</strong></Link>
        <Link href="/admin/bookings?status=pending" style={{display:"flex",justifyContent:"space-between"}}><span>Awaiting confirmation</span><strong>{data.pendingCount}</strong></Link>
        <Link href="/admin/clients?follow_up=true" style={{display:"flex",justifyContent:"space-between"}}><span>Clients need follow-up</span><strong>{data.followUps.length}</strong></Link>
      </div></section>
      <section className="card panel"><div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><h2 className="section-title">Up Next</h2><Link href="/admin/bookings" className="subtle" style={{fontSize:12}}>View all →</Link></div>
        {data.upcoming.length ? data.upcoming.map(b=><BookingCard key={b.id} booking={b} compact/>) : <div className="empty">No upcoming bookings yet.</div>}
      </section>
    </div>
  </div>;
}
