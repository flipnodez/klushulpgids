-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "TeamSize" AS ENUM ('SOLO', 'SMALL', 'MEDIUM', 'LARGE');

-- CreateEnum
CREATE TYPE "MarketFocus" AS ENUM ('B2B', 'B2C', 'BOTH');

-- CreateEnum
CREATE TYPE "AvailabilityStatus" AS ENUM ('AVAILABLE_NOW', 'AVAILABLE_THIS_WEEK', 'AVAILABLE_THIS_MONTH', 'WAITLIST', 'NOT_ACCEPTING', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "Tier" AS ENUM ('FREE', 'PRO', 'PREMIUM', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "VerificationMethod" AS ENUM ('EMAIL_CONFIRMED', 'KVK_VERIFIED', 'UNVERIFIED');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "BlogCategory" AS ENUM ('KOSTEN', 'TIPS', 'VERDUURZAMEN', 'REGELGEVING', 'VERHALEN', 'VAKMANNEN', 'HOE_DOE_JE');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'EDITOR', 'TRADESPERSON', 'CONSUMER');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('PROFILE_VIEW', 'PHONE_CLICK', 'EMAIL_CLICK', 'WEBSITE_CLICK', 'REVIEW_SUBMITTED', 'PHOTO_VIEW');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED', 'CANCELED');

-- CreateEnum
CREATE TYPE "SponsorSlot" AS ENUM ('TOP_FEATURED', 'SIDEBAR', 'INLINE');

-- CreateEnum
CREATE TYPE "SponsorStatus" AS ENUM ('PENDING', 'ACTIVE', 'EXPIRED', 'CANCELED');

-- CreateTable
CREATE TABLE "Trade" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameSingular" TEXT NOT NULL,
    "namePlural" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "iconName" TEXT NOT NULL,
    "seoTitleTemplate" TEXT NOT NULL,
    "seoDescriptionTemplate" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Trade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "City" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "population" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "City_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tradesperson" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "contactName" TEXT,
    "kvkNumber" TEXT,
    "btwNumber" TEXT,
    "description" TEXT,
    "email" TEXT,
    "emailHash" TEXT,
    "phone" TEXT,
    "websiteUrl" TEXT,
    "socialMedia" JSONB,
    "street" TEXT,
    "houseNumber" TEXT,
    "postalCode" TEXT,
    "cityId" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "hourlyRateMin" INTEGER,
    "hourlyRateMax" INTEGER,
    "yearsExperience" INTEGER,
    "foundedYear" INTEGER,
    "teamSize" "TeamSize",
    "marketFocus" "MarketFocus" DEFAULT 'B2C',
    "emergencyService" BOOLEAN NOT NULL DEFAULT false,
    "availabilityStatus" "AvailabilityStatus" NOT NULL DEFAULT 'UNKNOWN',
    "availabilityUpdatedAt" TIMESTAMP(3),
    "responseTime" TEXT,
    "specialties" TEXT[],
    "profileClaimed" BOOLEAN NOT NULL DEFAULT false,
    "claimToken" TEXT,
    "claimTokenExpiry" TIMESTAMP(3),
    "kvkVerified" BOOLEAN NOT NULL DEFAULT false,
    "kvkVerifiedAt" TIMESTAMP(3),
    "ratingAvg" DOUBLE PRECISION,
    "ratingCount" INTEGER NOT NULL DEFAULT 0,
    "googleRating" DOUBLE PRECISION,
    "googleReviewsCount" INTEGER,
    "tier" "Tier" NOT NULL DEFAULT 'FREE',
    "tierStartedAt" TIMESTAMP(3),
    "tierExpiresAt" TIMESTAMP(3),
    "subscriptionId" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "featuredUntil" TIMESTAMP(3),
    "boostScore" INTEGER NOT NULL DEFAULT 0,
    "qualityScore" INTEGER NOT NULL DEFAULT 0,
    "sourcesUsed" TEXT[],
    "sourceId" TEXT,
    "sourceName" TEXT,
    "privacySensitive" BOOLEAN NOT NULL DEFAULT false,
    "scrapedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tradesperson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TradespersonTrade" (
    "tradespersonId" TEXT NOT NULL,
    "tradeId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "sbiCode" TEXT,
    "sbiName" TEXT,
    "sbiScore" INTEGER,

    CONSTRAINT "TradespersonTrade_pkey" PRIMARY KEY ("tradespersonId","tradeId")
);

-- CreateTable
CREATE TABLE "TradespersonServiceArea" (
    "tradespersonId" TEXT NOT NULL,
    "cityId" TEXT NOT NULL,

    CONSTRAINT "TradespersonServiceArea_pkey" PRIMARY KEY ("tradespersonId","cityId")
);

-- CreateTable
CREATE TABLE "Certification" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "iconUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Certification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TradespersonCertification" (
    "tradespersonId" TEXT NOT NULL,
    "certificationId" TEXT NOT NULL,
    "validUntil" TIMESTAMP(3),

    CONSTRAINT "TradespersonCertification_pkey" PRIMARY KEY ("tradespersonId","certificationId")
);

-- CreateTable
CREATE TABLE "IndustryAssociation" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT,
    "iconUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IndustryAssociation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TradespersonAssociation" (
    "tradespersonId" TEXT NOT NULL,
    "associationId" TEXT NOT NULL,
    "detectionMethod" TEXT,

    CONSTRAINT "TradespersonAssociation_pkey" PRIMARY KEY ("tradespersonId","associationId")
);

-- CreateTable
CREATE TABLE "TradespersonReviewSource" (
    "id" TEXT NOT NULL,
    "tradespersonId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "rating" DOUBLE PRECISION,
    "reviewCount" INTEGER,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TradespersonReviewSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TradespersonPhoto" (
    "id" TEXT NOT NULL,
    "tradespersonId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "altText" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isCover" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TradespersonPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "tradespersonId" TEXT NOT NULL,
    "reviewerName" TEXT NOT NULL,
    "reviewerCity" TEXT,
    "reviewerEmailHash" TEXT,
    "rating" INTEGER NOT NULL,
    "title" TEXT,
    "body" TEXT NOT NULL,
    "jobDate" TEXT,
    "tradeId" TEXT,
    "verificationMethod" "VerificationMethod" NOT NULL DEFAULT 'UNVERIFIED',
    "status" "ReviewStatus" NOT NULL DEFAULT 'PENDING',
    "flagged" BOOLEAN NOT NULL DEFAULT false,
    "flagReason" TEXT,
    "ownerResponse" TEXT,
    "ownerResponseAt" TIMESTAMP(3),
    "ipAddressHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlogPost" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "metaDescription" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "coverImageUrl" TEXT,
    "coverImageAlt" TEXT,
    "authorName" TEXT NOT NULL DEFAULT 'Klushulpgids Redactie',
    "category" "BlogCategory" NOT NULL,
    "relatedTradeId" TEXT,
    "relatedCityId" TEXT,
    "faqItems" JSONB,
    "howToSteps" JSONB,
    "publishedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlogPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "role" "UserRole" NOT NULL DEFAULT 'TRADESPERSON',
    "tradespersonId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "PageView" (
    "id" TEXT NOT NULL,
    "tradespersonId" TEXT NOT NULL,
    "eventType" "EventType" NOT NULL,
    "sessionHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PageView_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OptOutBlacklist" (
    "id" TEXT NOT NULL,
    "kvkNumber" TEXT,
    "emailHash" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OptOutBlacklist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplianceLog" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "metadata" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComplianceLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "tradespersonId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "status" "PaymentStatus" NOT NULL,
    "provider" TEXT NOT NULL,
    "providerPaymentId" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3),

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sponsorship" (
    "id" TEXT NOT NULL,
    "tradespersonId" TEXT NOT NULL,
    "cityId" TEXT NOT NULL,
    "tradeId" TEXT NOT NULL,
    "slotType" "SponsorSlot" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "pricePerDay" INTEGER NOT NULL,
    "totalPrice" INTEGER NOT NULL,
    "status" "SponsorStatus" NOT NULL DEFAULT 'PENDING',
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Sponsorship_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Trade_slug_key" ON "Trade"("slug");

-- CreateIndex
CREATE INDEX "Trade_slug_idx" ON "Trade"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "City_slug_key" ON "City"("slug");

-- CreateIndex
CREATE INDEX "City_slug_idx" ON "City"("slug");

-- CreateIndex
CREATE INDEX "City_province_idx" ON "City"("province");

-- CreateIndex
CREATE UNIQUE INDEX "Tradesperson_slug_key" ON "Tradesperson"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Tradesperson_kvkNumber_key" ON "Tradesperson"("kvkNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Tradesperson_emailHash_key" ON "Tradesperson"("emailHash");

-- CreateIndex
CREATE UNIQUE INDEX "Tradesperson_claimToken_key" ON "Tradesperson"("claimToken");

-- CreateIndex
CREATE INDEX "Tradesperson_slug_idx" ON "Tradesperson"("slug");

-- CreateIndex
CREATE INDEX "Tradesperson_cityId_idx" ON "Tradesperson"("cityId");

-- CreateIndex
CREATE INDEX "Tradesperson_availabilityStatus_idx" ON "Tradesperson"("availabilityStatus");

-- CreateIndex
CREATE INDEX "Tradesperson_qualityScore_idx" ON "Tradesperson"("qualityScore" DESC);

-- CreateIndex
CREATE INDEX "Tradesperson_featured_idx" ON "Tradesperson"("featured");

-- CreateIndex
CREATE INDEX "Tradesperson_tier_idx" ON "Tradesperson"("tier");

-- CreateIndex
CREATE INDEX "Tradesperson_boostScore_idx" ON "Tradesperson"("boostScore" DESC);

-- CreateIndex
CREATE INDEX "Tradesperson_ratingAvg_idx" ON "Tradesperson"("ratingAvg" DESC);

-- CreateIndex
CREATE INDEX "TradespersonTrade_tradeId_idx" ON "TradespersonTrade"("tradeId");

-- CreateIndex
CREATE INDEX "TradespersonServiceArea_cityId_idx" ON "TradespersonServiceArea"("cityId");

-- CreateIndex
CREATE UNIQUE INDEX "Certification_slug_key" ON "Certification"("slug");

-- CreateIndex
CREATE INDEX "TradespersonCertification_certificationId_idx" ON "TradespersonCertification"("certificationId");

-- CreateIndex
CREATE UNIQUE INDEX "IndustryAssociation_slug_key" ON "IndustryAssociation"("slug");

-- CreateIndex
CREATE INDEX "TradespersonAssociation_associationId_idx" ON "TradespersonAssociation"("associationId");

-- CreateIndex
CREATE INDEX "TradespersonReviewSource_tradespersonId_idx" ON "TradespersonReviewSource"("tradespersonId");

-- CreateIndex
CREATE INDEX "TradespersonPhoto_tradespersonId_displayOrder_idx" ON "TradespersonPhoto"("tradespersonId", "displayOrder");

-- CreateIndex
CREATE INDEX "Review_tradespersonId_idx" ON "Review"("tradespersonId");

-- CreateIndex
CREATE INDEX "Review_status_idx" ON "Review"("status");

-- CreateIndex
CREATE INDEX "Review_createdAt_idx" ON "Review"("createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "BlogPost_slug_key" ON "BlogPost"("slug");

-- CreateIndex
CREATE INDEX "BlogPost_slug_idx" ON "BlogPost"("slug");

-- CreateIndex
CREATE INDEX "BlogPost_publishedAt_idx" ON "BlogPost"("publishedAt" DESC);

-- CreateIndex
CREATE INDEX "BlogPost_category_idx" ON "BlogPost"("category");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_tradespersonId_key" ON "User"("tradespersonId");

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE INDEX "PageView_tradespersonId_createdAt_idx" ON "PageView"("tradespersonId", "createdAt");

-- CreateIndex
CREATE INDEX "PageView_eventType_idx" ON "PageView"("eventType");

-- CreateIndex
CREATE UNIQUE INDEX "OptOutBlacklist_kvkNumber_key" ON "OptOutBlacklist"("kvkNumber");

-- CreateIndex
CREATE UNIQUE INDEX "OptOutBlacklist_emailHash_key" ON "OptOutBlacklist"("emailHash");

-- CreateIndex
CREATE INDEX "ComplianceLog_eventType_idx" ON "ComplianceLog"("eventType");

-- CreateIndex
CREATE INDEX "ComplianceLog_createdAt_idx" ON "ComplianceLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_providerPaymentId_key" ON "Payment"("providerPaymentId");

-- CreateIndex
CREATE INDEX "Payment_tradespersonId_idx" ON "Payment"("tradespersonId");

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "Payment"("status");

-- CreateIndex
CREATE INDEX "Sponsorship_cityId_tradeId_idx" ON "Sponsorship"("cityId", "tradeId");

-- CreateIndex
CREATE INDEX "Sponsorship_startDate_endDate_idx" ON "Sponsorship"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "Sponsorship_status_idx" ON "Sponsorship"("status");

-- AddForeignKey
ALTER TABLE "Tradesperson" ADD CONSTRAINT "Tradesperson_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TradespersonTrade" ADD CONSTRAINT "TradespersonTrade_tradespersonId_fkey" FOREIGN KEY ("tradespersonId") REFERENCES "Tradesperson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TradespersonTrade" ADD CONSTRAINT "TradespersonTrade_tradeId_fkey" FOREIGN KEY ("tradeId") REFERENCES "Trade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TradespersonServiceArea" ADD CONSTRAINT "TradespersonServiceArea_tradespersonId_fkey" FOREIGN KEY ("tradespersonId") REFERENCES "Tradesperson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TradespersonServiceArea" ADD CONSTRAINT "TradespersonServiceArea_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TradespersonCertification" ADD CONSTRAINT "TradespersonCertification_tradespersonId_fkey" FOREIGN KEY ("tradespersonId") REFERENCES "Tradesperson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TradespersonCertification" ADD CONSTRAINT "TradespersonCertification_certificationId_fkey" FOREIGN KEY ("certificationId") REFERENCES "Certification"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TradespersonAssociation" ADD CONSTRAINT "TradespersonAssociation_tradespersonId_fkey" FOREIGN KEY ("tradespersonId") REFERENCES "Tradesperson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TradespersonAssociation" ADD CONSTRAINT "TradespersonAssociation_associationId_fkey" FOREIGN KEY ("associationId") REFERENCES "IndustryAssociation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TradespersonReviewSource" ADD CONSTRAINT "TradespersonReviewSource_tradespersonId_fkey" FOREIGN KEY ("tradespersonId") REFERENCES "Tradesperson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TradespersonPhoto" ADD CONSTRAINT "TradespersonPhoto_tradespersonId_fkey" FOREIGN KEY ("tradespersonId") REFERENCES "Tradesperson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_tradespersonId_fkey" FOREIGN KEY ("tradespersonId") REFERENCES "Tradesperson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogPost" ADD CONSTRAINT "BlogPost_relatedTradeId_fkey" FOREIGN KEY ("relatedTradeId") REFERENCES "Trade"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogPost" ADD CONSTRAINT "BlogPost_relatedCityId_fkey" FOREIGN KEY ("relatedCityId") REFERENCES "City"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PageView" ADD CONSTRAINT "PageView_tradespersonId_fkey" FOREIGN KEY ("tradespersonId") REFERENCES "Tradesperson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

