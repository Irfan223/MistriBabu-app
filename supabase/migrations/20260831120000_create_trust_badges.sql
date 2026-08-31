-- Trust badges displayed on the homepage "Why Quick Mistri?" section
CREATE TABLE IF NOT EXISTS trust_badges (
  id            uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  title         text    NOT NULL,
  description   text    NOT NULL DEFAULT '',
  icon          text    NOT NULL DEFAULT '',
  display_order integer NOT NULL DEFAULT 0,
  is_active     boolean NOT NULL DEFAULT true
);

ALTER TABLE trust_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_trust_badges"  ON trust_badges FOR SELECT USING (is_active = true);
CREATE POLICY "admin_manage_trust_badges" ON trust_badges FOR ALL    USING (is_admin());

INSERT INTO trust_badges (title, description, icon, display_order) VALUES
  ('₹99 Inspection',      'Low visit charge, adjusted in final bill',              '💰', 1),
  ('Verified Experts',    'Every expert is background-checked',                    '✅', 2),
  ('30-Day Warranty',     'Free rework if the issue comes back',                   '🛡️', 3),
  ('60-Minute Response',  'At your doorstep within an hour',                       '⚡', 4),
  ('Skilled Professionals','Experienced local electricians and plumbers',           '🔧', 5),
  ('Trusted Locally',     'Built for North Bihar homes',                           '🏠', 6);
