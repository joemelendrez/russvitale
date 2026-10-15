-- Songs added from the admin wizard can be singles, EPs, albums or another
-- version of a song (Slow, Nasty, Sped Up...). Older rows stay singles.
alter table public.russ_drops
  add column if not exists release_type text not null default 'single'
    check (release_type in ('single', 'ep', 'album', 'version')),
  add column if not exists version_of text
    check (version_of is null or char_length(version_of) between 1 and 120);

alter table public.russ_drops drop constraint if exists russ_drops_version_of;
alter table public.russ_drops add constraint russ_drops_version_of
  check ((release_type = 'version') = (version_of is not null));
