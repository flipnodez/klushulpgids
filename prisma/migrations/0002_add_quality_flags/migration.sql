-- Add data-quality vlaggen + enrichment metadata aan Tradesperson.

ALTER TABLE "Tradesperson"
  ADD COLUMN "reviewNeeded"         BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "phoneInvalid"         BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "emailDnsInvalid"      BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "emailWebsiteMismatch" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "websiteStatus"        TEXT,
  ADD COLUMN "trustScore"           INTEGER,
  ADD COLUMN "enrichmentMeta"       JSONB;

CREATE INDEX "Tradesperson_reviewNeeded_idx" ON "Tradesperson"("reviewNeeded");
CREATE INDEX "Tradesperson_trustScore_idx"   ON "Tradesperson"("trustScore");
