export const spotifyEntityTypes = ["track", "album", "playlist", "artist", "show", "episode"] as const;

export type SpotifyEntityType = (typeof spotifyEntityTypes)[number];

export type SpotifyEntity = {
  type: SpotifyEntityType;
  id: string;
  embedUrl: string;
};

const entityTypeSet = new Set<string>(spotifyEntityTypes);
const spotifyIdPattern = /^[A-Za-z0-9]{10,64}$/;

function parseUrl(value: string) {
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:" || url.username || url.password || (url.port && url.port !== "443")) return null;
    return url;
  } catch {
    return null;
  }
}

export function isApprovedSpotifyUrl(value: string) {
  const url = parseUrl(value);
  if (!url) return false;
  if (url.hostname === "spotify.link") return url.pathname.length > 1;
  return url.hostname === "open.spotify.com" && Boolean(parseOpenSpotifyUrl(value));
}

export function parseOpenSpotifyUrl(value: string): SpotifyEntity | null {
  const url = parseUrl(value);
  if (!url || url.hostname !== "open.spotify.com") return null;
  const parts = url.pathname.split("/").filter(Boolean);
  const offset = parts[0]?.toLowerCase().startsWith("intl-") ? 1 : 0;
  const type = parts[offset];
  const id = parts[offset + 1];
  if (parts.length !== offset + 2 || !entityTypeSet.has(type) || !spotifyIdPattern.test(id ?? "")) return null;
  return {
    type: type as SpotifyEntityType,
    id,
    embedUrl: buildSpotifyEmbedUrl(type as SpotifyEntityType, id),
  };
}

export function parseSpotifyEmbedUrl(value: string): SpotifyEntity | null {
  const url = parseUrl(value);
  if (!url || url.hostname !== "open.spotify.com") return null;
  const parts = url.pathname.split("/").filter(Boolean);
  if (parts.length !== 3 || parts[0] !== "embed" || !entityTypeSet.has(parts[1]) || !spotifyIdPattern.test(parts[2])) return null;
  return {
    type: parts[1] as SpotifyEntityType,
    id: parts[2],
    embedUrl: buildSpotifyEmbedUrl(parts[1] as SpotifyEntityType, parts[2]),
  };
}

export function buildSpotifyEmbedUrl(type: SpotifyEntityType, id: string) {
  if (!entityTypeSet.has(type) || !spotifyIdPattern.test(id)) throw new Error("Invalid Spotify entity.");
  return `https://open.spotify.com/embed/${type}/${id}`;
}

export function spotifyEntityFromOEmbedHtml(html: string) {
  const match = html.match(/\bsrc=(?:"([^"]+)"|'([^']+)')/i);
  return match ? parseSpotifyEmbedUrl(match[1] ?? match[2] ?? "") : null;
}

export function sanitizeSpotifyThumbnail(value: unknown) {
  if (typeof value !== "string") return null;
  const url = parseUrl(value);
  if (!url) return null;
  if (url.hostname === "i.scdn.co" || url.hostname.endsWith(".scdn.co")) return url.toString();
  return null;
}

export function spotifyPlayerHeight(type: SpotifyEntityType) {
  return type === "track" || type === "episode" ? 152 : 352;
}
