-- YouTube Music links, for listeners who pick YouTube Music over Spotify.
-- They sit next to a release's Spotify or SoundCloud link instead of
-- replacing it, so a saved row may now hold only a YouTube link.

alter table public.russ_release_links
  add column youtube_kind text check (youtube_kind in ('video', 'playlist')),
  add column youtube_id text check (youtube_id ~ '^[A-Za-z0-9_-]{10,64}$'),
  drop constraint russ_release_links_one_player,
  add constraint russ_release_links_players check (
    (kind is null) = (spotify_id is null)
    and (youtube_kind is null) = (youtube_id is null)
    and (spotify_id is null or soundcloud_url is null)
    and (spotify_id is not null or soundcloud_url is not null or youtube_id is not null)
  );

alter table public.russ_drops
  add column youtube_kind text check (youtube_kind in ('video', 'playlist')),
  add column youtube_id text check (youtube_id ~ '^[A-Za-z0-9_-]{10,64}$'),
  add constraint russ_drops_youtube_pair check ((youtube_kind is null) = (youtube_id is null));
