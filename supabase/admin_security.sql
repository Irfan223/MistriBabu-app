-- Run this in the Supabase SQL editor after creating the tables.
-- Keep admin_users inserts restricted to the service role or Supabase dashboard.

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

alter table public.admin_users enable row level security;
alter table public.bookings enable row level security;
alter table public.technicians enable row level security;

create policy "Admins can verify their own admin record"
on public.admin_users for select
to authenticated
using (id = auth.uid());

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

create policy "Anyone can register as a technician"
on public.technicians for insert
to anon, authenticated
with check (is_verified = false and status in ('ACTIVE', 'PENDING', 'PENDING_VERIFICATION'));

create policy "Admins can view technicians"
on public.technicians for select
to authenticated
using (public.is_admin());

create policy "Admins can update technicians"
on public.technicians for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Prevent client-side role escalation through direct table updates.
revoke insert, update, delete on public.admin_users from anon, authenticated;
