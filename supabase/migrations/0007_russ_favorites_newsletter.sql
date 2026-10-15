-- Fan favorites synced to an account, and the email newsletter.

-- One row per signed-in fan: their favorite releaseKey()s in their order.
create table if not exists public.russ_favorites (
  user_id uuid primary key references auth.users (id) on delete cascade default auth.uid(),
  keys jsonb not null default '[]'::jsonb check (jsonb_typeof(keys) = 'array' and jsonb_array_length(keys) <= 1000),
  updated_at timestamptz not null default now()
);
alter table public.russ_favorites enable row level security;
create policy "Fans read their favorites" on public.russ_favorites
  for select to authenticated using (user_id = auth.uid());
create policy "Fans add their favorites" on public.russ_favorites
  for insert to authenticated with check (user_id = auth.uid());
create policy "Fans change their favorites" on public.russ_favorites
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Fans clear their favorites" on public.russ_favorites
  for delete to authenticated using (user_id = auth.uid());
grant select, insert, update, delete on public.russ_favorites to authenticated;

-- Newsletter subscribers. Nobody reads this table through the API; the
-- functions below are the only way in. `token` is the secret in the confirm
-- and unsubscribe links.
create table if not exists public.russ_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (email = lower(email) and char_length(email) between 3 and 254 and email like '%_@_%._%'),
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'unsubscribed')),
  token uuid not null unique default gen_random_uuid(),
  created_at timestamptz not null default now(),
  confirmed_at timestamptz
);
alter table public.russ_subscribers enable row level security;

-- Every newsletter sent, for the admin's history.
create table if not exists public.russ_newsletters (
  id uuid primary key default gen_random_uuid(),
  subject text not null check (char_length(subject) between 1 and 150),
  body text not null check (char_length(body) between 1 and 20000),
  recipients integer not null default 0,
  sent_at timestamptz not null default now()
);
alter table public.russ_newsletters enable row level security;
create policy "Admins read newsletters" on public.russ_newsletters
  for select to authenticated using (public.russ_is_admin());
create policy "Admins log newsletters" on public.russ_newsletters
  for insert to authenticated with check (public.russ_is_admin());
grant select, insert on public.russ_newsletters to authenticated;

-- The site's server has no service key, so the signup route proves itself
-- with a shared secret kept here and in the RUSS_NEWSLETTER_SECRET env var.
-- Without it, anyone holding the public key could get a confirm token for
-- someone else's email.
create table if not exists public.russ_settings (
  key text primary key,
  value text not null
);
alter table public.russ_settings enable row level security;
-- No policies: only the functions below read it.

-- Signup: returns the token to email (a new or still-pending address), or null
-- when there is nothing to send. An unsubscribed address starts over.
create or replace function public.russ_subscribe(p_email text, p_secret text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text := lower(trim(p_email));
  v_row public.russ_subscribers;
begin
  if p_secret is null or p_secret is distinct from (select value from public.russ_settings where key = 'newsletter_secret') then
    raise exception 'not allowed';
  end if;
  select * into v_row from public.russ_subscribers where email = v_email;
  -- Already in, or a confirm email went out in the last 10 minutes: send nothing.
  if found and (v_row.status = 'confirmed' or (v_row.status = 'pending' and v_row.created_at > now() - interval '10 minutes')) then
    return null;
  end if;
  if found then
    update public.russ_subscribers set status = 'pending', token = gen_random_uuid(), created_at = now()
      where id = v_row.id returning * into v_row;
    return v_row.token;
  end if;
  insert into public.russ_subscribers (email) values (v_email) returning * into v_row;
  return v_row.token;
end;
$$;

create or replace function public.russ_confirm_subscriber(p_token uuid)
returns boolean
language sql
security definer
set search_path = ''
as $$
  with done as (
    update public.russ_subscribers set status = 'confirmed', confirmed_at = now()
    where token = p_token and status <> 'unsubscribed' returning 1
  )
  select exists (select 1 from done);
$$;

create or replace function public.russ_unsubscribe(p_token uuid)
returns boolean
language sql
security definer
set search_path = ''
as $$
  with done as (
    update public.russ_subscribers set status = 'unsubscribed' where token = p_token returning 1
  )
  select exists (select 1 from done);
$$;

-- For admins: everyone confirmed, with their unsubscribe token.
create or replace function public.russ_newsletter_recipients()
returns table (email text, token uuid)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.russ_is_admin() then
    raise exception 'not allowed';
  end if;
  return query select s.email, s.token from public.russ_subscribers s where s.status = 'confirmed' order by s.confirmed_at;
end;
$$;

create or replace function public.russ_newsletter_stats()
returns table (confirmed bigint, pending bigint, unsubscribed bigint)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.russ_is_admin() then
    raise exception 'not allowed';
  end if;
  return query select
    count(*) filter (where status = 'confirmed'),
    count(*) filter (where status = 'pending'),
    count(*) filter (where status = 'unsubscribed')
  from public.russ_subscribers;
end;
$$;

revoke all on function public.russ_subscribe(text, text), public.russ_confirm_subscriber(uuid), public.russ_unsubscribe(uuid),
  public.russ_newsletter_recipients(), public.russ_newsletter_stats() from public;
grant execute on function public.russ_subscribe(text, text), public.russ_confirm_subscriber(uuid), public.russ_unsubscribe(uuid) to anon, authenticated;
grant execute on function public.russ_newsletter_recipients(), public.russ_newsletter_stats() to authenticated;

-- Set the secret once (not stored in the repo):
-- insert into public.russ_settings (key, value) values ('newsletter_secret', '<long random string>');
