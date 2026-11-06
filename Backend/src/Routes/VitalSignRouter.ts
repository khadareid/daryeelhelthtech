import { prisma } from "../lib/prisma";
import { createOwnedRouter } from "../utils/createOwnedRouter";
import {
  optionalString,
  parseDate,
  parseNumber,
} from "../utils/validation";

export default createOwnedRouter(prisma.vitalSign, {
  sanitizeCreate: (body) => ({
    temperature: parseNumber(body.temperature, "temperature") ?? null,
    bloodPressureSys: parseNumber(body.bloodPressureSys, "bloodPressureSys") ?? null,
    bloodPressureDia: parseNumber(body.bloodPressureDia, "bloodPressureDia") ?? null,
    heartRate: parseNumber(body.heartRate, "heartRate") ?? null,
    respiratoryRate: parseNumber(body.respiratoryRate, "respiratoryRate") ?? null,
    oxygenSaturation: parseNumber(body.oxygenSaturation, "oxygenSaturation") ?? null,
    weight: parseNumber(body.weight, "weight") ?? null,
    height: parseNumber(body.height, "height") ?? null,
    bmi: parseNumber(body.bmi, "bmi") ?? null,
    source: optionalString(body.source) || "MANUAL",
    recordedAt: parseDate(body.recordedAt, "recordedAt") ?? new Date(),
  }),
  sanitizeUpdate: (body) => {
    const data: Record<string, unknown> = {};
    for (const key of [
      "temperature",
      "bloodPressureSys",
      "bloodPressureDia",
      "heartRate",
      "respiratoryRate",
      "oxygenSaturation",
      "weight",
      "height",
      "bmi",
    ] as const) {
      if (body[key] !== undefined) data[key] = parseNumber(body[key], key) ?? null;
    }
    if (body.source !== undefined) data.source = optionalString(body.source) || "MANUAL";
    if (body.recordedAt !== undefined)
      data.recordedAt = parseDate(body.recordedAt, "recordedAt");
    return data;
  },
});
