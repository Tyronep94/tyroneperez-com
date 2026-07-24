"use client";

import type { DragEvent, KeyboardEvent, MouseEvent } from "react";
import { GalleryPage } from "@/components/public/gallery-page";
import type { ContentEntry, GalleryLayout, GallerySettings } from "@/types/cms";

type Props = {
  entry: ContentEntry;
  layout: GalleryLayout;
  settings: GallerySettings;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDropPhoto: (sectionId: string, beforeId?: string) => void;
  onDragPhoto: (id: string) => void;
  onDragSection: (id: string) => void;
};

function elementTarget(target: EventTarget | null) {
  return target instanceof Element ? target : null;
}

export function GalleryEditorPreview({
  entry,
  layout,
  settings,
  selectedId,
  onSelect,
  onDropPhoto,
  onDragPhoto,
  onDragSection,
}: Props) {
  const selectTarget = (target: EventTarget | null) => {
    const photo = elementTarget(target)?.closest<HTMLElement>("[data-gallery-photo-id]");
    if (photo?.dataset.galleryPhotoId) onSelect(photo.dataset.galleryPhotoId);
  };

  const handleDragStart = (event: DragEvent<HTMLDivElement>) => {
    const target = elementTarget(event.target);
    const photo = target?.closest<HTMLElement>("[data-gallery-photo-id]");
    if (photo?.dataset.galleryPhotoId) {
      event.stopPropagation();
      event.dataTransfer.effectAllowed = "move";
      onDragPhoto(photo.dataset.galleryPhotoId);
      return;
    }
    const section = target?.closest<HTMLElement>("[data-gallery-section-id]");
    if (section?.dataset.gallerySectionId) {
      event.dataTransfer.effectAllowed = "move";
      onDragSection(section.dataset.gallerySectionId);
    }
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const target = elementTarget(event.target);
    const photo = target?.closest<HTMLElement>("[data-gallery-photo-id]");
    const section = target?.closest<HTMLElement>("[data-gallery-section-id]");
    const sectionId = photo?.dataset.gallerySectionId ?? section?.dataset.gallerySectionId;
    if (!sectionId) return;
    onDropPhoto(sectionId, photo?.dataset.galleryPhotoId);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    const photo = elementTarget(event.target)?.closest<HTMLElement>("[data-gallery-photo-id]");
    if (!photo?.dataset.galleryPhotoId) return;
    event.preventDefault();
    onSelect(photo.dataset.galleryPhotoId);
  };

  return (
    <div
      className="gallery-editor-interactions"
      onClick={(event: MouseEvent<HTMLDivElement>) => selectTarget(event.target)}
      onKeyDown={handleKeyDown}
      onDragStart={handleDragStart}
      onDragOver={(event) => event.preventDefault()}
      onDrop={handleDrop}
    >
      <GalleryPage entry={entry} layout={layout} settings={settings} editing selectedId={selectedId} />
    </div>
  );
}
