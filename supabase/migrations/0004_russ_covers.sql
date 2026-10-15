-- Cover art an admin uploads from edit mode. Images live in the public
-- russ-covers bucket; russ_release_links.cover_url points at one of them.

alter table public.russ_release_links
  add column if not exists cover_url text
  check (cover_url is null or cover_url like 'https://eljtjrcjyxmqkkruaucl.supabase.co/storage/v1/object/public/russ-covers/%');

-- A row may now hold only a cover.
alter table public.russ_release_links drop constraint if exists russ_release_links_players;
alter table public.russ_release_links add constraint russ_release_links_players check (
  (kind is null) = (spotify_id is null)
  and (youtube_kind is null) = (youtube_id is null)
  and (spotify_id is null or soundcloud_url is null)
  and (spotify_id is not null or soundcloud_url is not null or youtube_id is not null or cover_url is not null)
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('russ-covers', 'russ-covers', true, 2097152, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do update set public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

-- Anyone can read covers (public bucket); only Russ-site admins write them.
drop policy if exists "russ covers admin insert" on storage.objects;
create policy "russ covers admin insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'russ-covers' and public.russ_is_admin());
drop policy if exists "russ covers admin update" on storage.objects;
create policy "russ covers admin update" on storage.objects for update to authenticated
  using (bucket_id = 'russ-covers' and public.russ_is_admin())
  with check (bucket_id = 'russ-covers' and public.russ_is_admin());
drop policy if exists "russ covers admin delete" on storage.objects;
create policy "russ covers admin delete" on storage.objects for delete to authenticated
  using (bucket_id = 'russ-covers' and public.russ_is_admin());
