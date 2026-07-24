import Link from "next/link";
import { requireAdmin } from "@/lib/auth/admin";

export const metadata = { title: "Content History" };
export default async function HistoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireAdmin();
  const [{ data: entry }, { data: revisions, error }] = await Promise.all([
    supabase.from("content_entries").select("title").eq("id", id).single(),
    supabase.from("content_revisions").select("id,revision_number,change_summary,created_at,edited_by,admin_users!content_revisions_edited_by_fkey(display_name)").eq("content_id", id).order("revision_number", { ascending: false }),
  ]);
  return <div className="page-wrap cms-page"><header className="cms-page-header"><div><Link href={`/admin/content/${id}`} className="cms-back">← Back to editor</Link><p className="eyebrow">Change history</p><h1 className="page-title">{entry?.title ?? "Content"}</h1><p className="subtle">Every meaningful edit is preserved as a read-only revision. Restore tooling is architected for a later release.</p></div></header>
    {error ? <p className="notice notice-error">History could not be loaded: {error.message}</p> : revisions?.length ? <ol className="cms-history">{revisions.map(revision => <li className="card" key={revision.id}><span>v{revision.revision_number}</span><div><strong>{revision.change_summary || "Content updated"}</strong><p>{(revision.admin_users as unknown as {display_name?:string})?.display_name ?? "Administrator"} · {new Intl.DateTimeFormat("en-US",{dateStyle:"medium",timeStyle:"short"}).format(new Date(revision.created_at))}</p></div><button disabled title="Restore will be enabled in a future release">Restore</button></li>)}</ol> : <div className="card empty">No previous revisions yet.</div>}
  </div>;
}
