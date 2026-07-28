import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Featured Sound image uses an explicit managed media slot and preserves its placeholder", async () => {
  const source = await read("components/public/featured-sound-image.tsx");
  assert.match(source, /music\.featured-sound\.image/);
  assert.match(source, /data-page-media-type="image"/);
  assert.match(source, /data-page-media-managed="true"/);
  assert.match(source, /\/images\/home-hero\.png/);
  assert.match(source, /document\?\.slots\[featuredSoundImageSlotId\]/);
});

test("Featured Sound image routes to image controls while sound buttons remain audio-only", async () => {
  const source = await read("components/cms/website-page-editor.tsx");
  assert.match(source, /selected\.id === "music\.featured-sound\.image"/);
  assert.match(source, /selected\.id !== "music\.featured-sound\.image"/);
  assert.match(source, /imageOnly=\{selectedIsFeaturedSoundImage \|\| selectedIsAboutPortrait\}/);
  assert.match(source, /audioOnly=\{selectedIsFeaturedSoundAudio\}/);
});

test("shared portrait-style media controls expose library, upload, alt text, and restore", async () => {
  const source = await read("components/cms/website-slot-media-controls.tsx");
  for (const label of ["Current image", "Replace image", "Media Library", "Upload image", "Alt text", "Restore placeholder"]) {
    assert.ok(source.includes(label), `${label} control is missing`);
  }
  assert.match(source, /chooseImage\(asset\)/);
  assert.match(source, /registerMedia\(/);
  assert.match(source, /onRestore/);
});
