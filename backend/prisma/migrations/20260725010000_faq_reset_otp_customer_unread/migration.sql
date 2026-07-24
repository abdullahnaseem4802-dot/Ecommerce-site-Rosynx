-- Additive only. New nullable columns / columns with defaults + one new table.
-- No data loss; safe to apply to production with `prisma migrate deploy`.

-- AlterTable: customer-facing unread flag for support tickets (notification badge)
ALTER TABLE "contact_messages" ADD COLUMN     "customerUnread" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable: password-reset OTP fields (forgot-password flow)
ALTER TABLE "users" ADD COLUMN     "resetOtpAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "resetOtpExpiry" TIMESTAMP(3),
ADD COLUMN     "resetOtpHash" TEXT;

-- CreateTable: admin-managed FAQ entries
CREATE TABLE "faq_items" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'General',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "faq_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "faq_items_isPublished_idx" ON "faq_items"("isPublished");
