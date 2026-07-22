import { redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

export async function requireAdmin() {
  if (!isSupabaseConfigured()) redirect("/login?error=setup");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: admin } = await supabase.from("admin_users").select("id, display_name, email").eq("auth_user_id", user.id).maybeSingle();
  if (!admin) {
    await supabase.auth.signOut();
    redirect("/login?error=unauthorized");
  }
  return { user, admin, supabase };
}
