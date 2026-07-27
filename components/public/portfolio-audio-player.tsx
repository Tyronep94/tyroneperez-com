import type { MediaAsset, PortfolioAudioMedia } from "@/types/cms";
import { spotifyPlayerHeight } from "@/lib/spotify";

type Props = {
  media: PortfolioAudioMedia;
  audioAsset?: MediaAsset | null;
  className?: string;
};

export function PortfolioAudioPlayer({ media, audioAsset, className = "" }: Props) {
  if (media.media_type === "uploaded_audio") {
    if (!audioAsset?.public_url) return null;
    return (
      <section className={`portfolio-audio-card ${className}`.trim()} aria-label="Audio player">
        <div className="portfolio-audio-card__copy">
          {media.audio_role && <p>{media.audio_role}</p>}
          {media.audio_title && <h2>{media.audio_title}</h2>}
          {media.audio_caption && <span>{media.audio_caption}</span>}
        </div>
        <audio controls preload="metadata" src={audioAsset.public_url}>
          <a href={audioAsset.public_url}>Download or open the audio file</a>
        </audio>
      </section>
    );
  }

  if (media.media_type !== "spotify" || !media.spotify_embed_url || !media.spotify_url || !media.spotify_entity_type) return null;
  const title = media.audio_title || media.spotify_title || "Spotify Player";
  return (
    <section className={`portfolio-audio-card portfolio-audio-card--spotify ${className}`.trim()} aria-label={title}>
      {(media.audio_role || media.audio_title || media.audio_caption) && (
        <div className="portfolio-audio-card__copy">
          {media.audio_role && <p>{media.audio_role}</p>}
          {media.audio_title && <h2>{media.audio_title}</h2>}
          {media.audio_caption && <span>{media.audio_caption}</span>}
        </div>
      )}
      <div className="spotify-player">
        <iframe
          src={media.spotify_embed_url}
          title={title}
          width="100%"
          height={spotifyPlayerHeight(media.spotify_entity_type)}
          loading="lazy"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          referrerPolicy="strict-origin-when-cross-origin"
        />
        <a href={media.spotify_url} target="_blank" rel="noreferrer">Open in Spotify</a>
      </div>
    </section>
  );
}
