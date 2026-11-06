import { prisma } from "../lib/prisma";
import { createOwnedRouter } from "../utils/createOwnedRouter";
import {
  optionalString,
  parseBool,
  parseDate,
  parseNumber,
  requireString,
} from "../utils/validation";

export default createOwnedRouter(prisma.medicalDocument, {
  sanitizeCreate: (body) => ({
    medicalRecordId: optionalString(body.medicalRecordId) ?? null,
    title: requireString(body.title, "title"),
    documentType: requireString(body.documentType, "documentType"),
    fileUrl: requireString(body.fileUrl, "fileUrl"),
    fileName: optionalString(body.fileName) ?? null,
    mimeType: optionalString(body.mimeType) ?? null,
    fileSize: parseNumber(body.fileSize, "fileSize") ?? null,
    description: optionalString(body.description) ?? null,
    documentDate: parseDate(body.documentDate, "documentDate") ?? null,
    isVerified: parseBool(body.isVerified, false),
  }),
  sanitizeUpdate: (body) => {
    const data: Record<string, unknown> = {};
    if (body.medicalRecordId !== undefined)
      data.medicalRecordId = optionalString(body.medicalRecordId) ?? null;
    if (body.title !== undefined) data.title = requireString(body.title, "title");
    if (body.documentType !== undefined)
      data.documentType = requireString(body.documentType, "documentType");
    if (body.fileUrl !== undefined)
      data.fileUrl = requireString(body.fileUrl, "fileUrl");
    if (body.fileName !== undefined)
      data.fileName = optionalString(body.fileName) ?? null;
    if (body.mimeType !== undefined)
      data.mimeType = optionalString(body.mimeType) ?? null;
    if (body.fileSize !== undefined)
      data.fileSize = parseNumber(body.fileSize, "fileSize") ?? null;
    if (body.description !== undefined)
      data.description = optionalString(body.description) ?? null;
    if (body.documentDate !== undefined)
      data.documentDate = parseDate(body.documentDate, "documentDate") ?? null;
    if (body.isVerified !== undefined) data.isVerified = parseBool(body.isVerified);
    return data;
  },
});
