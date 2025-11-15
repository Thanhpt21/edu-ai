-- AlterTable
ALTER TABLE "HeygenAvatar" ADD COLUMN     "is_free" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "is_premium" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "HeygenAvatar_is_premium_idx" ON "HeygenAvatar"("is_premium");

-- CreateIndex
CREATE INDEX "HeygenAvatar_is_free_idx" ON "HeygenAvatar"("is_free");
