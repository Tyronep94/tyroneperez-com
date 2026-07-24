import { requireAdmin } from "@/lib/auth/admin";

export const metadata = { title: "Services" };
export default async function ServicesPage() {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase.from("services").select("*").order("category").order("name");
  return <div className="page-wrap cms-page"><header className="cms-page-header"><div><p className="eyebrow">Offerings</p><h1 className="page-title">Services</h1><p className="subtle">The active service catalog used across inquiries and bookings.</p></div></header>{error ? <p className="notice notice-error">{error.message}</p> : <div className="cms-service-grid">{(data ?? []).map(service=><article className="card panel" id={`service-${service.id}`} key={service.id}><span className="cms-kind">{service.category}</span><h2 className="section-title">{service.name}</h2><p className="subtle">{service.description}</p><div><span className={`cms-status ${service.is_active ? "cms-status--published" : ""}`}>{service.is_active ? "Active" : "Inactive"}</span><small>{service.default_duration_minutes} minutes</small></div></article>)}</div>}</div>;
}
