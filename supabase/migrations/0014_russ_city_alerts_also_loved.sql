-- Show alerts by city, and "fans also love" on album pages.

-- The city a subscriber wants show news for ("Atlanta, GA"), optional.
alter table public.russ_subscribers
  add column if not exists city text check (city is null or char_length(city) between 2 and 80);

-- Same as russ_subscribe, plus the city. Someone already confirmed just gets
-- their city updated (no email goes out); everyone else gets a confirm link.
create or replace function public.russ_subscribe_city(p_email text, p_secret text, p_city text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text := lower(trim(p_email));
  v_city text := nullif(left(regexp_replace(trim(coalesce(p_city, '')), '\s+', ' ', 'g'), 80), '');
  v_row public.russ_subscribers;
begin
  if p_secret is null or p_secret is distinct from (select value from public.russ_settings where key = 'newsletter_secret') then
    raise exception 'not allowed';
  end if;
  if v_city is not null and char_length(v_city) < 2 then
    v_city := null;
  end if;
  select * into v_row from public.russ_subscribers where email = v_email;
  if found and (v_row.status = 'confirmed' or (v_row.status = 'pending' and v_row.created_at > now() - interval '10 minutes')) then
    if v_city is not null then
      update public.russ_subscribers set city = v_city where id = v_row.id;
    end if;
    return null;
  end if;
  if found then
    update public.russ_subscribers set status = 'pending', token = gen_random_uuid(), created_at = now(), city = coalesce(v_city, city)
      where id = v_row.id returning * into v_row;
    return v_row.token;
  end if;
  insert into public.russ_subscribers (email, city) values (v_email, v_city) returning * into v_row;
  return v_row.token;
end;
$$;

-- Admin: confirmed subscribers per city, for picking who to email.
create or replace function public.russ_subscriber_cities()
returns table (city text, confirmed bigint)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.russ_is_admin() then
    raise exception 'not allowed';
  end if;
  return query
    select min(s.city), count(*)
    from public.russ_subscribers s
    where s.status = 'confirmed' and s.city is not null
    group by lower(s.city)
    order by count(*) desc, min(s.city);
end;
$$;

-- Admin: confirmed subscribers in one city (matched without case).
create or replace function public.russ_newsletter_recipients_in(p_city text)
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
  return query
    select s.email, s.token from public.russ_subscribers s
    where s.status = 'confirmed' and lower(s.city) = lower(trim(p_city))
    order by s.confirmed_at;
end;
$$;

-- Releases most often favorited by fans who also favorited p_key. Totals
-- only, never who; a release shows once p_min (never under 3) such fans
-- have it, same floor as russ_favorite_counts.
create or replace function public.russ_also_loved(p_key text, p_min integer default 3)
returns table (release_key text, fans integer)
language sql
stable
security definer
set search_path = ''
as $$
  select k.value as release_key, count(distinct f.user_id)::integer as fans
  from public.russ_favorites f
  cross join lateral jsonb_array_elements_text(f.keys) as k(value)
  where f.keys ? p_key and k.value <> p_key
  group by k.value
  having count(distinct f.user_id) >= greatest(coalesce(p_min, 3), 3)
  order by fans desc, release_key
  limit 12;
$$;

revoke all on function public.russ_subscribe_city(text, text, text), public.russ_subscriber_cities(),
  public.russ_newsletter_recipients_in(text), public.russ_also_loved(text, integer) from public;
grant execute on function public.russ_subscribe_city(text, text, text), public.russ_also_loved(text, integer) to anon, authenticated;
grant execute on function public.russ_subscriber_cities(), public.russ_newsletter_recipients_in(text) to authenticated;
