-- Release days an admin sets from edit mode. A row may now hold only a date.
alter table public.russ_release_links add column if not exists released_on date;

alter table public.russ_release_links drop constraint if exists russ_release_links_players;
alter table public.russ_release_links add constraint russ_release_links_players check (
  (kind is null) = (spotify_id is null)
  and (youtube_kind is null) = (youtube_id is null)
  and (spotify_id is null or soundcloud_url is null)
  and (spotify_id is not null or soundcloud_url is not null or youtube_id is not null or cover_url is not null or released_on is not null)
);
