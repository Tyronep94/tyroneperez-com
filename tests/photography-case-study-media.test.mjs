import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  photographyCaseStudyEditors,
  photographyCaseStudyMediaSlotId,
  photographyCaseStudySlotNamespace,
} from "../lib/photography-case-studies.ts";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("photography case studies use stable isolated project-media slots", () => {
  const slotIds = photographyCaseStudyEditors.map((item) => photographyCaseStudyMediaSlotId(item.slug));
  assert.equal(new Set(slotIds).size, 3);
  assert.deepEqual(slotIds, [
    "photography.case-study.graduation-in-motion.project-media",
    "photography.case-study.quiet-confidence.project-media",
    "photography.case-study.gathered-together.project-media",
  ]);
});

test("case-study text slots receive a slug namespace instead of landing-page positions", () => {
  assert.equal(
    photographyCaseStudySlotNamespace("quiet-confidence"),
    "photography.case-study.quiet-confidence",
  );
});

test("managed project media shares the image inspector and public publication document", async () => {
  const [placeholder, editor, publicRoute] = await Promise.all([
    read("components/public/media-placeholder.tsx"),
    read("components/cms/website-page-editor.tsx"),
    read("app/(public)/portfolio/[slug]/page.tsx"),
  ]);
  assert.match(placeholder, /data-page-media-managed=\{slotId \? "true"/);
  assert.match(placeholder, /object without cropping/);
  assert.match(editor, /selectedIsPhotographyCaseStudyImage/);
  assert.match(editor, /imageOnly=\{selectedIsFeaturedSoundImage \|\| selectedIsAboutPortrait \|\| selectedIsPhotographyCaseStudyImage\}/);
  assert.match(publicRoute, /getPublishedWebsitePage\("photography"\)/);
  assert.match(publicRoute, /editableProjectMedia/);
});
