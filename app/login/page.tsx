import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/forms/login-form";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

export const metadata = { title: "Admin Login" };
export const dynamic = "force-dynamic";
export default async function LoginPage({ searchParams }: { searchParams: Promise<{error?: string}> }) {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: admin } = await supabase.from("admin_users").select("id").eq("auth_user_id", user.id).maybeSingle();
      if (admin) redirect("/admin");
    }
  }
  const params = await searchParams;
  return <main style={{minHeight:"100vh",display:"grid",gridTemplateColumns:"minmax(0,1fr)",placeItems:"center",padding:22}}>
    <section className="card panel" style={{width:"min(440px,100%)",padding:"clamp(26px,6vw,46px)"}}>
      <Link href="/" className="eyebrow">Tyrone Perez Creative</Link>
      <h1 className="page-title" style={{fontSize:44,marginTop:28}}>Welcome back.</h1>
      <p className="subtle" style={{margin:"0 0 28px"}}>Sign in to manage clients, bookings, and today’s schedule.</p>
      {params.error === "unauthorized" && <p className="notice notice-error">This account is not an authorized admin.</p>}
      {params.error === "setup" && <p className="notice notice-error">Connect Supabase before signing in. See the README for setup.</p>}
      <LoginForm />
      <p className="subtle" style={{fontSize:12,marginTop:22}}>Admin accounts are invitation-only. There is no public registration.</p>
    </section>
  </main>;
}
