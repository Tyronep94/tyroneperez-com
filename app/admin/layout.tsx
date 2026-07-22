import type { ReactNode } from "react";
import { AdminNav } from "@/components/admin/admin-nav";
import "@/components/admin/admin-nav.css";
import { requireAdmin } from "@/lib/auth/admin";
import { logout } from "./actions";

export const dynamic = "force-dynamic";
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const { admin } = await requireAdmin();
  return <div className="shell"><AdminNav displayName={admin.display_name || "Tyrone"} logout={logout}/><main className="admin-main">{children}</main></div>;
}
