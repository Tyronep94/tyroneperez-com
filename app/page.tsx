import Link from "next/link";

export default function HomePage() {
  return <main style={{minHeight:"100vh",display:"grid",placeItems:"center",padding:24}}>
    <section style={{width:"min(760px,100%)",textAlign:"center"}}>
      <p className="eyebrow">Los Angeles · California</p>
      <h1 className="page-title" style={{fontSize:"clamp(52px,10vw,104px)"}}>Tyrone Perez</h1>
      <p style={{fontSize:"clamp(17px,3vw,24px)",margin:"22px 0",color:"var(--muted)"}}>Music Production &amp; Photography</p>
      <div style={{width:52,height:1,background:"var(--accent)",margin:"32px auto"}} />
      <p style={{fontFamily:"Georgia,serif",fontSize:20}}>A new website is coming soon.</p>
      <Link className="btn btn-secondary" href="/login" style={{marginTop:34}}>Admin login <span aria-hidden>→</span></Link>
    </section>
  </main>;
}
