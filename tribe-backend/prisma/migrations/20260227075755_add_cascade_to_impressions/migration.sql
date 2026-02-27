-- DropForeignKey
ALTER TABLE "FeedImpression" DROP CONSTRAINT "FeedImpression_targetId_fkey";

-- DropForeignKey
ALTER TABLE "FeedImpression" DROP CONSTRAINT "FeedImpression_viewerId_fkey";

-- AddForeignKey
ALTER TABLE "FeedImpression" ADD CONSTRAINT "FeedImpression_viewerId_fkey" FOREIGN KEY ("viewerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedImpression" ADD CONSTRAINT "FeedImpression_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
