/*
  Postal facts and Quick Mistri serviceability configuration.

  postal_pincodes and post_offices are populated by the India Post API importer.
  serviceable_pincodes is business configuration and is intentionally separate
  from official postal facts.
*/

create table if not exists public.postal_pincodes (
  pincode text primary key check (pincode ~ '^[0-9]{6}$'),
  district text not null,
  state text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.post_offices (
  id bigint generated always as identity primary key,
  pincode text not null references public.postal_pincodes(pincode) on delete cascade,
  name text not null,
  office_type text,
  block text,
  district text not null,
  state text not null,
  latitude double precision,
  longitude double precision,
  source text not null,
  source_version text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (pincode, name, office_type)
);

create index if not exists postal_pincodes_district_idx
  on public.postal_pincodes (district);
create index if not exists post_offices_pincode_idx
  on public.post_offices (pincode);

create table if not exists public.serviceable_pincodes (
  pincode text primary key check (pincode ~ '^[0-9]{6}$'),
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.postal_data_imports (
  id bigint generated always as identity primary key,
  source text not null,
  source_version text not null,
  imported_at timestamptz not null default now(),
  records_processed integer not null default 0,
  pincodes_upserted integer not null default 0,
  post_offices_upserted integer not null default 0,
  records_rejected integer not null default 0,
  rejection_report jsonb not null default '[]'::jsonb
);

alter table public.postal_pincodes enable row level security;
alter table public.post_offices enable row level security;
alter table public.serviceable_pincodes enable row level security;
alter table public.postal_data_imports enable row level security;

drop policy if exists "Public can read postal pincodes" on public.postal_pincodes;
create policy "Public can read postal pincodes"
  on public.postal_pincodes for select to anon, authenticated using (true);

drop policy if exists "Public can read post offices" on public.post_offices;
create policy "Public can read post offices"
  on public.post_offices for select to anon, authenticated using (true);

drop policy if exists "Public can read serviceable pincodes" on public.serviceable_pincodes;
create policy "Public can read serviceable pincodes"
  on public.serviceable_pincodes for select to anon, authenticated using (enabled = true);

-- Business scope only. Postal facts are supplied by the India Post importer.
insert into public.serviceable_pincodes (pincode)
values
  ('842001'),('842002'),('842003'),('842004'),('842005'),('843101'),('843102'),('843103'),('843104'),('843105'),('843106'),('843107'),('843108'),('843109'),('843110'),('843111'),('843112'),('843113'),('843115'),('843116'),('843117'),('843118'),('843119'),('843120'),('843121'),('843122'),('843123'),('843125'),('843126'),('843127'),('843128'),('843129'),('843132'),('843133'),('843139'),('843141'),('843143'),('843144'),('843146'),('843147'),('843152'),('843153'),('843161'),('843162'),('843165'),('843312'),('844111'),('844112'),('844118'),('844120'),('844127'),('847107'),
  ('843301'),('843302'),('843311'),('843313'),('843314'),('843315'),('843316'),('843317'),('843318'),('843319'),('843320'),('843322'),('843323'),('843324'),('843325'),('843326'),('843327'),('843329'),('843330'),('843331'),('843332'),('843333'),('843360'),('847302'),('847307'),
  ('843328'),('843334'),('843321'),('843351')
on conflict (pincode) do nothing;

create or replace function public.serviceable_pincodes_for_district(target_pincode text)
returns text[]
language sql stable security definer
set search_path = public
as $$
  select coalesce(array_agg(sp.pincode order by sp.pincode), array[]::text[])
  from public.serviceable_pincodes sp
  join public.postal_pincodes pp on pp.pincode = sp.pincode
  where sp.enabled
    and pp.district = (select district from public.postal_pincodes where pincode = target_pincode limit 1);
$$;

create or replace function public.all_serviceable_pincodes()
returns text[]
language sql stable security definer
set search_path = public
as $$
  select coalesce(array_agg(pincode order by pincode), array[]::text[])
  from public.serviceable_pincodes
  where enabled;
$$;

grant execute on function public.serviceable_pincodes_for_district(text) to anon, authenticated;
grant execute on function public.all_serviceable_pincodes() to anon, authenticated;
