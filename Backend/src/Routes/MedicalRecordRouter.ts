import { prisma } from "../lib/prisma";
import { createOwnedRouter } from "../utils/createOwnedRouter";
import {
  optionalString,
  parseDate,
  requireString,
} from "../utils/validation";

export default createOwnedRouter(prisma.medicalRecord, {
  sanitizeCreate: (body) => ({
    recordType: requireString(body.recordType, "recordType"),
    title: requireString(body.title, "title"),
    description: optionalString(body.description) ?? null,
    diagnosis: optionalString(body.diagnosis) ?? null,
    treatment: optionalString(body.treatment) ?? null,
    doctorName: optionalString(body.doctorName) ?? null,
    facilityName: optionalString(body.facilityName) ?? null,
    recordDate: parseDate(body.recordDate, "recordDate", true)!,
    notes: optionalString(body.notes) ?? null,
  }),
  sanitizeUpdate: (body) => {
    const data: Record<string, unknown> = {};
    if (body.recordType !== undefined)
      data.recordType = requireString(body.recordType, "recordType");
    if (body.title !== undefined) data.title = requireString(body.title, "title");
    if (body.description !== undefined)
      data.description = optionalString(body.description) ?? null;
    if (body.diagnosis !== undefined)
      data.diagnosis = optionalString(body.diagnosis) ?? null;
    if (body.treatment !== undefined)
      data.treatment = optionalString(body.treatment) ?? null;
    if (body.doctorName !== undefined)
      data.doctorName = optionalString(body.doctorName) ?? null;
    if (body.facilityName !== undefined)
      data.facilityName = optionalString(body.facilityName) ?? null;
    if (body.recordDate !== undefined)
      data.recordDate = parseDate(body.recordDate, "recordDate", true);
    if (body.notes !== undefined) data.notes = optionalString(body.notes) ?? null;
    return data;
  },
});
