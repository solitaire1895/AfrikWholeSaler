-- ============================================================================
-- AfrikWholesaler — Emails
-- Run AFTER schema.sql. Safe to re-run.
--
-- Remembers each user's language so emails sent later (payment webhook,
-- shipping updates) are written in it. Saved when the user switches language.
-- ============================================================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS locale TEXT;

DO $$ BEGIN
  ALTER TABLE profiles ADD CONSTRAINT profiles_locale_check CHECK (locale IS NULL OR locale IN ('fr', 'en', 'es', 'zh'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
