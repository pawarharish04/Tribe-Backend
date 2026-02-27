-- CreateTable
CREATE TABLE "FeedImpression" (
    "id" TEXT NOT NULL,
    "viewerId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "shownAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeedImpression_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FeedImpression_viewerId_idx" ON "FeedImpression"("viewerId");

-- CreateIndex
CREATE UNIQUE INDEX "FeedImpression_viewerId_targetId_key" ON "FeedImpression"("viewerId", "targetId");

-- AddForeignKey
ALTER TABLE "FeedImpression" ADD CONSTRAINT "FeedImpression_viewerId_fkey" FOREIGN KEY ("viewerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedImpression" ADD CONSTRAINT "FeedImpression_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
