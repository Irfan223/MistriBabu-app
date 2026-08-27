/*
# Create bookings and technicians tables for MistriBabu

1. New Tables
- `bookings`
  - `id` (bigint identity, primary key) — used as the public Booking ID (e.g. MB-1001)
  - `customer_name` (text, not null)
  - `customer_phone` (text, not null) — 10-digit Indian mobile
  - `locality` (text, not null) — Muzaffarpur locality
  - `service_category` (text, not null) — 'Electrician' | 'Plumber'
  - `sub_service` (text, not null) — specific service/problem
  - `problem_description` (text, nullable) — optional extra detail
  - `preferred_slot` (text, not null) — 'Today' | 'Tomorrow' | specific time
  - `status` (text, not null, default 'PENDING') — PENDING | ASSIGNED | COMPLETED
  - `created_at` (timestamptz, default now())
- `technicians`
  - `id` (bigint identity, primary key)
  - `full_name` (text, not null)
  - `phone` (text, not null)
  - `trade` (text, not null) — 'Electrician' | 'Plumber'
  - `experience_years` (integer, not null)
  - `operating_areas` (text, not null) — comma-separated localities
  - `aadhaar_number` (text, nullable) — optional
  - `is_verified` (boolean, not null, default false)
  - `status` (text, not null, default 'ACTIVE')
  - `created_at` (timestamptz, default now())

2. Security
- Enable RLS on both tables.
- This is a no-auth public booking app: the anon-key frontend must be able to
  INSERT new bookings and technician registrations, and SELECT them back for
  the admin lead viewer. Data is intentionally shared/public across the single
  operator who runs MistriBabu, so policies use `TO anon, authenticated` with
  `USING (true)` / `WITH CHECK (true)` — documented here as intentional.
- UPDATE is allowed so the operator can change booking status
  (PENDING -> ASSIGNED -> COMPLETED) from the admin viewer without sign-in.

3. Notes
- Bigint identity ids give short, human-readable Booking IDs (MB-<id>) that are
  easy to quote to a customer over WhatsApp/call.
*/

CREATE TABLE IF NOT EXISTS bookings (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  locality text NOT NULL,
  service_category text NOT NULL,
  sub_service text NOT NULL,
  problem_description text,
  preferred_slot text NOT NULL,
  status text NOT NULL DEFAULT 'PENDING',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_bookings" ON bookings;
CREATE POLICY "anon_select_bookings" ON bookings FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_bookings" ON bookings;
CREATE POLICY "anon_insert_bookings" ON bookings FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_bookings" ON bookings;
CREATE POLICY "anon_update_bookings" ON bookings FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_bookings" ON bookings;
CREATE POLICY "anon_delete_bookings" ON bookings FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS technicians (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  full_name text NOT NULL,
  phone text NOT NULL,
  trade text NOT NULL,
  experience_years integer NOT NULL,
  operating_areas text NOT NULL,
  aadhaar_number text,
  is_verified boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'ACTIVE',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE technicians ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_technicians" ON technicians;
CREATE POLICY "anon_select_technicians" ON technicians FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_technicians" ON technicians;
CREATE POLICY "anon_insert_technicians" ON technicians FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_technicians" ON technicians;
CREATE POLICY "anon_update_technicians" ON technicians FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_technicians" ON technicians;
CREATE POLICY "anon_delete_technicians" ON technicians FOR DELETE
  TO anon, authenticated USING (true);
