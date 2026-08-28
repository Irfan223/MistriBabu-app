/*
# Fix booking_number trigger permissions

1. Changes
- Mark `next_booking_number` and `set_booking_number` as SECURITY DEFINER
  (matching the rest of this repo's functions) so the anon-key booking form
  can insert bookings without needing direct grants on
  `booking_number_counters`. Without this, the trigger runs as the calling
  role (anon) which has no privileges on the counters table and the insert
  fails with a permission error.
*/

ALTER FUNCTION next_booking_number(integer) SECURITY DEFINER SET search_path = public;
ALTER FUNCTION set_booking_number() SECURITY DEFINER SET search_path = public;
