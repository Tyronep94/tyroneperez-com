"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/admin";
import type { ActionState } from "@/types/database";

const optionalText = z.preprocess(v => v === "" ? null : v, z.string().trim().nullable());
const clientSchema = z.object({
  first_name:z.string().trim().min(1,"First name is required."), last_name:z.string().trim().min(1,"Last name is required."),
  email:z.preprocess(v=>v===""?null:v,z.email("Enter a valid email.").nullable()), phone:optionalText,
  preferred_contact_method:z.preprocess(v=>v===""?null:v,z.enum(["email","phone","text"]).nullable()),
  referral_source:optionalText, general_notes:optionalText,
  requires_follow_up:z.boolean(), follow_up_date:z.preprocess(v=>v===""?null:v,z.string().nullable()),
}).refine(v=>!v.requires_follow_up || v.follow_up_date,{message:"Choose a follow-up date.",path:["follow_up_date"]});

const parse = (f:FormData) => clientSchema.safeParse({ first_name:f.get("first_name"),last_name:f.get("last_name"),email:f.get("email"),phone:f.get("phone"),preferred_contact_method:f.get("preferred_contact_method"),referral_source:f.get("referral_source"),general_notes:f.get("general_notes"),requires_follow_up:f.get("requires_follow_up")==="on",follow_up_date:f.get("follow_up_date") });

export async function createClient(_:ActionState,formData:FormData):Promise<ActionState>{
  const parsed=parse(formData); if(!parsed.success)return{error:"Please correct the highlighted information.",fieldErrors:parsed.error.flatten().fieldErrors};
  const {supabase}=await requireAdmin(); const {data,error}=await supabase.from("clients").insert(parsed.data).select("id").single();
  if(error)return{error:`Client could not be saved: ${error.message}`}; revalidatePath("/admin/clients"); redirect(`/admin/clients/${data.id}?success=created`);
}
export async function updateClient(id:string,_:ActionState,formData:FormData):Promise<ActionState>{
  const parsed=parse(formData); if(!parsed.success)return{error:"Please correct the highlighted information.",fieldErrors:parsed.error.flatten().fieldErrors};
  const {supabase}=await requireAdmin(); const {error}=await supabase.from("clients").update(parsed.data).eq("id",id);
  if(error)return{error:`Changes could not be saved: ${error.message}`}; revalidatePath("/admin", "layout"); redirect(`/admin/clients/${id}?success=updated`);
}
