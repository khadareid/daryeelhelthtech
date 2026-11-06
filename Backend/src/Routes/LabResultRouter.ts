import { prisma } from "../lib/prisma";
import { createOwnedRouter } from "../utils/createOwnedRouter";
import {
  optionalString,
  parseDate,
  requireString,
} from "../utils/validation";

export default createOwnedRouter(prisma.labResult, {
  sanitizeCreate: (body) => ({
    doctorId: optionalString(body.doctorId) ?? null,
    appointmentId: optionalString(body.appointmentId) ?? null,
    testName: requireString(body.testName, "testName"),
    testCode: optionalString(body.testCode) ?? null,
    category: optionalString(body.category) ?? null,
    resultValue: optionalString(body.resultValue) ?? null,
    unit: optionalString(body.unit) ?? null,
    referenceRange: optionalString(body.referenceRange) ?? null,
    status: optionalString(body.status) ?? null,
    interpretation: optionalString(body.interpretation) ?? null,
    labName: optionalString(body.labName) ?? null,
    resultDate: parseDate(body.resultDate, "resultDate", true)!,
    documentUrl: optionalString(body.documentUrl) ?? null,
    notes: optionalString(body.notes) ?? null,
  }),
  sanitizeUpdate: (body) => {
    const data: Record<string, unknown> = {};
    if (body.doctorId !== undefined) data.doctorId = optionalString(body.doctorId) ?? null;
    if (body.appointmentId !== undefined)
      data.appointmentId = optionalString(body.appointmentId) ?? null;
    if (body.testName !== undefined)
      data.testName = requireString(body.testName, "testName");
    if (body.testCode !== undefined) data.testCode = optionalString(body.testCode) ?? null;
    if (body.category !== undefined) data.category = optionalString(body.category) ?? null;
    if (body.resultValue !== undefined)
      data.resultValue = optionalString(body.resultValue) ?? null;
    if (body.unit !== undefined) data.unit = optionalString(body.unit) ?? null;
    if (body.referenceRange !== undefined)
      data.referenceRange = optionalString(body.referenceRange) ?? null;
    if (body.status !== undefined) data.status = optionalString(body.status) ?? null;
    if (body.interpretation !== undefined)
      data.interpretation = optionalString(body.interpretation) ?? null;
    if (body.labName !== undefined) data.labName = optionalString(body.labName) ?? null;
    if (body.resultDate !== undefined)
      data.resultDate = parseDate(body.resultDate, "resultDate", true);
    if (body.documentUrl !== undefined)
      data.documentUrl = optionalString(body.documentUrl) ?? null;
    if (body.notes !== undefined) data.notes = optionalString(body.notes) ?? null;
    return data;
  },
});
