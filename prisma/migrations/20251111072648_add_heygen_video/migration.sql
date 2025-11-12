-- CreateEnum
CREATE TYPE "HeygenVideoStatus" AS ENUM ('PENDING', 'WAITING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "HeygenAssetType" AS ENUM ('IMAGE', 'VIDEO', 'AUDIO');

-- CreateEnum
CREATE TYPE "BackgroundPlayStyle" AS ENUM ('FIT_TO_SCENE', 'FREEZE', 'LOOP', 'FULL_VIDEO');

-- CreateTable
CREATE TABLE "HeygenAvatar" (
    "id" SERIAL NOT NULL,
    "avatarId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT,
    "gender" TEXT,
    "preview_image" TEXT,
    "preview_video" TEXT,
    "avatar_style" TEXT NOT NULL DEFAULT 'normal',
    "is_customized" BOOLEAN NOT NULL DEFAULT false,
    "is_instant" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HeygenAvatar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HeygenVoice" (
    "id" SERIAL NOT NULL,
    "voiceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT,
    "gender" TEXT,
    "language" TEXT,
    "language_code" TEXT,
    "preview_audio" TEXT,
    "is_customized" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HeygenVoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HeygenVideo" (
    "id" SERIAL NOT NULL,
    "videoId" TEXT NOT NULL,
    "userId" INTEGER,
    "lessonId" INTEGER,
    "avatarId" INTEGER NOT NULL,
    "voiceId" INTEGER NOT NULL,
    "title" TEXT,
    "inputText" TEXT NOT NULL,
    "status" "HeygenVideoStatus" NOT NULL DEFAULT 'PENDING',
    "backgroundType" TEXT,
    "backgroundColor" TEXT,
    "backgroundImageUrl" TEXT,
    "backgroundVideoUrl" TEXT,
    "backgroundPlayStyle" "BackgroundPlayStyle",
    "dimensionWidth" INTEGER NOT NULL DEFAULT 1280,
    "dimensionHeight" INTEGER NOT NULL DEFAULT 720,
    "isWebM" BOOLEAN NOT NULL DEFAULT false,
    "videoUrl" TEXT,
    "thumbnailUrl" TEXT,
    "duration" DOUBLE PRECISION,
    "errorMessage" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "lastError" TEXT,
    "webhookSecret" TEXT,

    CONSTRAINT "HeygenVideo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HeygenAsset" (
    "id" SERIAL NOT NULL,
    "assetId" TEXT NOT NULL,
    "assetType" "HeygenAssetType" NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "fileSize" INTEGER,
    "duration" DOUBLE PRECISION,
    "uploadedBy" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HeygenAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HeygenTemplate" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "avatarId" INTEGER NOT NULL,
    "voiceId" INTEGER NOT NULL,
    "backgroundType" TEXT,
    "backgroundColor" TEXT,
    "backgroundUrl" TEXT,
    "inputText" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" INTEGER,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HeygenTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HeygenAvatar_avatarId_key" ON "HeygenAvatar"("avatarId");

-- CreateIndex
CREATE INDEX "HeygenAvatar_avatarId_idx" ON "HeygenAvatar"("avatarId");

-- CreateIndex
CREATE UNIQUE INDEX "HeygenVoice_voiceId_key" ON "HeygenVoice"("voiceId");

-- CreateIndex
CREATE INDEX "HeygenVoice_voiceId_idx" ON "HeygenVoice"("voiceId");

-- CreateIndex
CREATE INDEX "HeygenVoice_language_idx" ON "HeygenVoice"("language");

-- CreateIndex
CREATE UNIQUE INDEX "HeygenVideo_videoId_key" ON "HeygenVideo"("videoId");

-- CreateIndex
CREATE UNIQUE INDEX "HeygenVideo_webhookSecret_key" ON "HeygenVideo"("webhookSecret");

-- CreateIndex
CREATE INDEX "HeygenVideo_userId_idx" ON "HeygenVideo"("userId");

-- CreateIndex
CREATE INDEX "HeygenVideo_lessonId_idx" ON "HeygenVideo"("lessonId");

-- CreateIndex
CREATE INDEX "HeygenVideo_status_idx" ON "HeygenVideo"("status");

-- CreateIndex
CREATE INDEX "HeygenVideo_createdAt_idx" ON "HeygenVideo"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "HeygenAsset_assetId_key" ON "HeygenAsset"("assetId");

-- CreateIndex
CREATE INDEX "HeygenAsset_assetType_idx" ON "HeygenAsset"("assetType");

-- CreateIndex
CREATE INDEX "HeygenAsset_uploadedBy_idx" ON "HeygenAsset"("uploadedBy");

-- CreateIndex
CREATE INDEX "HeygenTemplate_isPublic_idx" ON "HeygenTemplate"("isPublic");

-- CreateIndex
CREATE INDEX "HeygenTemplate_createdBy_idx" ON "HeygenTemplate"("createdBy");

-- AddForeignKey
ALTER TABLE "HeygenVideo" ADD CONSTRAINT "HeygenVideo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HeygenVideo" ADD CONSTRAINT "HeygenVideo_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HeygenVideo" ADD CONSTRAINT "HeygenVideo_avatarId_fkey" FOREIGN KEY ("avatarId") REFERENCES "HeygenAvatar"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HeygenVideo" ADD CONSTRAINT "HeygenVideo_voiceId_fkey" FOREIGN KEY ("voiceId") REFERENCES "HeygenVoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HeygenAsset" ADD CONSTRAINT "HeygenAsset_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HeygenTemplate" ADD CONSTRAINT "HeygenTemplate_avatarId_fkey" FOREIGN KEY ("avatarId") REFERENCES "HeygenAvatar"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HeygenTemplate" ADD CONSTRAINT "HeygenTemplate_voiceId_fkey" FOREIGN KEY ("voiceId") REFERENCES "HeygenVoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HeygenTemplate" ADD CONSTRAINT "HeygenTemplate_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
