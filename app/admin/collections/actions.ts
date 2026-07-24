"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/admin";

const schema = z.object({ name: z.string().trim().min(1).max(80), slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/), description: z.string().trim().max(300).nullable() });
export async function createCollection(formData: FormData) {
  const parsed = schema.safeParse({ name: formData.get("name"), slug: formData.get("slug"), description: String(formData.get("description") ?? "").trim() || null });
  if (!parsed.success) return;
  const { supabase } = await requireAdmin();
  await supabase.from("collections").insert(parsed.data);
  revalidatePath("/admin/collections");
}

export async function deleteCollection(id: string) {
  const { supabase } = await requireAdmin();
  await supabase.from("collections").delete().eq("id", id);
  revalidatePath("/admin/collections");
}
