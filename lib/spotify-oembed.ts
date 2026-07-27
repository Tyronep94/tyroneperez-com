import "server-only";
import {
  isApprovedSpotifyUrl,
  parseOpenSpotifyUrl,
  sanitizeSpotifyThumbnail,
  spotifyEntityFromOEmbedHtml,
  type SpotifyEntityType,
} from "@/lib/spotify";

type SpotifyOEmbedResponse = {
  provider_name?: unknown;
  type?: unknown;
  title?: unknown;
  thumbnail_url?: unknown;
  html?: unknown;
};

export type ValidatedSpotify = {
  spotify_url: string;
  spotify_entity_type: SpotifyEntityType;
  spotify_entity_id: string;
  spotify_embed_url: string;
  spotify_title: string | null;
  spotify_thumbnail_url: string | null;
};

export async function validateSpotifyUrlWithOEmbed(value: string): Promise<
  { ok: true; data: ValidatedSpotify } | { ok: false; message: string }
> {
  const spotifyUrl = value.trim();
  if (!isApprovedSpotifyUrl(spotifyUrl)) {
    return { ok: false, message: "Enter a valid HTTPS Spotify link from open.spotify.com or spotify.link." };
  }

  let response: Response;
  try {
    const endpoint = new URL("https://open.spotify.com/oembed");
    endpoint.searchParams.set("url", spotifyUrl);
    response = await fetch(endpoint, {
      cache: "no-store",
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(8_000),
    });
  } catch {
    return { ok: false, message: "Spotify could not validate this link. Please try again." };
  }

  if (!response.ok) {
    return {
      ok: false,
      message: response.status === 404
        ? "This Spotify item is unavailable or the link is not supported."
        : "Spotify could not validate this link. Please try again.",
    };
  }

  let body: SpotifyOEmbedResponse;
  try {
    body = await response.json() as SpotifyOEmbedResponse;
  } catch {
    return { ok: false, message: "Spotify returned an invalid response. Please try again." };
  }

  if (body.provider_name !== "Spotify" || body.type !== "rich" || typeof body.html !== "string") {
    return { ok: false, message: "This link is not a supported Spotify player." };
  }

  const entity = spotifyEntityFromOEmbedHtml(body.html) ?? parseOpenSpotifyUrl(spotifyUrl);
  if (!entity) return { ok: false, message: "Spotify did not return a supported player for this link." };

  return {
    ok: true,
    data: {
      spotify_url: spotifyUrl,
      spotify_entity_type: entity.type,
      spotify_entity_id: entity.id,
      spotify_embed_url: entity.embedUrl,
      spotify_title: typeof body.title === "string" ? body.title.trim().slice(0, 240) || null : null,
      spotify_thumbnail_url: sanitizeSpotifyThumbnail(body.thumbnail_url),
    },
  };
}
