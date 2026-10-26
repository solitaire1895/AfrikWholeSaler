-- ============================================================================
-- AfrikWholesaler — African currencies
-- Run AFTER currencies.sql. Safe to re-run.
--
-- Adds per_usd (how many units 1 USD buys). Small-value currencies such as
-- UGX or GNF lose precision in rate_to_usd (4 decimals), so the app and the
-- checkout use per_usd first. To update a rate later, change per_usd, e.g.:
--   UPDATE currencies SET per_usd = 615, rate_to_usd = 1.0 / 615 WHERE code = 'XAF';
-- ============================================================================

ALTER TABLE currencies ADD COLUMN IF NOT EXISTS per_usd NUMERIC(20,6);
ALTER TABLE currencies ALTER COLUMN rate_to_usd TYPE NUMERIC(20,12);

INSERT INTO currencies (code, name, symbol, per_usd, rate_to_usd) VALUES
('XAF', 'Central African CFA Franc', 'FCFA', 607.4, 0.001646361541),
('CDF', 'Congolese Franc', 'FC', 2850, 0.000350877193),
('AOA', 'Angolan Kwanza', 'Kz', 915, 0.001092896175),
('RWF', 'Rwandan Franc', 'FRw', 1420, 0.000704225352),
('BIF', 'Burundian Franc', 'FBu', 2950, 0.000338983051),
('STN', 'São Tomé & Príncipe Dobra', 'Db', 22.7, 0.044052863436),
('XOF', 'West African CFA Franc', 'CFA', 607.4, 0.001646361541),
('NGN', 'Nigerian Naira', '₦', 1550, 0.000645161290),
('GHS', 'Ghanaian Cedi', 'GH₵', 12, 0.083333333333),
('GNF', 'Guinean Franc', 'FG', 8650, 0.000115606936),
('SLE', 'Sierra Leonean Leone', 'Le', 22.7, 0.044052863436),
('LRD', 'Liberian Dollar', 'L$', 185, 0.005405405405),
('GMD', 'Gambian Dalasi', 'D', 71, 0.014084507042),
('CVE', 'Cape Verdean Escudo', 'Esc', 102.1, 0.009794319295),
('MRU', 'Mauritanian Ouguiya', 'UM', 39.8, 0.025125628141),
('KES', 'Kenyan Shilling', 'KSh', 129, 0.007751937984),
('UGX', 'Ugandan Shilling', 'USh', 3650, 0.000273972603),
('TZS', 'Tanzanian Shilling', 'TSh', 2550, 0.000392156863),
('ETB', 'Ethiopian Birr', 'Br', 140, 0.007142857143),
('SOS', 'Somali Shilling', 'Sh.So.', 571, 0.001751313485),
('DJF', 'Djiboutian Franc', 'Fdj', 177.7, 0.005627462015),
('ERN', 'Eritrean Nakfa', 'Nfk', 15, 0.066666666667),
('SSP', 'South Sudanese Pound', 'SSP', 4500, 0.000222222222),
('MGA', 'Malagasy Ariary', 'Ar', 4550, 0.000219780220),
('MUR', 'Mauritian Rupee', 'Rs', 45.5, 0.021978021978),
('SCR', 'Seychellois Rupee', 'SR', 14.2, 0.070422535211),
('KMF', 'Comorian Franc', 'CF', 455.6, 0.002194907814),
('EGP', 'Egyptian Pound', 'E£', 49.5, 0.020202020202),
('MAD', 'Moroccan Dirham', 'DH', 9.3, 0.107526881720),
('DZD', 'Algerian Dinar', 'DA', 132, 0.007575757576),
('TND', 'Tunisian Dinar', 'DT', 3, 0.333333333333),
('LYD', 'Libyan Dinar', 'LD', 5.45, 0.183486238532),
('SDG', 'Sudanese Pound', 'SDG', 600, 0.001666666667),
('ZAR', 'South African Rand', 'R', 18, 0.055555555556),
('BWP', 'Botswanan Pula', 'P', 13.6, 0.073529411765),
('NAD', 'Namibian Dollar', 'N$', 18, 0.055555555556),
('SZL', 'Swazi Lilangeni', 'E', 18, 0.055555555556),
('LSL', 'Lesotho Loti', 'L', 18, 0.055555555556),
('ZMW', 'Zambian Kwacha', 'ZK', 25, 0.040000000000),
('MWK', 'Malawian Kwacha', 'MK', 1735, 0.000576368876),
('MZN', 'Mozambican Metical', 'MT', 63.9, 0.015649452269),
('ZWG', 'Zimbabwean Gold', 'ZiG', 26.8, 0.037313432836),
('USD', 'US Dollar', '$', 1, 1.000000000000),
('EUR', 'Euro', '€', 0.926, 1.079913606911),
('GBP', 'British Pound', '£', 0.79, 1.265822784810),
('CNY', 'Chinese Yuan', '¥', 7.2, 0.138888888889)
ON CONFLICT (code) DO UPDATE
  SET name = EXCLUDED.name,
      symbol = EXCLUDED.symbol,
      per_usd = EXCLUDED.per_usd,
      rate_to_usd = EXCLUDED.rate_to_usd,
      is_active = true;

-- Offer African currencies plus USD, EUR, GBP and CNY; hide the rest
-- (set is_active = true again to bring one back).
UPDATE currencies SET is_active = false WHERE code NOT IN ('XAF', 'CDF', 'AOA', 'RWF', 'BIF', 'STN', 'XOF', 'NGN', 'GHS', 'GNF', 'SLE', 'LRD', 'GMD', 'CVE', 'MRU', 'KES', 'UGX', 'TZS', 'ETB', 'SOS', 'DJF', 'ERN', 'SSP', 'MGA', 'MUR', 'SCR', 'KMF', 'EGP', 'MAD', 'DZD', 'TND', 'LYD', 'SDG', 'ZAR', 'BWP', 'NAD', 'SZL', 'LSL', 'ZMW', 'MWK', 'MZN', 'ZWG', 'USD', 'EUR', 'GBP', 'CNY');
