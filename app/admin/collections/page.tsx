import { requireAdmin } from "@/lib/auth/admin";
import { createCollection, deleteCollection } from "./actions";

export const metadata = { title: "Portfolio Collections" };
export default async function CollectionsPage() {
  const { supabase } = await requireAdmin();
  const [{ data: collections, error }, { data: memberships }] = await Promise.all([
    supabase.from("collections").select("*").order("sort_order"),
    supabase.from("content_collections").select("collection_id"),
  ]);
  const count = new Map<string,number>();
  for (const membership of memberships ?? []) count.set(membership.collection_id, (count.get(membership.collection_id) ?? 0) + 1);
  return <div className="page-wrap cms-page"><header className="cms-page-header"><div><p className="eyebrow">Portfolio structure</p><h1 className="page-title">Collections</h1><p className="subtle">A gallery can live in several stories without being duplicated.</p></div></header>
    {error && <p className="notice notice-error">Collections could not be loaded: {error.message}</p>}
    <div className="cms-two-column"><section className="cms-collection-grid">{(collections ?? []).map(collection => <article className="card cms-collection-card" key={collection.id}><span>{String(count.get(collection.id) ?? 0).padStart(2,"0")}</span><h2>{collection.name}</h2><p>{collection.description || "No description yet."}</p><div><small>/{collection.slug}</small><form action={deleteCollection.bind(null,collection.id)}><button aria-label={`Delete ${collection.name}`} title="Delete collection">Delete</button></form></div></article>)}</section>
      <form action={createCollection} className="card panel cms-create-card"><p className="eyebrow">New collection</p><h2 className="section-title">Create a point of view.</h2><label className="field"><span>Name</span><input className="input" name="name" required /></label><label className="field"><span>Slug</span><input className="input" name="slug" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" /></label><label className="field"><span>Description</span><textarea className="input" name="description" /></label><button className="btn">Add collection</button></form>
    </div>
  </div>;
}
