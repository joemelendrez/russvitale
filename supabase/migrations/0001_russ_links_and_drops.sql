-- Song links fixed from the site, and the newest drops, for russvitale.com.
-- First lived in the handoffhero Supabase project, so
-- every object is prefixed russ_ to stay apart from Handoff Hero's tables.
-- Anyone can read both. Only signed-in accounts whose email is in `russ_admins`
-- can write, enforced here by RLS (the site has no server-side key).

create table public.russ_admins (
  email text primary key check (email = lower(email))
);
alter table public.russ_admins enable row level security;
-- No policies: nobody reads or writes this table through the API.
-- Add an editor with: insert into public.russ_admins (email) values ('someone@example.com');

create or replace function public.russ_is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.russ_admins
    where email = lower(auth.jwt() ->> 'email')
  );
$$;
revoke all on function public.russ_is_admin() from public;
grant execute on function public.russ_is_admin() to anon, authenticated;

-- A Spotify album or track for a release in src/data, keyed by releaseKey().
create table public.russ_release_links (
  release_key text primary key check (char_length(release_key) <= 120),
  kind text not null check (kind in ('album', 'track')),
  spotify_id text not null check (spotify_id ~ '^[A-Za-z0-9]{22}$'),
  updated_at timestamptz not null default now()
);
alter table public.russ_release_links enable row level security;
create policy "Anyone can read links" on public.russ_release_links
  for select to anon, authenticated using (true);
create policy "Admins add links" on public.russ_release_links
  for insert to authenticated with check (public.russ_is_admin());
create policy "Admins change links" on public.russ_release_links
  for update to authenticated using (public.russ_is_admin()) with check (public.russ_is_admin());
create policy "Admins remove links" on public.russ_release_links
  for delete to authenticated using (public.russ_is_admin());

-- New releases. They join the Singles timeline under their year, and the
-- newest one with show_banner on slides down as a "New drop" bar.
create table public.russ_drops (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 120),
  kind text check (kind in ('album', 'track')),
  spotify_id text check (spotify_id ~ '^[A-Za-z0-9]{22}$'),
  note text check (char_length(note) <= 200),
  released_on date not null default current_date,
  show_banner boolean not null default true,
  created_at timestamptz not null default now(),
  check ((kind is null) = (spotify_id is null))
);
alter table public.russ_drops enable row level security;
create policy "Anyone can read drops" on public.russ_drops
  for select to anon, authenticated using (true);
create policy "Admins add drops" on public.russ_drops
  for insert to authenticated with check (public.russ_is_admin());
create policy "Admins change drops" on public.russ_drops
  for update to authenticated using (public.russ_is_admin()) with check (public.russ_is_admin());
create policy "Admins remove drops" on public.russ_drops
  for delete to authenticated using (public.russ_is_admin());

create index russ_drops_released_on_idx on public.russ_drops (released_on desc);

grant select on public.russ_release_links, public.russ_drops to anon, authenticated;
grant insert, update, delete on public.russ_release_links, public.russ_drops to authenticated;

insert into public.russ_admins (email) values
  ('habitnova.co@gmail.com'),
  ('josephmelendrez01@gmail.com');
