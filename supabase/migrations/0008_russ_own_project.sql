-- The fan site now has its own Supabase project. Covers uploaded before the
-- move stay in the old project's public russ-covers bucket, so a cover may
-- point at either project's bucket.
alter table public.russ_release_links drop constraint if exists russ_release_links_cover_url_check;
alter table public.russ_release_links add constraint russ_release_links_cover_url_check check (
  cover_url is null or cover_url ~ '^https://[a-z0-9]{20}\.supabase\.co/storage/v1/object/public/russ-covers/[A-Za-z0-9._-]+$'
);
