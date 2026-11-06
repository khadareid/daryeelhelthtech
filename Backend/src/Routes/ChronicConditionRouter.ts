import { prisma } from "../lib/prisma";
import { createOwnedRouter } from "../utils/createOwnedRouter";
import {
  optionalString,
  parseBool,
  parseDate,
  requireString,
} from "../utils/validation";

export default createOwnedRouter(prisma.chronicCondition, {
  sanitizeCreate: (body) => ({
    condition: requireString(body.condition, "condition"),
    icdCode: optionalString(body.icdCode) ?? null,
    diagnosedAt: parseDate(body.diagnosedAt, "diagnosedAt") ?? null,
    severity: optionalString(body.severity) ?? null,
    isActive: parseBool(body.isActive, true),
    isControlled: parseBool(body.isControlled, false),
    notes: optionalString(body.notes) ?? null,
  }),
  sanitizeUpdate: (body) => {
    const data: Record<string, unknown> = {};
    if (body.condition !== undefined)
      data.condition = requireString(body.condition, "condition");
    if (body.icdCode !== undefined) data.icdCode = optionalString(body.icdCode) ?? null;
    if (body.diagnosedAt !== undefined)
      data.diagnosedAt = parseDate(body.diagnosedAt, "diagnosedAt") ?? null;
    if (body.severity !== undefined) data.severity = optionalString(body.severity) ?? null;
    if (body.isActive !== undefined) data.isActive = parseBool(body.isActive);
    if (body.isControlled !== undefined)
      data.isControlled = parseBool(body.isControlled);
    if (body.notes !== undefined) data.notes = optionalString(body.notes) ?? null;
    return data;
  },
});
