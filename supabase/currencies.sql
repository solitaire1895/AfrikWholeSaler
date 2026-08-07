-- ============================================================================
-- AfrikWholesaler — Currencies Table
-- Run this AFTER schema.sql to create a currencies reference table.
-- Exchange rates are relative to USD (1 USD = X currency).
-- ============================================================================

CREATE TABLE IF NOT EXISTS currencies (
  id SERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,        -- ISO 4217 code (USD, EUR, XAF, etc.)
  name TEXT NOT NULL,              -- Full name (US Dollar, Euro, etc.)
  symbol TEXT NOT NULL,            -- Currency symbol ($, €, FCFA, etc.)
  rate_to_usd NUMERIC(10,4) NOT NULL DEFAULT 1.0,  -- 1 unit of this currency = X USD
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE currencies ENABLE ROW LEVEL SECURITY;

-- Public read
DROP POLICY IF EXISTS "Currencies: public read" ON currencies;
CREATE POLICY "Currencies: public read"
  ON currencies FOR SELECT
  USING (true);

-- Admin write
DROP POLICY IF EXISTS "Currencies: admin write" ON currencies;
CREATE POLICY "Currencies: admin write"
  ON currencies FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Insert currencies (rate_to_usd = how much 1 unit of this currency is worth in USD)
-- For example: 1 EUR = 1.08 USD, 1 XAF = 0.0017 USD
INSERT INTO currencies (code, name, symbol, rate_to_usd) VALUES
('USD', 'US Dollar', '$', 1.0000),
('EUR', 'Euro', '€', 1.0800),
('GBP', 'British Pound', '£', 1.2700),
('XAF', 'CFA Franc BEAC', 'FCFA', 0.0017),
('XOF', 'CFA Franc BCEAO', 'CFA', 0.0017),
('NGN', 'Nigerian Naira', '₦', 0.0007),
('KES', 'Kenyan Shilling', 'KSh', 0.0078),
('GHS', 'Ghanaian Cedi', '₵', 0.0650),
('ZAR', 'South African Rand', 'R', 0.0540),
('EGP', 'Egyptian Pound', 'E£', 0.0210),
('MAD', 'Moroccan Dirham', 'DH', 0.1000),
('BRL', 'Brazilian Real', 'R$', 0.2000),
('CAD', 'Canadian Dollar', 'C$', 0.7300),
('CNY', 'Chinese Yuan', '¥', 0.1400),
('INR', 'Indian Rupee', '₹', 0.0120),
('AED', 'UAE Dirham', 'AED', 0.2720),
('AUD', 'Australian Dollar', 'A$', 0.6600),
('CHF', 'Swiss Franc', 'CHF', 1.1200),
('JPY', 'Japanese Yen', '¥', 0.0067),
('TRY', 'Turkish Lira', '₺', 0.0310)
ON CONFLICT (code) DO NOTHING;

-- Updated_at trigger
DROP TRIGGER IF EXISTS update_currencies_updated_at ON currencies;
CREATE TRIGGER update_currencies_updated_at
  BEFORE UPDATE ON currencies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
