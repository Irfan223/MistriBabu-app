-- Technician auth: link auth.users to technicians, OTP verification table, and RLS policies.

alter table public.technicians
  add column if not exists user_id uuid references auth.users(id) on delete set null;

create index if not exists technicians_user_id_idx on public.technicians(user_id);

-- OTP verification store (dev mode: otp_plain returned to client; prod: send via SMS)
create table if not exists public.otp_verifications (
  id          bigint generated always as identity primary key,
  phone       text not null,
  otp_hash    text not null,
  expires_at  timestamptz not null,
  used        boolean not null default false,
  created_at  timestamptz not null default now()
);

alter table public.otp_verifications enable row level security;

-- No direct client access; all OTP ops go through Edge Functions (service role)
create policy "No direct client access to OTPs"
  on public.otp_verifications
  for all
  to anon, authenticated
  using (false);

-- Technician can read their own profile row
create policy "Technician reads own profile"
  on public.technicians
  for select
  to authenticated
  using (user_id = auth.uid());

-- Technician can update own profile (online status etc.)
create policy "Technician updates own profile"
  on public.technicians
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Technician can read bookings assigned to them
create policy "Technician reads own bookings"
  on public.bookings
  for select
  to authenticated
  using (
    assigned_technician_id = (
      select id from public.technicians where user_id = auth.uid() limit 1
    )
  );

-- Technician can update status (COMPLETED/CANCELLED) on their own bookings
create policy "Technician updates own booking status"
  on public.bookings
  for update
  to authenticated
  using (
    assigned_technician_id = (
      select id from public.technicians where user_id = auth.uid() limit 1
    )
  )
  with check (
    assigned_technician_id = (
      select id from public.technicians where user_id = auth.uid() limit 1
    )
  );
