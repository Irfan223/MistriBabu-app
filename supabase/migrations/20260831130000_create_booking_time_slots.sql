-- Available time slots shown in the booking form
CREATE TABLE IF NOT EXISTS booking_time_slots (
  id            uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  label         text    NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  is_active     boolean NOT NULL DEFAULT true
);

ALTER TABLE booking_time_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_booking_time_slots"  ON booking_time_slots FOR SELECT USING (is_active = true);
CREATE POLICY "admin_manage_booking_time_slots" ON booking_time_slots FOR ALL    USING (is_admin());

INSERT INTO booking_time_slots (label, display_order) VALUES
  ('09:00 AM - 12:00 PM (Morning)',   1),
  ('12:00 PM - 03:00 PM (Afternoon)', 2),
  ('03:00 PM - 06:00 PM (Evening)',   3),
  ('06:00 PM - 09:00 PM (Night)',     4);
