-- A fan's top 10 on their account, and public favorite counts.

-- Their top 10 release keys, number 1 first, next to their favorites.
alter table public.russ_favorites
  add column if not exists top10 jsonb not null default '[]'::jsonb
  check (jsonb_typeof(top10) = 'array' and jsonb_array_length(top10) <= 10);

-- How many signed-in fans have each release in their favorites. Totals only,
-- never who; a release shows once at least p_min (never under 3) fans have it,
-- so a count can't point at one person. Favorites kept only on a device
-- aren't counted.
create or replace function public.russ_favorite_counts(p_min integer default 5)
returns table (release_key text, fans integer)
language sql
stable
security definer
set search_path = ''
as $$
  select k.value as release_key, count(distinct f.user_id)::integer as fans
  from public.russ_favorites f
  cross join lateral jsonb_array_elements_text(f.keys) as k(value)
  group by k.value
  having count(distinct f.user_id) >= greatest(coalesce(p_min, 5), 3)
  order by fans desc, release_key
  limit 500;
$$;
revoke all on function public.russ_favorite_counts(integer) from public;
grant execute on function public.russ_favorite_counts(integer) to anon, authenticated;
