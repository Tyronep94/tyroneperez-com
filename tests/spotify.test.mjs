import assert from "node:assert/strict";
import test from "node:test";
import {
  buildSpotifyEmbedUrl,
  isApprovedSpotifyUrl,
  parseOpenSpotifyUrl,
  parseSpotifyEmbedUrl,
  sanitizeSpotifyThumbnail,
  spotifyEntityFromOEmbedHtml,
  spotifyPlayerHeight,
} from "../lib/spotify.ts";

const id = "4uLU6hMCjMI75M1A2tKUQC";

for (const type of ["track", "album", "playlist", "artist", "show", "episode"]) {
  test(`accepts and parses a Spotify ${type} URL`, () => {
    const input = `https://open.spotify.com/${type}/${id}?si=shared`;
    assert.equal(isApprovedSpotifyUrl(input), true);
    assert.deepEqual(parseOpenSpotifyUrl(input), {
      type,
      id,
      embedUrl: `https://open.spotify.com/embed/${type}/${id}`,
    });
  });
}

test("accepts localized open.spotify.com URLs", () => {
  assert.equal(parseOpenSpotifyUrl(`https://open.spotify.com/intl-es/track/${id}`)?.id, id);
});

test("accepts spotify.link shares for server-side oEmbed resolution", () => {
  assert.equal(isApprovedSpotifyUrl("https://spotify.link/AbCdEf123"), true);
  assert.equal(parseOpenSpotifyUrl("https://spotify.link/AbCdEf123"), null);
});

test("rejects non-HTTPS, unapproved, malformed, and iframe URLs", () => {
  const invalid = [
    `http://open.spotify.com/track/${id}`,
    `https://evil.example/track/${id}`,
    `https://open.spotify.com/embed/track/${id}`,
    "https://open.spotify.com/track/not-an-id",
    "javascript:alert(1)",
    "https://spotify.link/",
  ];
  for (const value of invalid) assert.equal(isApprovedSpotifyUrl(value), false, value);
});

test("derives entity data from Spotify oEmbed HTML without rendering it", () => {
  const html = `<iframe src="https://open.spotify.com/embed/episode/${id}?utm_source=oembed" allow="autoplay"></iframe>`;
  assert.deepEqual(spotifyEntityFromOEmbedHtml(html), {
    type: "episode",
    id,
    embedUrl: `https://open.spotify.com/embed/episode/${id}`,
  });
});

test("rejects an unapproved iframe source returned in HTML", () => {
  assert.equal(spotifyEntityFromOEmbedHtml(`<iframe src="https://evil.example/embed/track/${id}"></iframe>`), null);
});

test("constructs canonical embed URLs with no autoplay parameter", () => {
  const embed = buildSpotifyEmbedUrl("track", id);
  assert.equal(embed, `https://open.spotify.com/embed/track/${id}`);
  assert.equal(new URL(embed).searchParams.has("autoplay"), false);
  assert.deepEqual(parseSpotifyEmbedUrl(embed), { type: "track", id, embedUrl: embed });
});

test("uses compact height only for tracks and episodes", () => {
  assert.equal(spotifyPlayerHeight("track"), 152);
  assert.equal(spotifyPlayerHeight("episode"), 152);
  assert.equal(spotifyPlayerHeight("album"), 352);
});

test("allows only Spotify CDN thumbnails", () => {
  assert.equal(sanitizeSpotifyThumbnail("https://i.scdn.co/image/example"), "https://i.scdn.co/image/example");
  assert.equal(sanitizeSpotifyThumbnail("https://images.example/cover.jpg"), null);
  assert.equal(sanitizeSpotifyThumbnail("http://i.scdn.co/image/example"), null);
});
