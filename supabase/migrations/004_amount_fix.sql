-- Migration 004: Rename amount_cents to amount as decimal
-- The app UI works in dollars, not cents — store as decimal for simplicity.
ALTER TABLE payments RENAME COLUMN amount_cents TO amount;
ALTER TABLE payments ALTER COLUMN amount TYPE NUMERIC(10,2) USING (amount / 100.0);
