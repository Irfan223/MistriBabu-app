-- Service categories (trades) and their individual sub-services with prices
CREATE TABLE IF NOT EXISTS service_categories (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text        UNIQUE NOT NULL,
  icon          text        NOT NULL DEFAULT '',
  display_order integer     NOT NULL DEFAULT 0,
  is_active     boolean     NOT NULL DEFAULT true,
  created_at    timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sub_services (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id   uuid        NOT NULL REFERENCES service_categories(id) ON DELETE CASCADE,
  name          text        NOT NULL,
  description   text        NOT NULL DEFAULT '',
  price         integer     NOT NULL DEFAULT 0,
  display_order integer     NOT NULL DEFAULT 0,
  is_active     boolean     NOT NULL DEFAULT true,
  created_at    timestamptz DEFAULT now()
);

ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE sub_services       ENABLE ROW LEVEL SECURITY;

-- Public can browse active categories and services; only admins can write
CREATE POLICY "public_read_service_categories"  ON service_categories FOR SELECT USING (is_active = true);
CREATE POLICY "admin_manage_service_categories" ON service_categories FOR ALL    USING (is_admin());

CREATE POLICY "public_read_sub_services"        ON sub_services FOR SELECT USING (is_active = true);
CREATE POLICY "admin_manage_sub_services"       ON sub_services FOR ALL    USING (is_admin());

-- Seed categories
INSERT INTO service_categories (name, icon, display_order) VALUES
  ('Electrician',   '⚡', 1),
  ('Plumber',       '🔧', 2),
  ('AC Technician', '❄️', 3),
  ('Painter',       '🎨', 4)
ON CONFLICT (name) DO NOTHING;

-- Seed all 16 sub-services via a join so we don't hard-code UUIDs
INSERT INTO sub_services (category_id, name, description, price, display_order)
SELECT c.id, s.name, s.description, s.price, s.ord
FROM   service_categories c
JOIN (VALUES
  ('Electrician',   'Fan / Light / Switch Repair',         'Ceiling fan, tube light, switch & socket fixing',   149,  1),
  ('Electrician',   'Short Circuit / MCB Fix',             'Tripping, short circuit, MCB & fuse box repair',    199,  2),
  ('Electrician',   'Inverter / Wiring Inspection',        'Full wiring check & inverter setup inspection',     399,  3),
  ('Electrician',   'Geyser / Appliance Point',            'Geyser, AC & appliance point installation',         249,  4),
  ('Plumber',       'Tap / Pipe Leakage',                  'Leaking taps, pipes & joints repair',               149,  1),
  ('Plumber',       'Toilet / Flush Tank / Washbasin',     'Flush tank, commode & washbasin fixing',            249,  2),
  ('Plumber',       'Water Motor / Submersible Inspection','Motor & submersible pump check & repair',           299,  3),
  ('Plumber',       'Tank Cleaning & Blockage Clearing',   'Overhead tank cleaning & drain blockage',           499,  4),
  ('AC Technician', 'AC Service & Cleaning',               'Deep cleaning for split and window AC units',       499,  1),
  ('AC Technician', 'AC Repair & Gas Check',               'Cooling issues, gas leakage checks and repairs',   299,  2),
  ('AC Technician', 'AC Installation',                     'Professional split and window AC installation',     999,  3),
  ('AC Technician', 'AC Uninstallation',                   'Careful removal for shifting or replacement',       499,  4),
  ('Painter',       'Room Painting',                       'Neat interior wall painting for rooms and homes',  1499,  1),
  ('Painter',       'Wall Texture & Design',               'Decorative textures and feature wall finishes',    1999,  2),
  ('Painter',       'Exterior Painting',                   'Weather-resistant exterior painting and touch-ups',1999,  3),
  ('Painter',       'Putty & Surface Preparation',         'Crack filling, putty work and smooth surface prep', 699,  4)
) AS s(cat_name, name, description, price, ord)
ON c.name = s.cat_name;
