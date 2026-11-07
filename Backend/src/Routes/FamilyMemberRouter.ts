import { Gender } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { createOwnedRouter } from "../utils/createOwnedRouter";
import {
  optionalString,
  parseBool,
  parseDate,
  parseEnum,
  requireString,
} from "../utils/validation";

export default createOwnedRouter(prisma.familyMember, {
  sanitizeCreate: (body) => ({
    fullName: requireString(body.fullName, "fullName"),
    relationship: requireString(body.relationship, "relationship"),
    linkedUserId: optionalString(body.linkedUserId) ?? null,
    dateOfBirth: parseDate(body.dateOfBirth, "dateOfBirth") ?? null,
    gender: parseEnum(body.gender, Object.values(Gender), "gender") ?? null,
    phone: optionalString(body.phone) ?? null,
    isDependent: parseBool(body.isDependent, false),
    canManageHealthRecords: parseBool(body.canManageHealthRecords, false),
    canBookAppointments: parseBool(body.canBookAppointments, false),
    canViewMedicalRecords: parseBool(body.canViewMedicalRecords, false),
    isEmergencyContact: parseBool(body.isEmergencyContact, false),
    notes: optionalString(body.notes) ?? null,
  }),
  sanitizeUpdate: (body) => {
    const data: Record<string, unknown> = {};
    if (body.fullName !== undefined) data.fullName = requireString(body.fullName, "fullName");
    if (body.relationship !== undefined)
      data.relationship = requireString(body.relationship, "relationship");
    if (body.linkedUserId !== undefined)
      data.linkedUserId = optionalString(body.linkedUserId) ?? null;
    if (body.dateOfBirth !== undefined)
      data.dateOfBirth = parseDate(body.dateOfBirth, "dateOfBirth") ?? null;
    if (body.gender !== undefined)
      data.gender = parseEnum(body.gender, Object.values(Gender), "gender") ?? null;
    if (body.phone !== undefined) data.phone = optionalString(body.phone) ?? null;
    if (body.isDependent !== undefined) data.isDependent = parseBool(body.isDependent);
    if (body.canManageHealthRecords !== undefined)
      data.canManageHealthRecords = parseBool(body.canManageHealthRecords);
    if (body.canBookAppointments !== undefined)
      data.canBookAppointments = parseBool(body.canBookAppointments);
    if (body.canViewMedicalRecords !== undefined)
      data.canViewMedicalRecords = parseBool(body.canViewMedicalRecords);
    if (body.isEmergencyContact !== undefined)
      data.isEmergencyContact = parseBool(body.isEmergencyContact);
    if (body.notes !== undefined) data.notes = optionalString(body.notes) ?? null;
    return data;
  },
});
