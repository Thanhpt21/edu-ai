-- AlterTable
ALTER TABLE "HeygenVideo" ADD COLUMN     "downloadedAt" TIMESTAMP(3),
ADD COLUMN     "isDownloaded" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "supabaseVideoUrl" TEXT;
