-- CreateEnum
CREATE TYPE "PlanInterval" AS ENUM ('MONTHLY', 'YEARLY', 'LIFETIME');

-- CreateEnum
CREATE TYPE "PlatformSubscriptionStatus" AS ENUM ('TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELLED', 'EXPIRED');

-- CreateTable
CREATE TABLE "PlatformPlan" (
    "planid" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "interval" "PlanInterval" NOT NULL DEFAULT 'MONTHLY',
    "features" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "trialDays" INTEGER NOT NULL DEFAULT 0,
    "maxUsers" INTEGER,
    "maxBranches" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformPlan_pkey" PRIMARY KEY ("planid")
);

-- CreateTable
CREATE TABLE "PlatformSubscription" (
    "subscriptionid" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "subscriberUserId" TEXT,
    "organizationName" TEXT NOT NULL,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "status" "PlatformSubscriptionStatus" NOT NULL DEFAULT 'TRIALING',
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformSubscription_pkey" PRIMARY KEY ("subscriptionid")
);

-- CreateTable
CREATE TABLE "CmsContent" (
    "cmscontentid" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "title" TEXT,
    "data" JSONB NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CmsContent_pkey" PRIMARY KEY ("cmscontentid")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlatformPlan_code_key" ON "PlatformPlan"("code");

-- CreateIndex
CREATE INDEX "PlatformPlan_isActive_isPublic_sortOrder_idx" ON "PlatformPlan"("isActive", "isPublic", "sortOrder");

-- CreateIndex
CREATE INDEX "PlatformSubscription_status_startsAt_idx" ON "PlatformSubscription"("status", "startsAt");

-- CreateIndex
CREATE INDEX "PlatformSubscription_planId_idx" ON "PlatformSubscription"("planId");

-- CreateIndex
CREATE INDEX "PlatformSubscription_subscriberUserId_idx" ON "PlatformSubscription"("subscriberUserId");

-- CreateIndex
CREATE UNIQUE INDEX "CmsContent_key_key" ON "CmsContent"("key");

-- CreateIndex
CREATE INDEX "CmsContent_published_idx" ON "CmsContent"("published");

-- AddForeignKey
ALTER TABLE "PlatformSubscription" ADD CONSTRAINT "PlatformSubscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "PlatformPlan"("planid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlatformSubscription" ADD CONSTRAINT "PlatformSubscription_subscriberUserId_fkey" FOREIGN KEY ("subscriberUserId") REFERENCES "User"("userid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CmsContent" ADD CONSTRAINT "CmsContent_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("userid") ON DELETE SET NULL ON UPDATE CASCADE;
