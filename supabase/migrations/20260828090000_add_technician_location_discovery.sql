/*
  Fresh Quick Mistri technician marketplace schema.

  This intentionally replaces the earlier bigint-based technicians table.
  Existing technician rows and assignments are discarded because the approved
  model uses UUID ids and requires verified coordinates. Apply this migration
  only after exporting any data that must be retained.
*/

create extension if not exists postgis;
create extension if not exists pgcrypto;

-- PostgreSQL requires policies that reference this column to be removed first.
drop policy if exists "Anyone can create a booking" on public.bookings;
drop policy if exists "Admins can view bookings" on public.bookings;
drop policy if exists "Admins can update bookings" on public.bookings;
drop policy if exists "anon_select_bookings" on public.bookings;
drop policy if exists "anon_insert_bookings" on public.bookings;
drop policy if exists "anon_update_bookings" on public.bookings;

alter table if exists public.bookings
  drop constraint if exists bookings_assigned_technician_id_fkey;

alter table if exists public.bookings
  alter column assigned_technician_id drop default;

update public.bookings
set assigned_technician_id = null
where assigned_technician_id is not null;

alter table if exists public.bookings
  alter column assigned_technician_id type uuid using null::uuid;

drop table if exists public.technicians cascade;

create table public.technicians (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  phone text not null unique check (phone ~ '^[6-9][0-9]{9}$'),
  trade text not null check (length(trim(trade)) > 0),
  service_district text not null check (service_district in ('Muzaffarpur', 'Sitamarhi', 'Sheohar', 'Motihari')),
  service_radius_km integer not null default 10 check (service_radius_km > 0),
  is_active boolean not null default true,
  is_online boolean not null default true,
  location geography(point, 4326) not null,
  created_at timestamptz not null default now()
);

create index technicians_location_gist_idx
  on public.technicians using gist (location);

alter table public.bookings
  add constraint bookings_assigned_technician_id_fkey
  foreign key (assigned_technician_id) references public.technicians(id)
  on delete set null;

alter table public.bookings enable row level security;

create policy "Anyone can create a booking"
  on public.bookings for insert
  to anon, authenticated
  with check (status = 'PENDING' and assigned_technician_id is null);

create policy "Admins can view bookings"
  on public.bookings for select
  to authenticated
  using (public.is_admin());

create policy "Admins can update bookings"
  on public.bookings for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

alter table public.technicians enable row level security;

create policy "Public can discover active technicians"
  on public.technicians for select
  to anon, authenticated
  using (is_active = true);

create policy "Anyone can self-register as a technician"
  on public.technicians for insert
  to anon, authenticated
  with check (is_active = true);

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
  )
  select
    t.trade,
    count(*)::bigint,
    min(st_distance(t.location, customer.point) / 1000.0)::float8
  from public.technicians t
  cross join customer
  where t.is_active
    and t.is_online
    and st_dwithin(t.location, customer.point, radius_in_km * 1000.0)
    and st_distance(t.location, customer.point) <= t.service_radius_km * 1000.0
  group by t.trade
  order by t.trade;
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
  )
  select
    t.id,
    t.name,
    t.phone,
    t.trade,
    t.service_radius_km,
    t.is_active,
    t.is_online,
    st_y(t.location::geometry)::float8 as latitude,
    st_x(t.location::geometry)::float8 as longitude,
    (st_distance(t.location, customer.point) / 1000.0)::float8 as distance_km
  from public.technicians t
  cross join customer
  where t.is_active
    and t.is_online
    and (filter_trade is null or t.trade = filter_trade)
    and st_dwithin(t.location, customer.point, radius_in_km * 1000.0)
    and st_distance(t.location, customer.point) <= t.service_radius_km * 1000.0
  order by distance_km, t.name;
$$;

revoke all on function public.get_nearby_worker_summary(float8, float8, float8) from public;
grant execute on function public.get_nearby_worker_summary(float8, float8, float8) to anon, authenticated;
revoke all on function public.get_nearby_technicians_list(float8, float8, float8, text) from public;
grant execute on function public.get_nearby_technicians_list(float8, float8, float8, text) to anon, authenticated;
