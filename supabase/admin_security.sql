-- Run this in the Supabase SQL editor after creating the tables.
-- Keep admin_users inserts restricted to the service role or Supabase dashboard.

-- The dashboard stores the selected technician in this column.
alter table public.bookings
  add column if not exists assigned_technician_id integer;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_users
    where id = auth.uid()
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

create or replace function public.serviceable_pincodes_for_district(target_pincode text)
returns text[]
language sql
immutable
as $$
  select case
    when target_pincode in ('842001','842002','842003','842004','842005','843101','843102','843103','843104','843105','843106','843107','843108','843109','843110','843111','843112','843113','843115','843116','843117','843118','843119','843120','843121','843122','843123','843125','843126','843127','843128','843129','843132','843133','843139','843141','843143','843144','843146','843147','843152','843153','843161','843162','843165','843312','844111','844112','844118','844120','844127','847107') then array['842001','842002','842003','842004','842005','843101','843102','843103','843104','843105','843106','843107','843108','843109','843110','843111','843112','843113','843115','843116','843117','843118','843119','843120','843121','843122','843123','843125','843126','843127','843128','843129','843132','843133','843139','843141','843143','843144','843146','843147','843152','843153','843161','843162','843165','843312','844111','844112','844118','844120','844127','847107']::text[]
    when target_pincode in ('843301','843302','843311','843313','843314','843315','843316','843317','843318','843319','843320','843322','843323','843324','843325','843326','843327','843329','843330','843331','843332','843333','843334','843360','847302','847307') then array['843301','843302','843311','843313','843314','843315','843316','843317','843318','843319','843320','843322','843323','843324','843325','843326','843327','843329','843330','843331','843332','843333','843334','843360','847302','847307']::text[]
    when target_pincode in ('843328','843334','843321','843351') then array['843328','843334','843321','843351']::text[]
    else array[]::text[]
  end;
$$;

create or replace function public.all_serviceable_pincodes()
returns text[]
language sql
immutable
as $$
  select array['842001','842002','842003','842004','842005','843101','843102','843103','843104','843105','843106','843107','843108','843109','843110','843111','843112','843113','843115','843116','843117','843118','843119','843120','843121','843122','843123','843125','843126','843127','843128','843129','843132','843133','843139','843141','843143','843144','843146','843147','843152','843153','843161','843162','843165','843312','844111','844112','844118','844120','844127','847107','843301','843302','843311','843313','843314','843315','843316','843317','843318','843319','843320','843322','843323','843324','843325','843326','843327','843329','843330','843331','843332','843333','843334','843360','847302','847307','843328','843321','843351']::text[];
$$;

drop function if exists public.get_service_availability_counts(text, text);

create or replace function public.get_service_availability_counts(
  target_pincode text,
  target_trade text default null
)
returns table (exact_count bigint, district_count bigint, neighboring_count bigint, nearest_pincode text, nearest_count bigint)
language sql
stable
security definer
set search_path = public
as $$
  with eligible as (
    select id, operating_areas
    from public.technicians
    where status = 'ACTIVE'
      and is_verified = true
      and (target_trade is null or trade = target_trade)
  ), district_pins as (
    select pin, position
    from unnest(public.serviceable_pincodes_for_district(target_pincode)) with ordinality as pins(pin, position)
  ), all_pins as (
      select pin, position
      from unnest(public.all_serviceable_pincodes()) with ordinality as pins(pin, position)
  ), pin_counts as (
    select district_pins.pin, district_pins.position, count(eligible.id) as technician_count
    from district_pins
    left join eligible on eligible.operating_areas ilike '%' || district_pins.pin || '%'
    group by district_pins.pin, district_pins.position
  ), all_pin_counts as (
    select all_pins.pin, all_pins.position, count(eligible.id) as technician_count
    from all_pins
    left join eligible on eligible.operating_areas ilike '%' || all_pins.pin || '%'
    group by all_pins.pin, all_pins.position
  )
  select
    count(*) filter (where eligible.operating_areas ilike '%' || target_pincode || '%') as exact_count,
    count(*) filter (where exists (select 1 from district_pins where eligible.operating_areas ilike '%' || district_pins.pin || '%')) as district_count,
    count(*) filter (where exists (select 1 from all_pins where eligible.operating_areas ilike '%' || all_pins.pin || '%') and not exists (select 1 from district_pins where eligible.operating_areas ilike '%' || district_pins.pin || '%')) as neighboring_count,
      coalesce((select pin from pin_counts where technician_count > 0 and pin <> target_pincode order by position limit 1), (select pin from all_pin_counts where technician_count > 0 and pin <> target_pincode order by position limit 1)) as nearest_pincode,
      coalesce((select technician_count from pin_counts where technician_count > 0 and pin <> target_pincode order by position limit 1), (select technician_count from all_pin_counts where technician_count > 0 and pin <> target_pincode order by position limit 1), 0) as nearest_count
  from eligible;
$$;

revoke all on function public.get_service_availability_counts(text, text) from public;
grant execute on function public.get_service_availability_counts(text, text) to anon, authenticated;

alter table public.admin_users enable row level security;
alter table public.bookings enable row level security;
alter table public.technicians enable row level security;

drop policy if exists "Admins can verify their own admin record" on public.admin_users;
create policy "Admins can verify their own admin record"
on public.admin_users for select
to authenticated
using (id = auth.uid());

drop policy if exists "Anyone can create a booking" on public.bookings;
create policy "Anyone can create a booking"
on public.bookings for insert
to anon, authenticated
with check (status = 'PENDING' and assigned_technician_id is null);

drop policy if exists "Admins can view bookings" on public.bookings;
create policy "Admins can view bookings"
on public.bookings for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins can update bookings" on public.bookings;
create policy "Admins can update bookings"
on public.bookings for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Anyone can register as a technician" on public.technicians;
create policy "Anyone can register as a technician"
on public.technicians for insert
to anon, authenticated
with check (is_verified = false and status in ('ACTIVE', 'PENDING', 'PENDING_VERIFICATION'));

drop policy if exists "Admins can view technicians" on public.technicians;
create policy "Admins can view technicians"
on public.technicians for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins can update technicians" on public.technicians;
create policy "Admins can update technicians"
on public.technicians for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Prevent client-side role escalation through direct table updates.
revoke insert, update, delete on public.admin_users from anon, authenticated;
