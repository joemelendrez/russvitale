-- Songs by other artists that Russ is featured on, added and edited from
-- /admin. A feature drop carries its lead artists. One with `replaces` set
-- stands in for the built-in feature of that title (src/data/features.js),
-- and `hidden` takes that built-in off the site.
alter table public.russ_drops
  add column if not exists artist text
    check (artist is null or char_length(artist) between 1 and 160),
  add column if not exists replaces text
    check (replaces is null or char_length(replaces) between 1 and 120),
  add column if not exists hidden boolean not null default false;

alter table public.russ_drops drop constraint if exists russ_drops_release_type_check;
alter table public.russ_drops add constraint russ_drops_release_type_check
  check (release_type in ('single', 'ep', 'album', 'version', 'feature'));

alter table public.russ_drops drop constraint if exists russ_drops_feature_artist;
alter table public.russ_drops add constraint russ_drops_feature_artist
  check ((release_type = 'feature') = (artist is not null));

alter table public.russ_drops drop constraint if exists russ_drops_feature_only;
alter table public.russ_drops add constraint russ_drops_feature_only
  check (release_type = 'feature' or (replaces is null and not hidden));
