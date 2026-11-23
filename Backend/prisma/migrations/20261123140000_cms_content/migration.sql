-- CreateEnum
CREATE TYPE "CmsPageStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "TeamMemberCategory" AS ENUM ('BOARD', 'EXECUTIVE', 'DEPARTMENT', 'STAFF', 'PARTNER', 'SPONSOR', 'VOLUNTEER');

-- CreateTable
CREATE TABLE "CmsPage" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "summary" TEXT,
    "heroImageUrl" TEXT,
    "body" JSONB,
    "highlights" JSONB,
    "quote" JSONB,
    "cta" JSONB,
    "locale" TEXT NOT NULL DEFAULT 'en',
    "status" "CmsPageStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CmsPage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamMember" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "department" TEXT,
    "category" "TeamMemberCategory" NOT NULL DEFAULT 'STAFF',
    "bio" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "photoUrl" TEXT,
    "expertise" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "education" TEXT,
    "yearsExperience" INTEGER,
    "socialLinks" JSONB,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CmsPage_slug_key" ON "CmsPage"("slug");

-- CreateIndex
CREATE INDEX "CmsPage_status_idx" ON "CmsPage"("status");

-- CreateIndex
CREATE INDEX "CmsPage_locale_idx" ON "CmsPage"("locale");

-- CreateIndex
CREATE INDEX "CmsPage_sortOrder_idx" ON "CmsPage"("sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "TeamMember_slug_key" ON "TeamMember"("slug");

-- CreateIndex
CREATE INDEX "TeamMember_category_sortOrder_idx" ON "TeamMember"("category", "sortOrder");

-- CreateIndex
CREATE INDEX "TeamMember_isPublished_idx" ON "TeamMember"("isPublished");

-- CreateIndex
CREATE INDEX "TeamMember_isFeatured_idx" ON "TeamMember"("isFeatured");
