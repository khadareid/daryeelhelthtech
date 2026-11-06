import { prisma } from "../lib/prisma";
import { createOwnedRouter } from "../utils/createOwnedRouter";
import {
  optionalString,
  parseBool,
  parseDate,
  requireString,
} from "../utils/validation";

export default createOwnedRouter(prisma.allergy, {
  sanitizeCreate: (body) => ({
    allergen: requireString(body.allergen, "allergen"),
    type: optionalString(body.type) ?? null,
    severity: optionalString(body.severity) ?? null,
    reaction: optionalString(body.reaction) ?? null,
    diagnosedAt: parseDate(body.diagnosedAt, "diagnosedAt") ?? null,
    isActive: parseBool(body.isActive, true),
    notes: optionalString(body.notes) ?? null,
  }),
  sanitizeUpdate: (body) => {
    const data: Record<string, unknown> = {};
    if (body.allergen !== undefined) data.allergen = requireString(body.allergen, "allergen");
    if (body.type !== undefined) data.type = optionalString(body.type) ?? null;
    if (body.severity !== undefined) data.severity = optionalString(body.severity) ?? null;
    if (body.reaction !== undefined) data.reaction = optionalString(body.reaction) ?? null;
    if (body.diagnosedAt !== undefined)
      data.diagnosedAt = parseDate(body.diagnosedAt, "diagnosedAt") ?? null;
    if (body.isActive !== undefined) data.isActive = parseBool(body.isActive);
    if (body.notes !== undefined) data.notes = optionalString(body.notes) ?? null;
    return data;
  },
});
