import Link from "next/link";
import { CtaBanner } from "@/components/public/cta-banner";
import { CmsImage } from "@/components/cms/cms-image";
import { galleryPhotoOrientation, normalizeGalleryLayout, normalizeGalleryPhoto } from "@/lib/gallery-layout";
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
  const displayPhoto = normalizeGalleryPhoto(photo);
  if (displayPhoto.hidden && !editing) return null;
  const style = {
    "--gallery-focus-x": `${displayPhoto.focalPoint.x}%`,
    "--gallery-focus-y": `${displayPhoto.focalPoint.y}%`,
    "--gallery-slot-desktop-width": displayPhoto.slotDimensions?.desktopWidth,
    "--gallery-slot-tablet-width": displayPhoto.slotDimensions?.tabletWidth,
    "--gallery-slot-mobile-width": displayPhoto.slotDimensions?.mobileWidth,
    "--gallery-slot-aspect-ratio": displayPhoto.slotDimensions?.aspectRatio,
    "--gallery-photo-natural-aspect-ratio": displayPhoto.asset.width && displayPhoto.asset.height
      ? displayPhoto.asset.width / displayPhoto.asset.height
      : displayPhoto.slotDimensions?.aspectRatio,
    "--gallery-manual-zoom": displayPhoto.manualCrop?.zoom ?? 1,
    "--gallery-manual-x": `${displayPhoto.manualCrop?.x ?? 0}%`,
    "--gallery-manual-y": `${displayPhoto.manualCrop?.y ?? 0}%`,
  } as React.CSSProperties;
  const selected = selectedId === displayPhoto.id;
  const orientation = galleryPhotoOrientation(displayPhoto);
  const locked = displayPhoto.templateLocked === true;
  const fitMode = displayPhoto.fitMode ?? "contain";
  const displayCrop = fitMode === "manual" ? "cover" : "natural";
  const editorLabel = locked
    ? displayPhoto.replacementAssetId ? "Your Photo" : displayPhoto.referenceAssetId ? "Reference" : "Empty"
    : displayPhoto.hidden ? "Hidden" : displayPhoto.featured ? "Featured" : "Select to edit";
  return (
    <figure
      className={`gallery-photo gallery-photo--size-${displayPhoto.size} gallery-photo--${orientation} gallery-photo--${displayPhoto.alignment} gallery-photo--crop-${displayCrop}${locked ? ` gallery-photo--slot-locked gallery-photo--fit-${fitMode}` : ""}${displayPhoto.featured ? " is-featured" : ""}${displayPhoto.hidden ? " is-hidden" : ""}${selected ? " is-selected" : ""}`}
      style={style}
      draggable={editing && !locked || undefined}
      data-size={displayPhoto.size}
      data-orientation={orientation}
      data-slot-id={displayPhoto.slotId}
      data-slot-locked={locked ? "true" : "false"}
      data-fit-mode={locked ? fitMode : undefined}
      data-gallery-photo-id={editing ? displayPhoto.id : undefined}
      data-gallery-section-id={editing ? sectionId : undefined}
      role={editing ? "button" : undefined}
      tabIndex={editing ? 0 : undefined}
      aria-label={editing ? `Edit Photo: ${displayPhoto.altText || displayPhoto.asset.title}` : undefined}
    >
      <div className={`gallery-photo__frame gallery-photo__frame--${displayCrop}${locked ? " gallery-photo__frame--slot" : ""}`}>
        <CmsImage asset={{ ...displayPhoto.asset, alt_text: displayPhoto.altText }} sizes={displayPhoto.size === "full" ? "100vw" : "(max-width: 740px) 92vw, 760px"} />
        {editing && <span className="gallery-photo__editor-label">{editorLabel}</span>}
        {editing && <span className="gallery-photo__edit-affordance">Edit Photo</span>}
      </div>
      {displayPhoto.caption && <figcaption>{displayPhoto.caption}</figcaption>}
    </figure>
  );
}

function Section({
  section,
  editing = false,
  selectedId,
  templateMode = false,
}: {
  section: GallerySection;
  editing?: boolean;
  selectedId?: string | null;
  templateMode?: boolean;
}) {
  const editorAttributes = {
    draggable: editing && !templateMode || undefined,
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
  const normalizedLayout = normalizeGalleryLayout(layout);
  const photos = normalizedLayout.sections.flatMap((section) => section.type === "images" ? section.items : []);
  const visibleCount = photos.filter((photo) => !photo.hidden).length;
  const coverPhoto = photos.find((photo) => photo.assetId === entry.cover_asset_id);
  const coverAsset = coverPhoto?.asset ?? entry.cover_asset;
  const coverOrientation = coverPhoto
    ? galleryPhotoOrientation(coverPhoto)
    : coverAsset?.width && coverAsset?.height && coverAsset.height > coverAsset.width ? "portrait" : "landscape";
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
          {coverAsset && <div className={`gallery-cover gallery-cover--${coverPhoto?.fitMode === "manual" ? "cover" : "natural"} gallery-cover--${coverOrientation}`} style={coverPhoto ? {
            "--gallery-manual-zoom": coverPhoto.manualCrop?.zoom ?? 1,
            "--gallery-manual-x": `${coverPhoto.manualCrop?.x ?? 0}%`,
            "--gallery-manual-y": `${coverPhoto.manualCrop?.y ?? 0}%`,
          } as React.CSSProperties : undefined}><CmsImage asset={coverAsset} sizes="(max-width: 740px) 92vw, 760px" priority /></div>}
          {(settings.shootDate || settings.camera || settings.lens) && <dl className="gallery-meta">
            {settings.shootDate && <div><dt>Photographed</dt><dd>{settings.shootDate}</dd></div>}
            {settings.camera && <div><dt>Camera</dt><dd>{settings.camera}</dd></div>}
            {settings.lens && <div><dt>Lens</dt><dd>{settings.lens}</dd></div>}
            <div><dt>Images</dt><dd>{visibleCount}</dd></div>
          </dl>}
        </div>
      </section>
      <div className="gallery-layout public-container">
        {normalizedLayout.sections.map((section) => <Section key={section.id} section={section} editing={editing} selectedId={selectedId} templateMode={normalizedLayout.mode === "template"} />)}
        {!normalizedLayout.sections.length && <div className="gallery-public-empty">{editing ? "Drag photographs into the page to begin." : "This gallery is being prepared."}</div>}
      </div>
      {!editing && <CtaBanner heading={`Have a ${(entry.category || "photography").toLowerCase()} project in mind?`} />}
    </main>
  );
}
