-- CreateEnum
CREATE TYPE "ConnectionStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'BLOCKED', 'ENDED');

-- CreateEnum
CREATE TYPE "ConnectionRequestedBy" AS ENUM ('PATIENT', 'PROFESSIONAL');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'CONNECTION';
ALTER TYPE "NotificationType" ADD VALUE 'MESSAGE';
ALTER TYPE "NotificationType" ADD VALUE 'APPOINTMENT';

-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "professionalUserId" TEXT;

-- AlterTable
ALTER TABLE "ProfessionalApplication" ADD COLUMN     "applicationCode" TEXT,
ADD COLUMN     "languages" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "licenseExpiry" TIMESTAMP(3),
ADD COLUMN     "professionalBio" TEXT,
ADD COLUMN     "subSpecialty" TEXT;

-- AlterTable
ALTER TABLE "ProfessionalProfile" ADD COLUMN     "facilityName" TEXT,
ADD COLUMN     "slug" TEXT,
ADD COLUMN     "workplace" TEXT;

-- CreateTable
CREATE TABLE "PatientProfessionalConnection" (
    "id" TEXT NOT NULL,
    "patientUserId" TEXT NOT NULL,
    "professionalUserId" TEXT NOT NULL,
    "status" "ConnectionStatus" NOT NULL DEFAULT 'PENDING',
    "requestedBy" "ConnectionRequestedBy" NOT NULL,
    "reason" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PatientProfessionalConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfessionalAvailability" (
    "id" TEXT NOT NULL,
    "professionalUserId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProfessionalAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PatientProfessionalConnection_patientUserId_status_idx" ON "PatientProfessionalConnection"("patientUserId", "status");

-- CreateIndex
CREATE INDEX "PatientProfessionalConnection_professionalUserId_status_idx" ON "PatientProfessionalConnection"("professionalUserId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "PatientProfessionalConnection_patientUserId_professionalUse_key" ON "PatientProfessionalConnection"("patientUserId", "professionalUserId");

-- CreateIndex
CREATE INDEX "ProfessionalAvailability_professionalUserId_dayOfWeek_idx" ON "ProfessionalAvailability"("professionalUserId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "Appointment_professionalUserId_scheduledAt_idx" ON "Appointment"("professionalUserId", "scheduledAt");

-- CreateIndex
CREATE INDEX "Message_senderId_recipientId_createdAt_idx" ON "Message"("senderId", "recipientId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ProfessionalApplication_applicationCode_key" ON "ProfessionalApplication"("applicationCode");

-- CreateIndex
CREATE UNIQUE INDEX "ProfessionalProfile_slug_key" ON "ProfessionalProfile"("slug");

-- CreateIndex
CREATE INDEX "ProfessionalProfile_slug_idx" ON "ProfessionalProfile"("slug");

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_professionalUserId_fkey" FOREIGN KEY ("professionalUserId") REFERENCES "User"("userid") ON DELETE SET NULL ON UPDATE CASCADE;

-- Clean orphan message recipients before FK
UPDATE "Message" m
SET "recipientId" = NULL
WHERE "recipientId" IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM "User" u WHERE u."userid" = m."recipientId");

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("userid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientProfessionalConnection" ADD CONSTRAINT "PatientProfessionalConnection_patientUserId_fkey" FOREIGN KEY ("patientUserId") REFERENCES "User"("userid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientProfessionalConnection" ADD CONSTRAINT "PatientProfessionalConnection_professionalUserId_fkey" FOREIGN KEY ("professionalUserId") REFERENCES "User"("userid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfessionalAvailability" ADD CONSTRAINT "ProfessionalAvailability_professionalUserId_fkey" FOREIGN KEY ("professionalUserId") REFERENCES "User"("userid") ON DELETE CASCADE ON UPDATE CASCADE;
