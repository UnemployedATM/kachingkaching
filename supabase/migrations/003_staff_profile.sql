-- Migration 003: Split staff name and add phone
ALTER TABLE staff ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS last_name  TEXT;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS phone      TEXT;

-- Backfill first_name from existing full_name (first word)
UPDATE staff SET first_name = split_part(full_name, ' ', 1) WHERE first_name IS NULL;
-- Backfill last_name (everything after the first word)
UPDATE staff SET last_name = trim(substring(full_name from position(' ' in full_name))) WHERE last_name IS NULL AND position(' ' in full_name) > 0;
