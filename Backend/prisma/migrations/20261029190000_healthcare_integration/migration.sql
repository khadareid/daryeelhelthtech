-- Healthtech healthcare integration mirror fields

ALTER TYPE "AppointmentStatus" ADD VALUE IF NOT EXISTS 'PENDING';
ALTER TYPE "AppointmentStatus" ADD VALUE IF NOT EXISTS 'ACCEPTED';
ALTER TYPE "AppointmentStatus" ADD VALUE IF NOT EXISTS 'REJECTED';
ALTER TYPE "AppointmentStatus" ADD VALUE IF NOT EXISTS 'RESCHEDULE_REQUESTED';
ALTER TYPE "AppointmentStatus" ADD VALUE IF NOT EXISTS 'CANCELLED_BY_PATIENT';
ALTER TYPE "AppointmentStatus" ADD VALUE IF NOT EXISTS 'CANCELLED_BY_HOSPITAL';
ALTER TYPE "AppointmentStatus" ADD VALUE IF NOT EXISTS 'IN_PROGRESS';

DO $$ BEGIN
  CREATE TYPE "PaymentStatusMirror" AS ENUM ('UNPAID', 'PENDING', 'PAID', 'PARTIALLY_PAID', 'WAIVED', 'REFUNDED', 'NOT_REQUIRED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'APPOINTMENT_ACCEPTED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'APPOINTMENT_REJECTED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'APPOINTMENT_RESCHEDULE';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'OPD_TICKET';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'VISIT_UPDATE';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'REVIEW_REMINDER';

ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "department" TEXT;
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "saasAppointmentId" TEXT;
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "saasTenantId" TEXT;
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "saasDoctorId" TEXT;
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "saasTicketId" TEXT;
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "saasTicketNumber" TEXT;
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "saasVisitId" TEXT;
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "idempotencyKey" TEXT;
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "source" TEXT NOT NULL DEFAULT 'HEALTHTECH';
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "proposedScheduledAt" TIMESTAMP(3);
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "proposedMessage" TEXT;
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "rejectionReason" TEXT;
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "paymentStatus" "PaymentStatusMirror" NOT NULL DEFAULT 'UNPAID';
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "consultationFee" DECIMAL(10,2);
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "currency" TEXT DEFAULT 'USD';
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "consentId" TEXT;
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "confirmedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX IF NOT EXISTS "Appointment_saasAppointmentId_key" ON "Appointment"("saasAppointmentId");
CREATE UNIQUE INDEX IF NOT EXISTS "Appointment_idempotencyKey_key" ON "Appointment"("idempotencyKey");
CREATE INDEX IF NOT EXISTS "Appointment_saasTenantId_idx" ON "Appointment"("saasTenantId");
CREATE INDEX IF NOT EXISTS "Appointment_saasDoctorId_idx" ON "Appointment"("saasDoctorId");
CREATE INDEX IF NOT EXISTS "Appointment_paymentStatus_idx" ON "Appointment"("paymentStatus");

CREATE TABLE IF NOT EXISTS "DoctorReview" (
    "reviewid" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "saasDoctorId" TEXT NOT NULL,
    "saasTenantId" TEXT,
    "saasReviewId" TEXT,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "professionalism" INTEGER,
    "communication" INTEGER,
    "waitingTime" INTEGER,
    "careQuality" INTEGER,
    "overallExperience" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DoctorReview_pkey" PRIMARY KEY ("reviewid")
);

CREATE UNIQUE INDEX IF NOT EXISTS "DoctorReview_appointmentId_key" ON "DoctorReview"("appointmentId");
CREATE INDEX IF NOT EXISTS "DoctorReview_userId_idx" ON "DoctorReview"("userId");
CREATE INDEX IF NOT EXISTS "DoctorReview_saasDoctorId_idx" ON "DoctorReview"("saasDoctorId");
CREATE INDEX IF NOT EXISTS "DoctorReview_rating_idx" ON "DoctorReview"("rating");

CREATE TABLE IF NOT EXISTS "HealthcareActivityEvent" (
    "eventid" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "appointmentId" TEXT,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "metadata" JSONB,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HealthcareActivityEvent_pkey" PRIMARY KEY ("eventid")
);

CREATE INDEX IF NOT EXISTS "HealthcareActivityEvent_userId_occurredAt_idx" ON "HealthcareActivityEvent"("userId", "occurredAt");
CREATE INDEX IF NOT EXISTS "HealthcareActivityEvent_appointmentId_idx" ON "HealthcareActivityEvent"("appointmentId");
CREATE INDEX IF NOT EXISTS "HealthcareActivityEvent_type_idx" ON "HealthcareActivityEvent"("type");

DO $$ BEGIN
  ALTER TABLE "DoctorReview" ADD CONSTRAINT "DoctorReview_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("appointmentid") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "DoctorReview" ADD CONSTRAINT "DoctorReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userid") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "HealthcareActivityEvent" ADD CONSTRAINT "HealthcareActivityEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userid") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "HealthcareActivityEvent" ADD CONSTRAINT "HealthcareActivityEvent_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("appointmentid") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
