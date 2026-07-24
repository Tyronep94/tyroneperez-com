import Link from "next/link";
import { CtaBanner } from "@/components/public/cta-banner";
import { CmsImage } from "@/components/cms/cms-image";
import type { ContentEntry, GalleryLayout, GalleryPhoto, GallerySection, GallerySettings } from "@/types/cms";

type GalleryPageProps = {
  entry: ContentEntry;
  layout: GalleryLayout;
  settings?: GallerySettings;
  editing?: boolean;
  selectedId?: string | null;
};

function Photo({
  photo,
  editing = false,
  selectedId,
  sectionId,
}: {
  photo: GalleryPhoto;
  editing?: boolean;
  selectedId?: string | null;
  sectionId: string;
}) {
  if (photo.hidden && !editing) return null;
  const style = {
    "--gallery-focus-x": `${photo.focalPoint.x}%`,
    "--gallery-focus-y": `${photo.focalPoint.y}%`,
  } as React.CSSProperties;
  const selected = selectedId === photo.id;
  return (
    <figure
      className={`gallery-photo gallery-photo--${photo.width} gallery-photo--${photo.emphasis} gallery-photo--${photo.alignment} gallery-photo--crop-${photo.crop}${photo.featured ? " is-featured" : ""}${photo.hidden ? " is-hidden" : ""}${selected ? " is-selected" : ""}`}
      style={style}
      draggable={editing || undefined}
      data-gallery-photo-id={editing ? photo.id : undefined}
      data-gallery-section-id={editing ? sectionId : undefined}
      role={editing ? "button" : undefined}
      tabIndex={editing ? 0 : undefined}
      aria-label={editing ? `Edit ${photo.altText || photo.asset.title}` : undefined}
    >
      <div className={`gallery-photo__frame gallery-photo__frame--${photo.crop}`}>
        <CmsImage asset={{ ...photo.asset, alt_text: photo.altText }} sizes={photo.width === "full" ? "100vw" : photo.width === "half" ? "(max-width: 740px) 100vw, 50vw" : "(max-width: 740px) 100vw, 33vw"} />
        {editing && <span className="gallery-photo__editor-label">{photo.hidden ? "Hidden" : photo.featured ? "Featured" : "Select to edit"}</span>}
      </div>
      {photo.caption && <figcaption>{photo.caption}</figcaption>}
    </figure>
  );
}

function Section({
  section,
  editing = false,
  selectedId,
}: {
  section: GallerySection;
  editing?: boolean;
  selectedId?: string | null;
}) {
  const editorAttributes = {
    draggable: editing || undefined,
    "data-gallery-section-id": editing ? section.id : undefined,
  };
  if (section.type === "text") {
    return <section className="gallery-text-block" {...editorAttributes}><p className="public-kicker">Gallery note</p><h2>{section.heading}</h2><p>{section.body}</p></section>;
  }
  if (section.type === "spacer") return <div className={`gallery-spacer gallery-spacer--${section.size}`} aria-hidden="true" {...editorAttributes} />;
  if (section.type === "divider") return <hr className="gallery-divider" {...editorAttributes} />;
  if (section.type === "quote") return <figure className="gallery-quote" {...editorAttributes}><blockquote>{section.quote}</blockquote>{section.attribution && <figcaption>{section.attribution}</figcaption>}</figure>;
  return (
    <section
      className={`gallery-image-section gallery-image-section--${section.layout}`}
      {...editorAttributes}
    >
      {section.items.map((photo) => <Photo key={photo.id} photo={photo} editing={editing} selectedId={selectedId} sectionId={section.id} />)}
      {editing && section.items.length === 0 && <div className="gallery-empty-drop">Drop photographs here</div>}
    </section>
  );
}

export function GalleryPage({ entry, layout, settings = {}, editing = false, selectedId = null }: GalleryPageProps) {
  const photos = layout.sections.flatMap((section) => section.type === "images" ? section.items : []);
  const visibleCount = photos.filter((photo) => !photo.hidden).length;
  const coverPhoto = photos.find((photo) => photo.assetId === entry.cover_asset_id);
  const coverAsset = coverPhoto?.asset ?? entry.cover_asset;
  return (
    <main id="main-content" className={`project-page gallery-page gallery-page--${layout.preset}${editing ? " gallery-page--editing" : ""}${settings.showCaptions === false ? " gallery-page--hide-captions" : ""}`}>
      <section className="project-hero gallery-hero">
        <div className="public-container">
          <Link href="/portfolio" className="public-text-link project-back">Back to portfolio</Link>
          <div className="project-hero__copy">
            <p className="public-kicker">{entry.category || "Photography"}{settings.location ? ` · ${settings.location}` : ""}</p>
            <h1>{entry.title}</h1>
            {entry.excerpt && <p>{entry.excerpt}</p>}
          </div>
          {coverAsset && <div className={`gallery-cover gallery-cover--${coverPhoto?.crop ?? "natural"}`} style={coverPhoto ? { "--gallery-focus-x": `${coverPhoto.focalPoint.x}%`, "--gallery-focus-y": `${coverPhoto.focalPoint.y}%` } as React.CSSProperties : undefined}><CmsImage asset={coverAsset} sizes="(max-width: 980px) 90vw, 900px" priority /></div>}
          {(settings.shootDate || settings.camera || settings.lens) && <dl className="gallery-meta">
            {settings.shootDate && <div><dt>Photographed</dt><dd>{settings.shootDate}</dd></div>}
            {settings.camera && <div><dt>Camera</dt><dd>{settings.camera}</dd></div>}
            {settings.lens && <div><dt>Lens</dt><dd>{settings.lens}</dd></div>}
            <div><dt>Images</dt><dd>{visibleCount}</dd></div>
          </dl>}
        </div>
      </section>
      <div className="gallery-layout public-container">
        {layout.sections.map((section) => <Section key={section.id} section={section} editing={editing} selectedId={selectedId} />)}
        {!layout.sections.length && <div className="gallery-public-empty">{editing ? "Drag photographs into the page to begin." : "This gallery is being prepared."}</div>}
      </div>
      {!editing && <CtaBanner heading={`Have a ${(entry.category || "photography").toLowerCase()} project in mind?`} />}
    </main>
  );
}
