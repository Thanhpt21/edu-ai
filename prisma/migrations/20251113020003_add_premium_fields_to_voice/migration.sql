-- AlterTable
ALTER TABLE "HeygenVoice" ADD COLUMN     "is_free" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "is_premium" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "tier" TEXT DEFAULT 'free';

-- CreateIndex
CREATE INDEX "HeygenVoice_is_premium_idx" ON "HeygenVoice"("is_premium");

-- CreateIndex
CREATE INDEX "HeygenVoice_is_free_idx" ON "HeygenVoice"("is_free");

-- CreateIndex
CREATE INDEX "HeygenVoice_tier_idx" ON "HeygenVoice"("tier");
