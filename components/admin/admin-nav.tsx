"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const main = [{href:"/admin",label:"Today",glyph:"◷"},{href:"/admin/clients",label:"Clients",glyph:"◎"},{href:"/admin/bookings",label:"Bookings",glyph:"◇"}];
const future = ["Calendar","Portfolio","Services","Settings"];
export function AdminNav({ displayName, logout }: { displayName: string; logout: () => Promise<void> }) {
  const path = usePathname();
  const active = (href:string) => href === "/admin" ? path === href : path.startsWith(href);
  return <>
    <aside className="side-nav">
      <div><Link href="/admin" className="brand"><span>TP</span><div>Tyrone Perez<small>Creative</small></div></Link>
        <nav aria-label="Admin navigation" className="nav-list">{main.map(item=><Link key={item.href} href={item.href} className={active(item.href)?"active":""}><i>{item.glyph}</i>{item.label}</Link>)}</nav>
        <div className="future-nav"><p>Coming later</p>{future.map(item=><span key={item} aria-disabled="true">{item}</span>)}</div>
      </div>
      <div className="user-block"><span className="avatar">{displayName.charAt(0).toUpperCase()}</span><div><strong>{displayName}</strong><small>Administrator</small></div><form action={logout}><button aria-label="Log out" title="Log out">↗</button></form></div>
    </aside>
    <nav className="bottom-nav" aria-label="Mobile admin navigation">{main.map(item=><Link key={item.href} href={item.href} className={active(item.href)?"active":""}><i>{item.glyph}</i><span>{item.label}</span></Link>)}<form action={logout}><button aria-label="Log out"><i>↗</i><span>Logout</span></button></form></nav>
  </>;
}
