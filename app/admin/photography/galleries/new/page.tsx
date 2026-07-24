import Link from "next/link";
import { createPhotographyGallery } from "../actions";

export const metadata = { title: "New Photography Gallery" };

export default async function NewPhotographyGalleryPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return <div className="page-wrap cms-page photography-new">
    <header className="cms-page-header"><div><Link href="/admin/photography/galleries" className="cms-back">← Galleries</Link><p className="eyebrow">Photography</p><h1 className="page-title">New gallery</h1><p className="subtle">Name the work now. You’ll arrange photographs on the live page next.</p></div></header>
    {error && <p className="notice notice-error">{error === "invalid" ? "Add a title and a lowercase URL slug." : decodeURIComponent(error)}</p>}
    <form action={createPhotographyGallery} className="card photography-new__form">
      <label className="field span-2"><span>Gallery title</span><input className="input photography-new__title" name="title" placeholder="Sunday in Los Angeles" required /></label>
      <label className="field"><span>URL slug</span><input className="input" name="slug" placeholder="sunday-in-los-angeles" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" required /></label>
      <label className="field"><span>Category</span><input className="input" name="category" defaultValue="Photography" /></label>
      <label className="field span-2"><span>Description</span><textarea className="input" name="description" placeholder="A concise introduction for the gallery page and portfolio card." /></label>
      <div className="photography-new__drop span-2"><span>＋</span><strong>Photographs come next</strong><p>The visual editor supports multiple files, folders, upload progress, retry, and drag-and-drop placement.</p></div>
      <div className="span-2"><button className="btn">Create and add photographs</button></div>
    </form>
  </div>;
}
