/*
  Technician schema updates:
  1. trade TEXT  →  trades TEXT[]  (one technician can have multiple skills)
  2. Add service_locality TEXT     (the specific area name selected during registration)
  3. Make service_radius_km nullable (no longer collected during registration)
  4. Update PostGIS RPCs to unnest trades array and remove service_radius_km filter
*/

-- 1. Add trades array, seed from existing trade column
alter table public.technicians
  add column if not exists trades text[] not null default '{}';

update public.technicians
  set trades = array[trade]
  where trade is not null and array_length(trades, 1) = 0;

-- 2. Add service_locality for the specific area selected by the technician
alter table public.technicians
  add column if not exists service_locality text;

-- 3. Make service_radius_km optional (no longer required at registration)
alter table public.technicians
  alter column service_radius_km drop not null,
  alter column service_radius_km set default null;

-- 4. Recreate RPCs for multi-trade support and customer-only radius filtering

drop function if exists public.get_nearby_worker_summary(float8, float8, float8);
drop function if exists public.get_nearby_technicians_list(float8, float8, float8, text);

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
      unnest(t.trades) as trade,
      st_setsrid(st_makepoint(sp.longitude, sp.latitude), 4326)::geography as point
    from public.technicians t
    left join public.serviceable_pincodes sp
      on sp.pincode = t.service_pincode and sp.enabled = true
    where t.is_active and t.is_online and t.is_verified and t.status = 'ACTIVE'
      and array_length(t.trades, 1) > 0
  )
  select
    sl.trade,
    count(*)::bigint                                                         as total_available,
    min(st_distance(sl.point, customer.point) / 1000.0)::float8             as closest_distance_km
  from service_locations sl cross join customer
  where sl.point is not null
    and st_dwithin(sl.point, customer.point, radius_in_km * 1000.0)
  group by sl.trade
  order by sl.trade;
$$;

create or replace function public.get_nearby_technicians_list(
  customer_lat float8,
  customer_lng float8,
  radius_in_km float8,
  filter_trade text
)
returns table (
  id                    uuid,
  name                  text,
  phone                 text,
  trades                text[],
  service_pincode       text,
  service_locality      text,
  service_location_name text,
  is_active             boolean,
  is_online             boolean,
  latitude              float8,
  longitude             float8,
  distance_km           float8
)
language sql stable security definer
set search_path = public, extensions
as $$
  with customer as (
    select st_setsrid(st_makepoint(customer_lng, customer_lat), 4326)::geography as point
  ), service_locations as (
    select
      t.id, t.name, t.phone, t.trades, t.service_pincode, t.service_locality,
      t.is_active, t.is_online,
      coalesce(sp.area_names[1] || ', ' || sp.district, sp.district, t.service_pincode) as service_location_name,
      st_setsrid(st_makepoint(sp.longitude, sp.latitude), 4326)::geography as point
    from public.technicians t
    left join public.serviceable_pincodes sp
      on sp.pincode = t.service_pincode and sp.enabled = true
    where t.is_active and t.is_online and t.is_verified and t.status = 'ACTIVE'
      and (filter_trade is null or filter_trade = any(t.trades))
  )
  select
    sl.id, sl.name, sl.phone, sl.trades, sl.service_pincode, sl.service_locality,
    sl.service_location_name, sl.is_active, sl.is_online,
    st_y(sl.point::geometry)::float8                         as latitude,
    st_x(sl.point::geometry)::float8                         as longitude,
    (st_distance(sl.point, customer.point) / 1000.0)::float8 as distance_km
  from service_locations sl cross join customer
  where sl.point is not null
    and st_dwithin(sl.point, customer.point, radius_in_km * 1000.0)
  order by distance_km, sl.name;
$$;

grant execute on function public.get_nearby_worker_summary(float8, float8, float8)         to anon, authenticated;
grant execute on function public.get_nearby_technicians_list(float8, float8, float8, text) to anon, authenticated;
