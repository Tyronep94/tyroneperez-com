import Link from "next/link";
import type { Booking } from "@/types/database";
import { formatTime } from "@/lib/utils/dates";
import { markBookingComplete } from "@/app/admin/bookings/actions";

export function BookingCard({ booking, compact=false }: { booking: Booking; compact?: boolean }) {
  const client = booking.client;
  const tel = client?.phone?.replace(/[^+\d]/g, "");
  return <article style={{padding:compact?"15px 0":"19px 0",borderBottom:"1px solid var(--line)"}}>
    <div style={{display:"flex",gap:16,alignItems:"flex-start",justifyContent:"space-between",flexWrap:"wrap"}}>
      <div style={{display:"flex",gap:15}}><time style={{fontFamily:"Georgia,serif",fontSize:18,minWidth:74}}>{formatTime(booking.start_at)}</time>
        <div><Link href={`/admin/bookings/${booking.id}`} style={{fontWeight:750}}>{booking.title}</Link><p className="subtle" style={{fontSize:13,margin:"5px 0"}}>{client ? `${client.first_name} ${client.last_name}` : "No client"} · {booking.service?.name ?? booking.category}</p>
        {!compact && <p className="subtle" style={{fontSize:12,margin:0}}>{booking.location || "Location not set"}</p>}</div></div>
      <span className={`badge badge-${booking.status}`}>{booking.status}</span>
    </div>
    {!compact && <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:15,paddingLeft:89}}>
      {tel && <a className="btn btn-secondary btn-small" href={`tel:${tel}`}>Call</a>}
      {client?.email && <a className="btn btn-secondary btn-small" href={`mailto:${client.email}`}>Email</a>}
      {booking.location && <a className="btn btn-secondary btn-small" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(booking.location)}`} target="_blank" rel="noreferrer">Directions</a>}
      {client && <Link className="btn btn-secondary btn-small" href={`/admin/clients/${client.id}`}>View client</Link>}
      <Link className="btn btn-secondary btn-small" href={`/admin/bookings/${booking.id}`}>View booking</Link>
      {booking.status !== "completed" && booking.status !== "cancelled" && <form action={markBookingComplete.bind(null,booking.id)}><button className="btn btn-small">Mark complete</button></form>}
    </div>}
  </article>;
}
