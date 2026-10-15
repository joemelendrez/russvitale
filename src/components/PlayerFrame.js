// One embed player (Spotify, YouTube or SoundCloud) from playerFor().
export default function PlayerFrame({ player, title, className = "", lazy = false }) {
  return (
    <iframe
      key={player.key}
      title={`${title} on ${player.label}`}
      src={player.src}
      height={player.video ? undefined : player.height}
      className={`block w-full rounded-xl border-0 bg-black/60 ${player.video ? "aspect-video" : ""} ${className}`}
      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
      allowFullScreen={player.video || undefined}
      loading={lazy ? "lazy" : undefined}
    />
  );
}
