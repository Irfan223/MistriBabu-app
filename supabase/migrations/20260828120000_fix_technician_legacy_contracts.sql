/* Keep existing admin verification and booking availability flows compatible
   with the fresh UUID/PostGIS technician table. */

alter table public.technicians
  add column if not exists is_verified boolean not null default false,
  add column if not exists status text not null default 'PENDING_VERIFICATION',
  add column if not exists full_name text,
  add column if not exists experience_years integer,
  add column if not exists operating_areas text,
  add column if not exists aadhaar_number text;

update public.technicians
set full_name = coalesce(nullif(full_name, ''), name)
where full_name is null or full_name = '';

alter table public.technicians
  add constraint technicians_status_check
  check (status in ('ACTIVE', 'INACTIVE', 'PENDING', 'PENDING_VERIFICATION'));

drop policy if exists "Admins can update technicians" on public.technicians;
create policy "Admins can update technicians"
  on public.technicians for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Availability is based on the business service district. GPS is the technician's
-- current position and must not be used as a substitute for service coverage.
drop function if exists public.get_service_availability_counts(text, text);
create or replace function public.get_service_availability_counts(
  target_pincode text,
  target_trade text default null
)
returns table (
  exact_count bigint,
  district_count bigint,
  neighboring_count bigint,
  nearest_pincode text,
  nearest_count bigint
)
language sql
stable
security definer
set search_path = public, extensions
as $$
  with requested as (
    select pp.pincode, pp.district
    from public.postal_pincodes pp
    join public.serviceable_pincodes sp on sp.pincode = pp.pincode and sp.enabled
    where pp.pincode = target_pincode
  ), eligible as (
    select t.id, t.service_district
    from public.technicians t
    where t.is_active
      and t.is_online
      and t.is_verified
      and t.status = 'ACTIVE'
      and (target_trade is null or t.trade = target_trade)
  ), district_counts as (
    select r.district, count(e.id)::bigint as count
    from requested r
    left join eligible e on e.service_district = r.district
    group by r.district
  )
  select
    0::bigint as exact_count,
    coalesce((select count from district_counts), 0)::bigint as district_count,
    coalesce((select count(*) from eligible e where e.service_district <> (select district from requested)), 0)::bigint as neighboring_count,
    null::text as nearest_pincode,
    0::bigint as nearest_count;
$$;

revoke all on function public.get_service_availability_counts(text, text) from public;
grant execute on function public.get_service_availability_counts(text, text) to anon, authenticated;
