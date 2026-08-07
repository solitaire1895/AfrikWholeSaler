-- ============================================================================
-- AfrikWholesaler — Countries Lookup Table
-- Run this AFTER schema.sql to create a countries reference table.
-- This script is IDEMPOTENT.
-- ============================================================================

CREATE TABLE IF NOT EXISTS countries (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE, -- ISO 3166-1 alpha-2
  region TEXT NOT NULL, -- Africa, Europe, North America, South America, Asia, Middle East, Oceania
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE countries ENABLE ROW LEVEL SECURITY;

-- Public read
DROP POLICY IF EXISTS "Countries: public read" ON countries;
CREATE POLICY "Countries: public read"
  ON countries FOR SELECT
  USING (true);

-- Admin write
DROP POLICY IF EXISTS "Countries: admin write" ON countries;
CREATE POLICY "Countries: admin write"
  ON countries FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Insert countries (idempotent)
INSERT INTO countries (name, code, region) VALUES
-- Africa
('Senegal', 'SN', 'Africa'),
('Nigeria', 'NG', 'Africa'),
('Cameroon', 'CM', 'Africa'),
('Kenya', 'KE', 'Africa'),
('Ghana', 'GH', 'Africa'),
('Ivory Coast', 'CI', 'Africa'),
('South Africa', 'ZA', 'Africa'),
('Egypt', 'EG', 'Africa'),
('Morocco', 'MA', 'Africa'),
('Tanzania', 'TZ', 'Africa'),
('Ethiopia', 'ET', 'Africa'),
('Uganda', 'UG', 'Africa'),
('Algeria', 'DZ', 'Africa'),
('Tunisia', 'TN', 'Africa'),
('Mozambique', 'MZ', 'Africa'),
('DR Congo', 'CD', 'Africa'),
('Rwanda', 'RW', 'Africa'),
('Zambia', 'ZM', 'Africa'),
('Zimbabwe', 'ZW', 'Africa'),
('Botswana', 'BW', 'Africa'),
('Madagascar', 'MG', 'Africa'),
('Mali', 'ML', 'Africa'),
('Burkina Faso', 'BF', 'Africa'),
('Benin', 'BJ', 'Africa'),
('Togo', 'TG', 'Africa'),
('Gabon', 'GA', 'Africa'),
('Congo', 'CG', 'Africa'),
('Mauritius', 'MU', 'Africa'),
('Namibia', 'NA', 'Africa'),
('Angola', 'AO', 'Africa'),
-- Europe
('Germany', 'DE', 'Europe'),
('France', 'FR', 'Europe'),
('United Kingdom', 'GB', 'Europe'),
('Italy', 'IT', 'Europe'),
('Spain', 'ES', 'Europe'),
('Netherlands', 'NL', 'Europe'),
('Belgium', 'BE', 'Europe'),
('Switzerland', 'CH', 'Europe'),
('Poland', 'PL', 'Europe'),
('Sweden', 'SE', 'Europe'),
('Norway', 'NO', 'Europe'),
('Denmark', 'DK', 'Europe'),
('Finland', 'FI', 'Europe'),
('Portugal', 'PT', 'Europe'),
('Austria', 'AT', 'Europe'),
('Ireland', 'IE', 'Europe'),
('Czech Republic', 'CZ', 'Europe'),
('Greece', 'GR', 'Europe'),
('Romania', 'RO', 'Europe'),
('Hungary', 'HU', 'Europe'),
('Croatia', 'HR', 'Europe'),
('Bulgaria', 'BG', 'Europe'),
('Slovakia', 'SK', 'Europe'),
('Ukraine', 'UA', 'Europe'),
('Lithuania', 'LT', 'Europe'),
('Latvia', 'LV', 'Europe'),
('Estonia', 'EE', 'Europe'),
-- North America
('United States', 'US', 'North America'),
('Canada', 'CA', 'North America'),
('Mexico', 'MX', 'North America'),
('Guatemala', 'GT', 'North America'),
('Panama', 'PA', 'North America'),
('Costa Rica', 'CR', 'North America'),
('Dominican Republic', 'DO', 'North America'),
('Honduras', 'HN', 'North America'),
('Jamaica', 'JM', 'North America'),
('Cuba', 'CU', 'North America'),
('El Salvador', 'SV', 'North America'),
('Trinidad and Tobago', 'TT', 'North America'),
('Bahamas', 'BS', 'North America'),
('Barbados', 'BB', 'North America'),
-- South America
('Brazil', 'BR', 'South America'),
('Argentina', 'AR', 'South America'),
('Colombia', 'CO', 'South America'),
('Chile', 'CL', 'South America'),
('Peru', 'PE', 'South America'),
('Venezuela', 'VE', 'South America'),
('Ecuador', 'EC', 'South America'),
('Bolivia', 'BO', 'South America'),
('Paraguay', 'PY', 'South America'),
('Uruguay', 'UY', 'South America'),
('Guyana', 'GY', 'South America'),
('Suriname', 'SR', 'South America'),
-- Asia
('China', 'CN', 'Asia'),
('India', 'IN', 'Asia'),
('Vietnam', 'VN', 'Asia'),
('Thailand', 'TH', 'Asia'),
('Indonesia', 'ID', 'Asia'),
('Malaysia', 'MY', 'Asia'),
('Philippines', 'PH', 'Asia'),
('Japan', 'JP', 'Asia'),
('South Korea', 'KR', 'Asia'),
('Bangladesh', 'BD', 'Asia'),
('Pakistan', 'PK', 'Asia'),
('Sri Lanka', 'LK', 'Asia'),
('Cambodia', 'KH', 'Asia'),
('Myanmar', 'MM', 'Asia'),
('Taiwan', 'TW', 'Asia'),
('Singapore', 'SG', 'Asia'),
('Hong Kong', 'HK', 'Asia'),
-- Middle East
('Turkey', 'TR', 'Middle East'),
('United Arab Emirates', 'AE', 'Middle East'),
('Saudi Arabia', 'SA', 'Middle East'),
('Israel', 'IL', 'Middle East'),
('Qatar', 'QA', 'Middle East'),
('Kuwait', 'KW', 'Middle East'),
('Oman', 'OM', 'Middle East'),
('Jordan', 'JO', 'Middle East'),
('Lebanon', 'LB', 'Middle East'),
('Bahrain', 'BH', 'Middle East'),
-- Oceania
('Australia', 'AU', 'Oceania'),
('New Zealand', 'NZ', 'Oceania'),
('Fiji', 'FJ', 'Oceania')
ON CONFLICT (code) DO NOTHING;
