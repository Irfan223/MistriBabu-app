/* Expose readable technician location fields to the authenticated admin panel. */

alter table public.technicians
  add column if not exists is_verified boolean not null default false,
  add column if not exists status text not null default 'PENDING_VERIFICATION',
  add column if not exists full_name text,
  add column if not exists experience_years integer,
  add column if not exists aadhaar_number text,
  add column if not exists service_district text,
  add column if not exists service_pincode text;

update public.technicians
set full_name = coalesce(nullif(full_name, ''), name)
where full_name is null or full_name = '';

create or replace function public.get_admin_technicians()
returns table (
  id uuid,
  name text,
  full_name text,
  phone text,
  trade text,
  service_district text,
  service_pincode text,
  service_radius_km integer,
  experience_years integer,
  aadhaar_number text,
  is_verified boolean,
  status text,
  is_active boolean,
  is_online boolean,
  latitude float8,
  longitude float8,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public, extensions
as $$
  select
    t.id,
    t.name,
    t.full_name,
    t.phone,
    t.trade,
    t.service_district,
    t.service_pincode,
    t.service_radius_km,
    t.experience_years,
    t.aadhaar_number,
    t.is_verified,
    t.status,
    t.is_active,
    t.is_online,
    case when t.location is null then null else st_y(t.location::geometry)::float8 end,
    case when t.location is null then null else st_x(t.location::geometry)::float8 end,
    t.created_at
  from public.technicians t
  where public.is_admin()
  order by t.created_at desc;
$$;

revoke all on function public.get_admin_technicians() from public;
grant execute on function public.get_admin_technicians() to authenticated;
