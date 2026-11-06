import { prisma } from "../lib/prisma";
import { createOwnedRouter } from "../utils/createOwnedRouter";
import { requireString, optionalString, parseBool } from "../utils/validation";

export default createOwnedRouter(prisma.emergencyContact, {
  sanitizeCreate: (body) => ({
    fullName: requireString(body.fullName, "fullName"),
    relationship: requireString(body.relationship, "relationship"),
    phone: requireString(body.phone, "phone"),
    alternatePhone: optionalString(body.alternatePhone) ?? null,
    email: optionalString(body.email) ?? null,
    isPrimary: parseBool(body.isPrimary, false),
  }),
  sanitizeUpdate: (body) => {
    const data: Record<string, unknown> = {};
    if (body.fullName !== undefined) data.fullName = requireString(body.fullName, "fullName");
    if (body.relationship !== undefined)
      data.relationship = requireString(body.relationship, "relationship");
    if (body.phone !== undefined) data.phone = requireString(body.phone, "phone");
    if (body.alternatePhone !== undefined)
      data.alternatePhone = optionalString(body.alternatePhone) ?? null;
    if (body.email !== undefined) data.email = optionalString(body.email) ?? null;
    if (body.isPrimary !== undefined) data.isPrimary = parseBool(body.isPrimary);
    return data;
  },
});
