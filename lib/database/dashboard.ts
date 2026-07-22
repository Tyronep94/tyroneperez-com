import type { Booking, Inquiry, Client } from "@/types/database";
import { todayUtcRange } from "@/lib/utils/dates";
import { createClient } from "@/lib/supabase/server";

export async function getDashboardData() {
  const supabase = await createClient();
  const { start, end } = todayUtcRange();
  const now = new Date().toISOString();
  const [today, upcoming, inquiries, followUps, pending] = await Promise.all([
    supabase.from("bookings").select("*, client:clients(*), service:services(*)").gte("start_at",start).lte("start_at",end).eq("status","confirmed").order("start_at"),
    supabase.from("bookings").select("*, client:clients(*), service:services(*)").gt("start_at",end).in("status",["pending","confirmed"]).order("start_at").limit(5),
    supabase.from("inquiries").select("*, client:clients(*), service:services(*)").eq("status","new").order("created_at",{ascending:false}).limit(5),
    supabase.from("clients").select("*").eq("requires_follow_up",true).order("follow_up_date",{ascending:true,nullsFirst:false}).limit(5),
    supabase.from("bookings").select("id",{count:"exact",head:true}).gte("start_at",now).eq("status","pending"),
  ]);
  const error = today.error || upcoming.error || inquiries.error || followUps.error || pending.error;
  if (error) throw new Error(error.message);
  return {
    today: (today.data ?? []) as unknown as Booking[], upcoming: (upcoming.data ?? []) as unknown as Booking[],
    inquiries: (inquiries.data ?? []) as unknown as Inquiry[], followUps: (followUps.data ?? []) as Client[], pendingCount: pending.count ?? 0,
  };
}
