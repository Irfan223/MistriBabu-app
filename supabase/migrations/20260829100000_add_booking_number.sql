/*
# Add human-readable booking_number to bookings

1. Changes
- `booking_number_counters` — tracks the next sequence per calendar year so
  booking numbers reset to 001 every new year (e.g. MB2026001, MB2027001).
- `bookings.booking_number` (text, unique) — readable order number in the
  format MB<year><3-digit-seq>, e.g. MB2026001 for the first booking of 2026.
- Trigger `set_booking_number` auto-assigns booking_number on insert.
- Backfill existing rows in created_at/id order so history matches what the
  admin dashboard was already displaying.

2. Security
- No RLS changes; booking_number is just a derived, publicly readable field
  on the existing bookings table.
*/

CREATE TABLE IF NOT EXISTS booking_number_counters (
  year integer PRIMARY KEY,
  counter integer NOT NULL DEFAULT 0
);

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS booking_number text;

CREATE OR REPLACE FUNCTION next_booking_number(for_year integer)
RETURNS integer AS $$
DECLARE
  next_val integer;
BEGIN
  INSERT INTO booking_number_counters (year, counter)
  VALUES (for_year, 1)
  ON CONFLICT (year) DO UPDATE SET counter = booking_number_counters.counter + 1
  RETURNING counter INTO next_val;
  RETURN next_val;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION set_booking_number()
RETURNS trigger AS $$
DECLARE
  booking_year integer := EXTRACT(YEAR FROM COALESCE(NEW.created_at, now()))::integer;
BEGIN
  IF NEW.booking_number IS NULL THEN
    NEW.booking_number := 'MB' || booking_year || LPAD(next_booking_number(booking_year)::text, 3, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_booking_number ON bookings;
CREATE TRIGGER trg_set_booking_number
  BEFORE INSERT ON bookings
  FOR EACH ROW EXECUTE FUNCTION set_booking_number();

-- Backfill existing rows per year, ordered the same way the admin UI did.
DO $$
DECLARE
  rec RECORD;
  booking_year integer;
  seq integer;
BEGIN
  FOR rec IN
    SELECT id, EXTRACT(YEAR FROM created_at)::integer AS yr
    FROM bookings
    WHERE booking_number IS NULL
    ORDER BY EXTRACT(YEAR FROM created_at), id
  LOOP
    booking_year := rec.yr;
    seq := next_booking_number(booking_year);
    UPDATE bookings
    SET booking_number = 'MB' || booking_year || LPAD(seq::text, 3, '0')
    WHERE id = rec.id;
  END LOOP;
END $$;

ALTER TABLE bookings ALTER COLUMN booking_number SET NOT NULL;
ALTER TABLE bookings ADD CONSTRAINT bookings_booking_number_unique UNIQUE (booking_number);
