import { AccessLevel, ConsentStatus } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { createOwnedRouter } from "../utils/createOwnedRouter";
import {
  optionalString,
  parseBool,
  parseDate,
  parseEnum,
} from "../utils/validation";

export default createOwnedRouter(prisma.consent, {
  sanitizeCreate: (body) => ({
    requesterId: optionalString(body.requesterId) ?? null,
    doctorId: optionalString(body.doctorId) ?? null,
    hospitalId: optionalString(body.hospitalId) ?? null,
    accessLevel: parseEnum(
      body.accessLevel,
      Object.values(AccessLevel),
      "accessLevel",
      true
    )!,
    status:
      parseEnum(body.status, Object.values(ConsentStatus), "status") ??
      ConsentStatus.PENDING,
    expiresAt: parseDate(body.expiresAt, "expiresAt") ?? null,
    medicalRecords: parseBool(body.medicalRecords, false),
    vitalSigns: parseBool(body.vitalSigns, false),
    medications: parseBool(body.medications, false),
    allergies: parseBool(body.allergies, false),
    chronicConditions: parseBool(body.chronicConditions, false),
    labResults: parseBool(body.labResults, false),
    prescriptions: parseBool(body.prescriptions, false),
    appointments: parseBool(body.appointments, false),
    purpose: optionalString(body.purpose) ?? null,
    notes: optionalString(body.notes) ?? null,
  }),
  sanitizeUpdate: (body) => {
    const data: Record<string, unknown> = {};
    if (body.accessLevel !== undefined) {
      data.accessLevel = parseEnum(
        body.accessLevel,
        Object.values(AccessLevel),
        "accessLevel",
        true
      );
    }
    if (body.status !== undefined) {
      data.status = parseEnum(
        body.status,
        Object.values(ConsentStatus),
        "status",
        true
      );
      if (body.status === ConsentStatus.APPROVED) data.grantedAt = new Date();
      if (body.status === ConsentStatus.REVOKED) data.revokedAt = new Date();
    }
    if (body.expiresAt !== undefined) {
      data.expiresAt = parseDate(body.expiresAt, "expiresAt") ?? null;
    }
    for (const key of [
      "medicalRecords",
      "vitalSigns",
      "medications",
      "allergies",
      "chronicConditions",
      "labResults",
      "prescriptions",
      "appointments",
    ]) {
      if (body[key] !== undefined) data[key] = parseBool(body[key]);
    }
    if (body.purpose !== undefined) data.purpose = optionalString(body.purpose) ?? null;
    if (body.notes !== undefined) data.notes = optionalString(body.notes) ?? null;
    if (body.doctorId !== undefined) data.doctorId = optionalString(body.doctorId) ?? null;
    if (body.hospitalId !== undefined)
      data.hospitalId = optionalString(body.hospitalId) ?? null;
    return data;
  },
});
