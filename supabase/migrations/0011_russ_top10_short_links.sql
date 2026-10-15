-- Short share links for a top 10: russvitale.com/t/<code> instead of the
-- whole list of release keys in the URL.

create table if not exists public.russ_top10_links (
  code text primary key check (code ~ '^[A-Za-z0-9]{6,12}$'),
  keys jsonb not null unique check (jsonb_typeof(keys) = 'array' and jsonb_array_length(keys) between 1 and 10),
  created_at timestamptz not null default now()
);

-- A list is just release keys and a random code, so anyone may read one.
-- Nobody writes directly; russ_top10_link() is the only way in.
alter table public.russ_top10_links enable row level security;
create policy "Anyone reads top 10 links" on public.russ_top10_links for select to anon, authenticated using (true);

-- The code for a list: the same list always gets the same code, a new one
-- gets a random 7-character code. Keys are checked for shape only; the site
-- skips any it doesn't know when it shows the list.
create or replace function public.russ_top10_link(p_keys text[])
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_keys jsonb;
  v_code text;
  v_chars constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  i integer;
begin
  if p_keys is null or cardinality(p_keys) not between 1 and 10 then
    raise exception 'A top 10 has 1 to 10 songs';
  end if;
  if exists (select 1 from unnest(p_keys) k where k !~ '^[a-z]+-\d{4}-[a-z0-9-]{1,80}$') then
    raise exception 'Unknown song key';
  end if;
  v_keys := to_jsonb(p_keys);

  select code into v_code from public.russ_top10_links where keys = v_keys;
  if v_code is not null then
    return v_code;
  end if;

  loop
    v_code := '';
    for i in 1..7 loop
      v_code := v_code || substr(v_chars, 1 + floor(random() * length(v_chars))::integer, 1);
    end loop;
    begin
      insert into public.russ_top10_links (code, keys) values (v_code, v_keys);
      return v_code;
    exception when unique_violation then
      -- Same list saved at the same moment, or a code clash: reuse or retry.
      select code into v_code from public.russ_top10_links where keys = v_keys;
      if v_code is not null then
        return v_code;
      end if;
    end;
  end loop;
end;
$$;
revoke all on function public.russ_top10_link(text[]) from public;
grant execute on function public.russ_top10_link(text[]) to anon, authenticated;
