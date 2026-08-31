-- Key-value store for all admin-editable site configuration
CREATE TABLE IF NOT EXISTS app_config (
  key         text        PRIMARY KEY,
  value       text        NOT NULL,
  description text,
  updated_at  timestamptz DEFAULT now()
);

ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_app_config"   ON app_config FOR SELECT USING (true);
CREATE POLICY "admin_manage_app_config"  ON app_config FOR ALL    USING (is_admin());

-- Trigger to keep updated_at fresh on every write
CREATE OR REPLACE FUNCTION touch_app_config_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER app_config_updated_at
  BEFORE UPDATE ON app_config
  FOR EACH ROW EXECUTE FUNCTION touch_app_config_updated_at();

-- Seed with all current hardcoded brand values
INSERT INTO app_config (key, value, description) VALUES
  ('whatsapp_number',    '918910541678',                                                          'WhatsApp number without + prefix (used in wa.me links)'),
  ('support_phone',      '+91 89105 41678',                                                       'Display phone number shown in UI'),
  ('calling_number',     '+918910541678',                                                         'Phone number used in tel: href links'),
  ('support_email',      'support@quickmistri.in',                                                'Customer support email address'),
  ('brand_name',         'QuickMistri',                                                           'Internal brand name, no spaces'),
  ('brand_display_name', 'Quick Mistri',                                                          'Display name shown in UI'),
  ('brand_legal_name',   'Quick Mistri Technologies',                                             'Legal entity name'),
  ('brand_domain',       'quickmistri.in',                                                        'Primary domain'),
  ('brand_url',          'https://www.quickmistri.in',                                            'Canonical brand URL'),
  ('hero_title',         'Expert Home Services at Your Doorstep',                                 'Hero section H1 heading'),
  ('hero_subtitle',      'Verified local experts at fixed pricing. Rapid doorstep repair across North Bihar.', 'Hero section subtitle paragraph'),
  ('hero_region_label',  'Serving Muzaffarpur • Sitamarhi • Sheohar • Motihari',                 'Region badge text in hero'),
  ('hero_response_time', 'Average response time: under 60 minutes',                              'Response time note shown below CTA'),
  ('tagline_primary',    'Ghar Ke Har Kaam Ka Bharosemand Hal',                                  'Primary brand tagline'),
  ('tagline_secondary',  'Expert Home Services, Right at Your Doorstep',                         'Secondary tagline'),
  ('tagline_short',      'Trusted Home Services, On Demand',                                     'Short tagline for compact contexts'),
  ('service_heading',    'Home Maintenance, Made Simple',                                         'Service catalog section heading'),
  ('service_description','Transparent pricing. No hidden charges. Pay after service.',            'Service catalog section subheading'),
  ('booking_button_text','Book a Service Now',                                                    'Primary booking CTA button label'),
  ('partner_button_text','Join Quick Mistri',                                                     'Technician partner CTA button label'),
  ('footer_serving_text','Proudly serving Muzaffarpur, Sitamarhi, Sheohar & Motihari, Bihar.',   'Footer service area notice'),
  ('inspection_fee',     '99',                                                                    'Inspection / visit fee in rupees (numeric only)'),
  ('guarantee_days',     '30',                                                                    'Service warranty duration in days (numeric only)'),
  ('twitter_handle',     '@QuickMistriIn',                                                        'Twitter / X handle'),
  ('instagram_handle',   'quickmistri.in',                                                        'Instagram username'),
  ('facebook_handle',    'quickmistriofficial',                                                   'Facebook page name')
ON CONFLICT (key) DO NOTHING;
