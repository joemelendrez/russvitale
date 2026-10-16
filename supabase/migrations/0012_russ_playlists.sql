-- Fan-made Spotify playlists by mood, shown on /playlists. Admins add them
-- from /admin; everyone reads them.
create table if not exists public.russ_playlists (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 60),
  blurb text check (char_length(blurb) <= 200),
  spotify_id text not null check (spotify_id ~ '^[A-Za-z0-9]{22}$'),
  position integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.russ_playlists enable row level security;
create policy "Anyone can read playlists" on public.russ_playlists
  for select to anon, authenticated using (true);
create policy "Admins add playlists" on public.russ_playlists
  for insert to authenticated with check (public.russ_is_admin());
create policy "Admins change playlists" on public.russ_playlists
  for update to authenticated using (public.russ_is_admin()) with check (public.russ_is_admin());
create policy "Admins remove playlists" on public.russ_playlists
  for delete to authenticated using (public.russ_is_admin());

grant select on public.russ_playlists to anon, authenticated;
grant insert, update, delete on public.russ_playlists to authenticated;
