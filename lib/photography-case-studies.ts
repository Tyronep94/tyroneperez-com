export const photographyCaseStudyEditors = [
  { slug: "graduation-in-motion", label: "Graduation in Motion" },
  { slug: "quiet-confidence", label: "Engagement" },
  { slug: "gathered-together", label: "Street Photography" },
] as const;

export type PhotographyCaseStudySlug = (typeof photographyCaseStudyEditors)[number]["slug"];
export const photographyCaseStudyMediaPositions = [
  "project-media",
  "supporting-media-1",
  "supporting-media-2",
] as const;
export type PhotographyCaseStudyMediaPosition = (typeof photographyCaseStudyMediaPositions)[number];

export function isPhotographyCaseStudySlug(value: string): value is PhotographyCaseStudySlug {
  return photographyCaseStudyEditors.some((item) => item.slug === value);
}

export function photographyCaseStudySlotNamespace(slug: PhotographyCaseStudySlug) {
  return `photography.case-study.${slug}`;
}

export function photographyCaseStudyMediaSlotId(
  slug: PhotographyCaseStudySlug,
  position: PhotographyCaseStudyMediaPosition = "project-media",
) {
  return `${photographyCaseStudySlotNamespace(slug)}.${position}`;
}

export function isPhotographyCaseStudyMediaSlot(slotId?: string) {
  return photographyCaseStudyEditors.some((item) =>
    photographyCaseStudyMediaPositions.some(
      (position) => photographyCaseStudyMediaSlotId(item.slug, position) === slotId,
    ));
}
