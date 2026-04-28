-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "access_token" TEXT,
ADD COLUMN     "expires_at" INTEGER,
ADD COLUMN     "id_token" TEXT,
ADD COLUMN     "refresh_token" TEXT,
ADD COLUMN     "scope" TEXT,
ADD COLUMN     "session_state" TEXT,
ADD COLUMN     "token_type" TEXT;

-- AlterTable
ALTER TABLE "Tradesperson" ADD COLUMN     "profileActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "profileClaimedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "TradespersonPhoto" ADD COLUMN     "height" INTEGER,
ADD COLUMN     "storageKey" TEXT,
ADD COLUMN     "width" INTEGER;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "lastSignInAt" TIMESTAMP(3),
ADD COLUMN     "notifyAvailabilityReminder" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notifyMonthlyStats" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notifyNewReview" BOOLEAN NOT NULL DEFAULT true;
