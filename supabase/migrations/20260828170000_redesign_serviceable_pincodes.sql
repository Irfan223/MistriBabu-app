/*
  Redesign: replace the 3-table postal data pipeline (postal_pincodes,
  post_offices, postal_data_imports) with a single admin-managed
  serviceable_pincodes table that holds coordinates and area names directly.

  After applying this migration, import the 4 district CSVs via Supabase
  Table Editor → Import data from CSV.
*/

-- Drop existing PostGIS functions that reference post_offices
drop function if exists public.get_nearby_worker_summary(float8, float8, float8);
drop function if exists public.get_nearby_technicians_list(float8, float8, float8, text);

-- Drop old postal pipeline tables (order respects FK constraints)
drop table if exists public.post_offices cascade;
drop table if exists public.postal_data_imports cascade;
drop table if exists public.postal_pincodes cascade;
drop table if exists public.serviceable_pincodes cascade;

-- Single source-of-truth table for all serviceable locations
create table public.serviceable_pincodes (
  pincode    text primary key check (pincode ~ '^\d{6}$'),
  district   text not null check (district in ('Muzaffarpur', 'Sitamarhi', 'Sheohar', 'Motihari')),
  area_names text[] not null default '{}',
  block      text,
  latitude   double precision not null,
  longitude  double precision not null,
  enabled    boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index serviceable_pincodes_district_idx on public.serviceable_pincodes (district);
create index serviceable_pincodes_enabled_idx  on public.serviceable_pincodes (enabled);

alter table public.serviceable_pincodes enable row level security;

create policy "Public can read enabled pincodes"
  on public.serviceable_pincodes for select to anon, authenticated
  using (enabled = true);

-- Admins manage pincodes via Supabase dashboard using service role key
-- (no JWT-based admin policy needed for dashboard access)

-- Recreate nearby worker summary — joins serviceable_pincodes instead of post_offices
create or replace function public.get_nearby_worker_summary(
  customer_lat float8,
  customer_lng float8,
  radius_in_km float8
)
returns table (trade text, total_available bigint, closest_distance_km float8)
language sql stable security definer
set search_path = public, extensions
as $$
  with customer as (
    select st_setsrid(st_makepoint(customer_lng, customer_lat), 4326)::geography as point
  ), service_locations as (
    select
      t.trade,
      t.service_radius_km,
      coalesce(
        st_setsrid(st_makepoint(sp.longitude, sp.latitude), 4326)::geography,
        t.location
      ) as point
    from public.technicians t
    left join public.serviceable_pincodes sp
      on sp.pincode = t.service_pincode and sp.enabled = true
    where t.is_active and t.is_online and t.is_verified and t.status = 'ACTIVE'
  )
  select
    sl.trade,
    count(*)::bigint                                                          as total_available,
    min(st_distance(sl.point, customer.point) / 1000.0)::float8              as closest_distance_km
  from service_locations sl cross join customer
  where sl.point is not null
    and st_dwithin(sl.point, customer.point, radius_in_km * 1000.0)
    and st_distance(sl.point, customer.point) <= sl.service_radius_km * 1000.0
  group by sl.trade
  order by sl.trade;
$$;

-- Recreate nearby technicians list — uses serviceable_pincodes for location name + coords
create or replace function public.get_nearby_technicians_list(
  customer_lat float8,
  customer_lng float8,
  radius_in_km float8,
  filter_trade text
)
returns table (
  id                   uuid,
  name                 text,
  phone                text,
  trade                text,
  service_pincode      text,
  service_location_name text,
  service_radius_km    integer,
  is_active            boolean,
  is_online            boolean,
  latitude             float8,
  longitude            float8,
  distance_km          float8
)
language sql stable security definer
set search_path = public, extensions
as $$
  with customer as (
    select st_setsrid(st_makepoint(customer_lng, customer_lat), 4326)::geography as point
  ), service_locations as (
    select
      t.id, t.name, t.phone, t.trade, t.service_pincode, t.service_radius_km,
      t.is_active, t.is_online,
      coalesce(sp.area_names[1] || ', ' || sp.district, sp.district, t.service_pincode) as service_location_name,
      coalesce(
        st_setsrid(st_makepoint(sp.longitude, sp.latitude), 4326)::geography,
        t.location
      ) as point
    from public.technicians t
    left join public.serviceable_pincodes sp
      on sp.pincode = t.service_pincode and sp.enabled = true
    where t.is_active and t.is_online and t.is_verified and t.status = 'ACTIVE'
      and (filter_trade is null or t.trade = filter_trade)
  )
  select
    sl.id, sl.name, sl.phone, sl.trade, sl.service_pincode, sl.service_location_name,
    sl.service_radius_km, sl.is_active, sl.is_online,
    st_y(sl.point::geometry)::float8                         as latitude,
    st_x(sl.point::geometry)::float8                         as longitude,
    (st_distance(sl.point, customer.point) / 1000.0)::float8 as distance_km
  from service_locations sl cross join customer
  where sl.point is not null
    and st_dwithin(sl.point, customer.point, radius_in_km * 1000.0)
    and st_distance(sl.point, customer.point) <= sl.service_radius_km * 1000.0
  order by distance_km, sl.name;
$$;

grant execute on function public.get_nearby_worker_summary(float8, float8, float8)          to anon, authenticated;
grant execute on function public.get_nearby_technicians_list(float8, float8, float8, text)  to anon, authenticated;
