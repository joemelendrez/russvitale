-- SoundCloud links for releases Spotify doesn't carry. A saved link or a drop
-- plays from Spotify or from SoundCloud, never both.

alter table public.russ_release_links
  alter column kind drop not null,
  alter column spotify_id drop not null,
  add column soundcloud_url text check (
    char_length(soundcloud_url) <= 300
    and soundcloud_url ~ '^https://(on\.)?soundcloud\.com/[A-Za-z0-9_/-]+$'
  ),
  add constraint russ_release_links_one_player check (
    (kind is null) = (spotify_id is null)
    and (spotify_id is null) <> (soundcloud_url is null)
  );

alter table public.russ_drops
  add column soundcloud_url text check (
    char_length(soundcloud_url) <= 300
    and soundcloud_url ~ '^https://(on\.)?soundcloud\.com/[A-Za-z0-9_/-]+$'
  ),
  add constraint russ_drops_one_player check (spotify_id is null or soundcloud_url is null);
