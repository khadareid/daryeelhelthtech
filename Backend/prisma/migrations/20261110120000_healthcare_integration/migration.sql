-- CreateEnum
CREATE TYPE "AppointmentSource" AS ENUM ('LOCAL', 'HEALTHTECH');

-- CreateEnum
CREATE TYPE "HospitalPaymentStatus" AS ENUM ('UNPAID', 'PENDING', 'PAID', 'PARTIALLY_PAID', 'WAIVED', 'REFUNDED');

-- AlterTable Appointment: SaaS external references
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "source" "AppointmentSource" NOT NULL DEFAULT 'LOCAL';
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "externalAppointmentId" TEXT;
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "externalHospitalId" TEXT;
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "externalFacilityId" TEXT;
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "externalDepartmentId" TEXT;
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "externalDoctorId" TEXT;
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "externalTicketId" TEXT;
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "externalTicketNumber" TEXT;
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "externalVisitId" TEXT;
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "externalRequestId" TEXT;
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "idempotencyKey" TEXT;
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "consentId" TEXT;
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "doctorName" TEXT;
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "facilityName" TEXT;
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "specialty" TEXT;
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "department" TEXT;
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "proposedScheduledAt" TIMESTAMP(3);
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "proposedMessage" TEXT;
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "rejectionReason" TEXT;
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "hospitalPaymentStatus" "HospitalPaymentStatus" NOT NULL DEFAULT 'UNPAID';

CREATE UNIQUE INDEX IF NOT EXISTS "Appointment_externalAppointmentId_key" ON "Appointment"("externalAppointmentId");
CREATE UNIQUE INDEX IF NOT EXISTS "Appointment_idempotencyKey_key" ON "Appointment"("idempotencyKey");
CREATE INDEX IF NOT EXISTS "Appointment_source_idx" ON "Appointment"("source");
CREATE INDEX IF NOT EXISTS "Appointment_externalHospitalId_idx" ON "Appointment"("externalHospitalId");
CREATE INDEX IF NOT EXISTS "Appointment_externalDoctorId_idx" ON "Appointment"("externalDoctorId");
CREATE INDEX IF NOT EXISTS "Appointment_externalAppointmentId_idx" ON "Appointment"("externalAppointmentId");

-- AlterTable Consent
ALTER TABLE "Consent" ADD COLUMN IF NOT EXISTS "hospitalName" TEXT;
ALTER TABLE "Consent" ADD COLUMN IF NOT EXISTS "revokedReason" TEXT;
CREATE INDEX IF NOT EXISTS "Consent_hospitalId_idx" ON "Consent"("hospitalId");

-- CreateTable HealthcareActivityEvent
CREATE TABLE IF NOT EXISTS "HealthcareActivityEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "appointmentId" TEXT,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HealthcareActivityEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "HealthcareActivityEvent_userId_createdAt_idx" ON "HealthcareActivityEvent"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "HealthcareActivityEvent_appointmentId_idx" ON "HealthcareActivityEvent"("appointmentId");
CREATE INDEX IF NOT EXISTS "HealthcareActivityEvent_type_idx" ON "HealthcareActivityEvent"("type");

DO $$ BEGIN
  ALTER TABLE "HealthcareActivityEvent"
    ADD CONSTRAINT "HealthcareActivityEvent_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("userid") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "HealthcareActivityEvent"
    ADD CONSTRAINT "HealthcareActivityEvent_appointmentId_fkey"
    FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
