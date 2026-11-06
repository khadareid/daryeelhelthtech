import { prisma } from "../lib/prisma";
import { createOwnedRouter } from "../utils/createOwnedRouter";
import {
  optionalString,
  parseBool,
  parseDate,
  requireString,
} from "../utils/validation";

export default createOwnedRouter(prisma.medication, {
  sanitizeCreate: (body) => ({
    name: requireString(body.name, "name"),
    dosage: optionalString(body.dosage) ?? null,
    frequency: optionalString(body.frequency) ?? null,
    route: optionalString(body.route) ?? null,
    startedAt: parseDate(body.startedAt, "startedAt") ?? null,
    endedAt: parseDate(body.endedAt, "endedAt") ?? null,
    isActive: parseBool(body.isActive, true),
    prescribedBy: optionalString(body.prescribedBy) ?? null,
    reason: optionalString(body.reason) ?? null,
    notes: optionalString(body.notes) ?? null,
  }),
  sanitizeUpdate: (body) => {
    const data: Record<string, unknown> = {};
    if (body.name !== undefined) data.name = requireString(body.name, "name");
    if (body.dosage !== undefined) data.dosage = optionalString(body.dosage) ?? null;
    if (body.frequency !== undefined)
      data.frequency = optionalString(body.frequency) ?? null;
    if (body.route !== undefined) data.route = optionalString(body.route) ?? null;
    if (body.startedAt !== undefined)
      data.startedAt = parseDate(body.startedAt, "startedAt") ?? null;
    if (body.endedAt !== undefined)
      data.endedAt = parseDate(body.endedAt, "endedAt") ?? null;
    if (body.isActive !== undefined) data.isActive = parseBool(body.isActive);
    if (body.prescribedBy !== undefined)
      data.prescribedBy = optionalString(body.prescribedBy) ?? null;
    if (body.reason !== undefined) data.reason = optionalString(body.reason) ?? null;
    if (body.notes !== undefined) data.notes = optionalString(body.notes) ?? null;
    return data;
  },
});
