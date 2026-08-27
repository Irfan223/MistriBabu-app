/*
  Nearby discovery must use the technician's service PIN location, not the
  location of the person who submitted the registration on their behalf.
*/

create or replace function public.get_nearby_worker_summary(
  customer_lat float8,
  customer_lng float8,
  radius_in_km float8
)
returns table (
  trade text,
  total_available bigint,
  closest_distance_km float8
)
language sql
stable
security definer
set search_path = public, extensions
as $$
  with customer as (
    select st_setsrid(st_makepoint(customer_lng, customer_lat), 4326)::geography as point
  ), service_locations as (
    select
      t.trade,
      t.service_radius_km,
      coalesce(
        st_setsrid(st_makepoint(po.longitude, po.latitude), 4326)::geography,
        t.location
      ) as point
    from public.technicians t
    left join lateral (
      select po.longitude, po.latitude
      from public.post_offices po
      where po.pincode = t.service_pincode
        and po.latitude is not null
        and po.longitude is not null
      order by po.name
      limit 1
    ) po on true
    where t.is_active
      and t.is_online
      and t.is_verified
      and t.status = 'ACTIVE'
  )
  select
    sl.trade,
    count(*)::bigint as total_available,
    min(st_distance(sl.point, customer.point) / 1000.0)::float8 as closest_distance_km
  from service_locations sl
  cross join customer
  where sl.point is not null
    and st_dwithin(sl.point, customer.point, radius_in_km * 1000.0)
    and st_distance(sl.point, customer.point) <= sl.service_radius_km * 1000.0
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
  id uuid,
  name text,
  phone text,
  trade text,
  service_radius_km integer,
  is_active boolean,
  is_online boolean,
  latitude float8,
  longitude float8,
  distance_km float8
)
language sql
stable
security definer
set search_path = public, extensions
as $$
  with customer as (
    select st_setsrid(st_makepoint(customer_lng, customer_lat), 4326)::geography as point
  ), service_locations as (
    select
      t.id,
      t.name,
      t.phone,
      t.trade,
      t.service_radius_km,
      t.is_active,
      t.is_online,
      coalesce(
        st_setsrid(st_makepoint(po.longitude, po.latitude), 4326)::geography,
        t.location
      ) as point
    from public.technicians t
    left join lateral (
      select po.longitude, po.latitude
      from public.post_offices po
      where po.pincode = t.service_pincode
        and po.latitude is not null
        and po.longitude is not null
      order by po.name
      limit 1
    ) po on true
    where t.is_active
      and t.is_online
      and t.is_verified
      and t.status = 'ACTIVE'
      and (filter_trade is null or t.trade = filter_trade)
  )
  select
    sl.id,
    sl.name,
    sl.phone,
    sl.trade,
    sl.service_radius_km,
    sl.is_active,
    sl.is_online,
    st_y(sl.point::geometry)::float8 as latitude,
    st_x(sl.point::geometry)::float8 as longitude,
    (st_distance(sl.point, customer.point) / 1000.0)::float8 as distance_km
  from service_locations sl
  cross join customer
  where sl.point is not null
    and st_dwithin(sl.point, customer.point, radius_in_km * 1000.0)
    and st_distance(sl.point, customer.point) <= sl.service_radius_km * 1000.0
  order by distance_km, sl.name;
$$;

revoke all on function public.get_nearby_worker_summary(float8, float8, float8) from public;
grant execute on function public.get_nearby_worker_summary(float8, float8, float8) to anon, authenticated;
revoke all on function public.get_nearby_technicians_list(float8, float8, float8, text) from public;
grant execute on function public.get_nearby_technicians_list(float8, float8, float8, text) to anon, authenticated;
