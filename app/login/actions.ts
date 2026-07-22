"use server";
import { redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import type { ActionState } from "@/types/database";

export async function login(_: ActionState, formData: FormData): Promise<ActionState> {
  if (!isSupabaseConfigured()) return { error: "Supabase isn’t configured yet. Add the environment variables from .env.example." };
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Enter both your email and password." };
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) return { error: "The email or password is incorrect." };
  const { data: admin } = await supabase.from("admin_users").select("id").eq("auth_user_id", data.user.id).maybeSingle();
  if (!admin) { await supabase.auth.signOut(); return { error: "This account does not have admin access." }; }
  redirect("/admin");
}
