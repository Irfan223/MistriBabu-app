/* Update get_admin_technicians to include trades array and service_locality */

drop function if exists public.get_admin_technicians();

create or replace function public.get_admin_technicians()
returns table (
  id         uuid,
  name       text,
  phone      text,
  trades     text[],
  service_district  text,
  service_pincode   text,
  service_locality  text,
  experience_years  integer,
  aadhaar_number    text,
  is_verified       boolean,
  status            text,
  is_active         boolean,
  is_online         boolean,
  latitude          float8,
  longitude         float8,
  created_at        timestamptz
)
language sql
stable
security definer
set search_path = public, extensions
as $$
  select
    t.id,
    coalesce(t.name, t.full_name)                                  as name,
    t.phone,
    coalesce(t.trades, array[]::text[])                            as trades,
    t.service_district,
    t.service_pincode,
    t.service_locality,
    t.experience_years,
    t.aadhaar_number,
    t.is_verified,
    t.status,
    t.is_active,
    t.is_online,
    case when t.location is null then null
         else st_y(t.location::geometry)::float8 end               as latitude,
    case when t.location is null then null
         else st_x(t.location::geometry)::float8 end               as longitude,
    t.created_at
  from public.technicians t
  where public.is_admin()
  order by t.created_at desc;
$$;

revoke all on function public.get_admin_technicians() from public;
grant execute on function public.get_admin_technicians() to authenticated;
