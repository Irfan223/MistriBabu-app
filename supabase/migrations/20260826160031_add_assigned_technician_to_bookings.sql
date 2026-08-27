/*
# Add assigned_technician_id to bookings

1. Modified Tables
- `bookings`
  - `assigned_technician_id` (bigint, nullable) — FK to technicians.id,
    set when an admin assigns a specific mistri to a booking.

2. Security
- No policy changes needed: existing anon UPDATE policy already covers
  this column. The column is nullable so old rows are unaffected.

3. Notes
- ON DELETE SET NULL so deleting a technician doesn't lose the booking record.
*/

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS assigned_technician_id bigint;

ALTER TABLE bookings
  DROP CONSTRAINT IF EXISTS bookings_assigned_technician_id_fkey;

ALTER TABLE bookings
  ADD CONSTRAINT bookings_assigned_technician_id_fkey
  FOREIGN KEY (assigned_technician_id) REFERENCES technicians(id)
  ON DELETE SET NULL;
