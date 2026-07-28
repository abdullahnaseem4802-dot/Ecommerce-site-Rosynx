-- Signup email verification (double opt-in) OTP fields.
-- Additive + one backfill. NO destructive statements.

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "verifyOtpHash"     TEXT,
  ADD COLUMN IF NOT EXISTS "verifyOtpExpiry"   TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "verifyOtpAttempts" INTEGER NOT NULL DEFAULT 0;

-- Every account that already exists predates verification and must NOT be locked
-- out when login starts enforcing emailVerified. Mark them all verified. New
-- registrations are created with emailVerified=false and must verify via OTP.
UPDATE "users" SET "emailVerified" = true WHERE "emailVerified" = false;

-- Welcome coupon auto-sent to a new newsletter subscriber (admin-selectable;
-- empty falls back to any active coupon).
ALTER TABLE "store_settings"
  ADD COLUMN IF NOT EXISTS "welcomeCouponCode" TEXT NOT NULL DEFAULT '';
