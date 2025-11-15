-- CreateTable
CREATE TABLE "HeygenAvatarIVVideo" (
    "id" SERIAL NOT NULL,
    "videoId" TEXT,
    "title" TEXT NOT NULL,
    "imageKey" TEXT NOT NULL,
    "script" TEXT NOT NULL,
    "voiceId" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'vi',
    "customMotion" TEXT,
    "enhanceMotion" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'processing',
    "videoUrl" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER,

    CONSTRAINT "HeygenAvatarIVVideo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HeygenAvatarIVVideo_videoId_key" ON "HeygenAvatarIVVideo"("videoId");

-- CreateIndex
CREATE INDEX "HeygenAvatarIVVideo_videoId_idx" ON "HeygenAvatarIVVideo"("videoId");

-- CreateIndex
CREATE INDEX "HeygenAvatarIVVideo_status_idx" ON "HeygenAvatarIVVideo"("status");

-- CreateIndex
CREATE INDEX "HeygenAvatarIVVideo_userId_idx" ON "HeygenAvatarIVVideo"("userId");

-- CreateIndex
CREATE INDEX "HeygenAvatarIVVideo_createdAt_idx" ON "HeygenAvatarIVVideo"("createdAt");

-- AddForeignKey
ALTER TABLE "HeygenAvatarIVVideo" ADD CONSTRAINT "HeygenAvatarIVVideo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
