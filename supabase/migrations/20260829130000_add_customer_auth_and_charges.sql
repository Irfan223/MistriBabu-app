-- Customer auth, payment tracking fields, and RLS policies.

-- Payment tracking columns on bookings
alter table public.bookings
  add column if not exists visiting_charge integer not null default 0,
  add column if not exists final_service_charge integer,
  add column if not exists visiting_charge_paid boolean not null default false,
  add column if not exists service_charge_paid boolean not null default false;

-- Distance-based visiting charge calculator (tiers in rupees)
create or replace function public.calculate_visiting_charge(distance_km float)
returns integer
language sql
immutable
as $$
  select case
    when distance_km <= 5  then 29
    when distance_km <= 10 then 49
    when distance_km <= 20 then 69
    else 99
  end;
$$;

-- RLS: customer can read own bookings (phone matched via JWT user_metadata)
create policy "Customer reads own bookings"
  on public.bookings
  for select
  to authenticated
  using (
    customer_phone = (auth.jwt() -> 'user_metadata' ->> 'phone')
  );

-- RLS: customer can only cancel their own PENDING/ASSIGNED bookings
create policy "Customer cancels own bookings"
  on public.bookings
  for update
  to authenticated
  using (
    customer_phone = (auth.jwt() -> 'user_metadata' ->> 'phone')
    and status in ('PENDING', 'ASSIGNED')
    and (auth.jwt() -> 'user_metadata' ->> 'role') = 'customer'
  )
  with check (
    customer_phone = (auth.jwt() -> 'user_metadata' ->> 'phone')
    and status = 'CANCELLED'
  );
