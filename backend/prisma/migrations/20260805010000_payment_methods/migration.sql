-- Manual JazzCash / EasyPaisa payment methods + structured bank/wallet details.
-- Additive only. NO destructive statements.

-- New payment methods (manual — customer sends money, admin verifies).
-- Safe on PostgreSQL 12+: the new values are NOT used within this migration.
ALTER TYPE "PaymentMethod" ADD VALUE IF NOT EXISTS 'JAZZCASH';
ALTER TYPE "PaymentMethod" ADD VALUE IF NOT EXISTS 'EASYPAISA';

-- Structured bank + wallet receiving details shown to customers at checkout.
-- The legacy free-text "bankDetails" column stays as an optional extra-notes field.
ALTER TABLE "store_settings"
  ADD COLUMN IF NOT EXISTS "jazzcashEnabled"    BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "easypaisaEnabled"   BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "jazzcashNumber"     TEXT    NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "jazzcashName"       TEXT    NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "easypaisaNumber"    TEXT    NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "easypaisaName"      TEXT    NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "bankName"           TEXT    NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "bankAccountTitle"   TEXT    NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "bankAccountNumber"  TEXT    NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "bankIban"           TEXT    NOT NULL DEFAULT '';
