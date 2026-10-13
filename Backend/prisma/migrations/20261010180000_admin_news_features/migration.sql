-- AlterEnum NotificationType (idempotent)
DO $$ BEGIN ALTER TYPE "NotificationType" ADD VALUE 'PROFESSIONAL_APPLICATION'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE "NotificationType" ADD VALUE 'NEWS_INTERACTION'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE "NotificationType" ADD VALUE 'MODERATION'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- CreateEnum
CREATE TYPE "FeatureClient" AS ENUM ('ALL', 'WEB', 'MOBILE');
CREATE TYPE "ProfessionalApplicationStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'MORE_INFORMATION_REQUIRED');
CREATE TYPE "NewsCategory" AS ENUM ('HEALTH_NEWS', 'PUBLIC_HEALTH', 'MEDICAL_EDUCATION', 'HOSPITAL_UPDATES', 'PROFESSIONAL_NEWS', 'COMMUNITY_HEALTH', 'GENERAL', 'OFFICIAL_ANNOUNCEMENT');
CREATE TYPE "NewsPostStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'HIDDEN', 'REMOVED');
CREATE TYPE "NewsVisibility" AS ENUM ('PUBLIC', 'AUTHENTICATED', 'PROFESSIONALS', 'PRIVATE');
CREATE TYPE "NewsReactionType" AS ENUM ('LIKE', 'HELPFUL', 'INSIGHTFUL');
CREATE TYPE "NewsReportReason" AS ENUM ('MISINFORMATION', 'SPAM', 'HARASSMENT', 'IMPERSONATION', 'INAPPROPRIATE', 'PRIVACY_VIOLATION', 'OTHER');
CREATE TYPE "NewsReportStatus" AS ENUM ('OPEN', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED');

-- FeatureFlag
CREATE TABLE "FeatureFlag" (
    "featureflagid" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "client" "FeatureClient" NOT NULL DEFAULT 'ALL',
    "allowedRoles" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "actions" TEXT[] DEFAULT ARRAY['read']::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "FeatureFlag_pkey" PRIMARY KEY ("featureflagid")
);
CREATE UNIQUE INDEX "FeatureFlag_key_key" ON "FeatureFlag"("key");
CREATE INDEX "FeatureFlag_enabled_idx" ON "FeatureFlag"("enabled");

CREATE TABLE "FeatureUserOverride" (
    "featureuseroverrideid" TEXT NOT NULL,
    "featureFlagId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL,
    "actions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "FeatureUserOverride_pkey" PRIMARY KEY ("featureuseroverrideid")
);
CREATE UNIQUE INDEX "FeatureUserOverride_featureFlagId_userId_key" ON "FeatureUserOverride"("featureFlagId", "userId");
CREATE INDEX "FeatureUserOverride_userId_idx" ON "FeatureUserOverride"("userId");
ALTER TABLE "FeatureUserOverride" ADD CONSTRAINT "FeatureUserOverride_featureFlagId_fkey" FOREIGN KEY ("featureFlagId") REFERENCES "FeatureFlag"("featureflagid") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FeatureUserOverride" ADD CONSTRAINT "FeatureUserOverride_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userid") ON DELETE CASCADE ON UPDATE CASCADE;

-- ProfessionalApplication
CREATE TABLE "ProfessionalApplication" (
    "professionalapplicationid" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "requestedRole" "Role" NOT NULL,
    "licenseNumber" TEXT,
    "qualifications" TEXT,
    "specialization" TEXT,
    "yearsOfExperience" INTEGER,
    "facilityName" TEXT,
    "workplace" TEXT,
    "supportingDocs" JSONB,
    "notes" TEXT,
    "status" "ProfessionalApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "reviewNotes" TEXT,
    "rejectionReason" TEXT,
    "reviewedById" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "decidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ProfessionalApplication_pkey" PRIMARY KEY ("professionalapplicationid")
);
CREATE INDEX "ProfessionalApplication_userId_requestedRole_idx" ON "ProfessionalApplication"("userId", "requestedRole");
CREATE INDEX "ProfessionalApplication_status_idx" ON "ProfessionalApplication"("status");
CREATE INDEX "ProfessionalApplication_submittedAt_idx" ON "ProfessionalApplication"("submittedAt");
ALTER TABLE "ProfessionalApplication" ADD CONSTRAINT "ProfessionalApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userid") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProfessionalApplication" ADD CONSTRAINT "ProfessionalApplication_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("userid") ON DELETE SET NULL ON UPDATE CASCADE;

-- News
CREATE TABLE "NewsPost" (
    "newspostid" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" "NewsCategory" NOT NULL DEFAULT 'HEALTH_NEWS',
    "status" "NewsPostStatus" NOT NULL DEFAULT 'DRAFT',
    "visibility" "NewsVisibility" NOT NULL DEFAULT 'PUBLIC',
    "coverImageUrl" TEXT,
    "isOfficial" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    CONSTRAINT "NewsPost_pkey" PRIMARY KEY ("newspostid")
);
CREATE INDEX "NewsPost_status_publishedAt_idx" ON "NewsPost"("status", "publishedAt");
CREATE INDEX "NewsPost_authorId_idx" ON "NewsPost"("authorId");
CREATE INDEX "NewsPost_category_idx" ON "NewsPost"("category");
ALTER TABLE "NewsPost" ADD CONSTRAINT "NewsPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("userid") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "NewsComment" (
    "newscommentid" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "parentCommentId" TEXT,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    CONSTRAINT "NewsComment_pkey" PRIMARY KEY ("newscommentid")
);
CREATE INDEX "NewsComment_postId_createdAt_idx" ON "NewsComment"("postId", "createdAt");
CREATE INDEX "NewsComment_authorId_idx" ON "NewsComment"("authorId");
ALTER TABLE "NewsComment" ADD CONSTRAINT "NewsComment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "NewsPost"("newspostid") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NewsComment" ADD CONSTRAINT "NewsComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("userid") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NewsComment" ADD CONSTRAINT "NewsComment_parentCommentId_fkey" FOREIGN KEY ("parentCommentId") REFERENCES "NewsComment"("newscommentid") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "NewsReaction" (
    "newsreactionid" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reactionType" "NewsReactionType" NOT NULL DEFAULT 'LIKE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NewsReaction_pkey" PRIMARY KEY ("newsreactionid")
);
CREATE UNIQUE INDEX "NewsReaction_postId_userId_key" ON "NewsReaction"("postId", "userId");
CREATE INDEX "NewsReaction_postId_idx" ON "NewsReaction"("postId");
ALTER TABLE "NewsReaction" ADD CONSTRAINT "NewsReaction_postId_fkey" FOREIGN KEY ("postId") REFERENCES "NewsPost"("newspostid") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NewsReaction" ADD CONSTRAINT "NewsReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userid") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "NewsReport" (
    "newsreportid" TEXT NOT NULL,
    "postId" TEXT,
    "commentId" TEXT,
    "reporterId" TEXT NOT NULL,
    "reason" "NewsReportReason" NOT NULL,
    "details" TEXT,
    "status" "NewsReportStatus" NOT NULL DEFAULT 'OPEN',
    "reviewedById" TEXT,
    "reviewNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    CONSTRAINT "NewsReport_pkey" PRIMARY KEY ("newsreportid")
);
CREATE INDEX "NewsReport_status_createdAt_idx" ON "NewsReport"("status", "createdAt");
CREATE INDEX "NewsReport_postId_idx" ON "NewsReport"("postId");
CREATE INDEX "NewsReport_commentId_idx" ON "NewsReport"("commentId");
ALTER TABLE "NewsReport" ADD CONSTRAINT "NewsReport_postId_fkey" FOREIGN KEY ("postId") REFERENCES "NewsPost"("newspostid") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NewsReport" ADD CONSTRAINT "NewsReport_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "NewsComment"("newscommentid") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NewsReport" ADD CONSTRAINT "NewsReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("userid") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NewsReport" ADD CONSTRAINT "NewsReport_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("userid") ON DELETE SET NULL ON UPDATE CASCADE;
