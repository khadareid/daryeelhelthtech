/**
 * One-shot generator for user-owned CRUD modules aligned to the NEW Prisma schema.
 * Run: node scripts/generate-crud.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..", "src");

const resources = [
  {
    key: "emergencyContact",
    model: "emergencyContact",
    name: "EmergencyContact",
    route: "emergency-contacts",
    idField: "id",
    createFields: ["fullName", "relationship", "phone", "alternatePhone", "email", "isPrimary"],
    updateFields: ["fullName", "relationship", "phone", "alternatePhone", "email", "isPrimary"],
    requiredCreate: ["fullName", "relationship", "phone"],
  },
  {
    key: "familyMember",
    model: "familyMember",
    name: "FamilyMember",
    route: "family-members",
    idField: "id",
    createFields: [
      "linkedUserId",
      "fullName",
      "relationship",
      "dateOfBirth",
      "gender",
      "phone",
      "isDependent",
      "canManageHealthRecords",
      "canBookAppointments",
      "canViewMedicalRecords",
      "isEmergencyContact",
      "notes",
    ],
    updateFields: [
      "linkedUserId",
      "fullName",
      "relationship",
      "dateOfBirth",
      "gender",
      "phone",
      "isDependent",
      "canManageHealthRecords",
      "canBookAppointments",
      "canViewMedicalRecords",
      "isEmergencyContact",
      "notes",
    ],
    requiredCreate: ["fullName", "relationship"],
    dateFields: ["dateOfBirth"],
  },
  {
    key: "allergy",
    model: "allergy",
    name: "Allergy",
    route: "allergies",
    idField: "id",
    createFields: ["allergen", "type", "severity", "reaction", "diagnosedAt", "isActive", "notes"],
    updateFields: ["allergen", "type", "severity", "reaction", "diagnosedAt", "isActive", "notes"],
    requiredCreate: ["allergen"],
    dateFields: ["diagnosedAt"],
  },
  {
    key: "chronicCondition",
    model: "chronicCondition",
    name: "ChronicCondition",
    route: "chronic-conditions",
    idField: "id",
    createFields: ["condition", "icdCode", "diagnosedAt", "severity", "isActive", "isControlled", "notes"],
    updateFields: ["condition", "icdCode", "diagnosedAt", "severity", "isActive", "isControlled", "notes"],
    requiredCreate: ["condition"],
    dateFields: ["diagnosedAt"],
  },
  {
    key: "medication",
    model: "medication",
    name: "Medication",
    route: "medications",
    idField: "id",
    createFields: [
      "name",
      "dosage",
      "frequency",
      "route",
      "startedAt",
      "endedAt",
      "isActive",
      "prescribedBy",
      "reason",
      "notes",
    ],
    updateFields: [
      "name",
      "dosage",
      "frequency",
      "route",
      "startedAt",
      "endedAt",
      "isActive",
      "prescribedBy",
      "reason",
      "notes",
    ],
    requiredCreate: ["name"],
    dateFields: ["startedAt", "endedAt"],
  },
  {
    key: "medicalRecord",
    model: "medicalRecord",
    name: "MedicalRecord",
    route: "medical-records",
    idField: "id",
    createFields: [
      "recordType",
      "title",
      "description",
      "diagnosis",
      "treatment",
      "doctorName",
      "facilityName",
      "recordDate",
      "notes",
    ],
    updateFields: [
      "recordType",
      "title",
      "description",
      "diagnosis",
      "treatment",
      "doctorName",
      "facilityName",
      "recordDate",
      "notes",
    ],
    requiredCreate: ["recordType", "title", "recordDate"],
    dateFields: ["recordDate"],
  },
  {
    key: "medicalDocument",
    model: "medicalDocument",
    name: "MedicalDocument",
    route: "medical-documents",
    idField: "id",
    createFields: [
      "medicalRecordId",
      "title",
      "documentType",
      "fileUrl",
      "fileName",
      "mimeType",
      "fileSize",
      "description",
      "documentDate",
      "isVerified",
    ],
    updateFields: [
      "medicalRecordId",
      "title",
      "documentType",
      "fileUrl",
      "fileName",
      "mimeType",
      "fileSize",
      "description",
      "documentDate",
      "isVerified",
    ],
    requiredCreate: ["title", "documentType", "fileUrl"],
    dateFields: ["documentDate"],
  },
  {
    key: "vitalSign",
    model: "vitalSign",
    name: "VitalSign",
    route: "vital-signs",
    idField: "id",
    createFields: [
      "temperature",
      "bloodPressureSys",
      "bloodPressureDia",
      "heartRate",
      "respiratoryRate",
      "oxygenSaturation",
      "weight",
      "height",
      "bmi",
      "source",
      "recordedAt",
    ],
    updateFields: [
      "temperature",
      "bloodPressureSys",
      "bloodPressureDia",
      "heartRate",
      "respiratoryRate",
      "oxygenSaturation",
      "weight",
      "height",
      "bmi",
      "source",
      "recordedAt",
    ],
    requiredCreate: [],
    dateFields: ["recordedAt"],
  },
  {
    key: "labResult",
    model: "labResult",
    name: "LabResult",
    route: "lab-results",
    idField: "id",
    createFields: [
      "doctorId",
      "appointmentId",
      "testName",
      "testCode",
      "category",
      "resultValue",
      "unit",
      "referenceRange",
      "status",
      "interpretation",
      "labName",
      "resultDate",
      "documentUrl",
      "notes",
    ],
    updateFields: [
      "doctorId",
      "appointmentId",
      "testName",
      "testCode",
      "category",
      "resultValue",
      "unit",
      "referenceRange",
      "status",
      "interpretation",
      "labName",
      "resultDate",
      "documentUrl",
      "notes",
    ],
    requiredCreate: ["testName", "resultDate"],
    dateFields: ["resultDate"],
  },
  {
    key: "healthDeviceConnection",
    model: "healthDeviceConnection",
    name: "HealthDeviceConnection",
    route: "health-devices",
    idField: "id",
    createFields: [
      "provider",
      "deviceName",
      "providerUserId",
      "accessTokenEncrypted",
      "refreshTokenEncrypted",
      "tokenExpiresAt",
      "scopes",
      "isActive",
      "lastSyncAt",
      "lastError",
    ],
    updateFields: [
      "provider",
      "deviceName",
      "providerUserId",
      "accessTokenEncrypted",
      "refreshTokenEncrypted",
      "tokenExpiresAt",
      "scopes",
      "isActive",
      "lastSyncAt",
      "lastError",
    ],
    requiredCreate: ["provider"],
    dateFields: ["tokenExpiresAt", "lastSyncAt"],
  },
  {
    key: "notification",
    model: "notification",
    name: "Notification",
    route: "notifications",
    idField: "id",
    createFields: ["title", "body", "type", "channel", "data"],
    updateFields: ["isRead", "readAt"],
    requiredCreate: ["title", "body", "type"],
    dateFields: ["readAt"],
    adminCreateOnly: true,
  },
];

const pickBody = (fields, dateFields = []) => {
  const lines = fields.map((f) => {
    if (dateFields.includes(f)) {
      return `    if (body.${f} !== undefined) data.${f} = body.${f} ? new Date(body.${f}) : null;`;
    }
    return `    if (body.${f} !== undefined) data.${f} = body.${f};`;
  });
  return lines.join("\n");
};

for (const r of resources) {
  const service = `import { prisma } from "../lib/prisma";
import { parsePagination, pageMeta } from "../utils/pagination";

export const ${r.key}Service = {
  async list(userId: string | undefined, isAdmin: boolean, query: Record<string, unknown>) {
    const { page, limit, skip, take } = parsePagination(query);
    const where: any = {};
    if (!isAdmin) where.userId = userId;
    else if (query.userId) where.userId = String(query.userId);

    const [total, items] = await Promise.all([
      prisma.${r.model}.count({ where }),
      prisma.${r.model}.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
    ]);

    return { items, meta: pageMeta(total, page, limit) };
  },

  async getById(id: string) {
    return prisma.${r.model}.findUnique({ where: { ${r.idField}: id } });
  },

  async create(userId: string, body: Record<string, any>) {
    const data: Record<string, any> = { userId };
${pickBody(r.createFields, r.dateFields || [])}
    return prisma.${r.model}.create({ data: data as any });
  },

  async update(id: string, body: Record<string, any>) {
    const data: Record<string, any> = {};
${pickBody(r.updateFields, r.dateFields || [])}
    return prisma.${r.model}.update({ where: { ${r.idField}: id }, data: data as any });
  },

  async remove(id: string) {
    return prisma.${r.model}.delete({ where: { ${r.idField}: id } });
  },
};
`;

  const controller = `import { Response } from "express";
import { Role } from "@prisma/client";
import { CustomUserRequest } from "../helpers/middleware/VerifyToken";
import { ${r.key}Service } from "../services/${r.name}Service";
import { asyncHandler } from "../utils/asyncHandler";
import { created, fail, ok } from "../utils/response";

const isAdmin = (role?: Role) => role === Role.ADMIN || role === Role.SUPER_ADMIN;

export const list${r.name}s = asyncHandler(async (req: CustomUserRequest, res: Response) => {
  const admin = isAdmin(req.user?.role);
  const result = await ${r.key}Service.list(req.user!.userId, admin, req.query as any);
  return ok(res, result);
});

export const get${r.name} = asyncHandler(async (req: CustomUserRequest, res: Response) => {
  const item = await ${r.key}Service.getById(String(req.params.id));
  if (!item) return fail(res, "${r.name} not found", 404);
  if (!isAdmin(req.user?.role) && (item as any).userId !== req.user!.userId) {
    return fail(res, "Forbidden", 403);
  }
  return ok(res, item);
});

export const create${r.name} = asyncHandler(async (req: CustomUserRequest, res: Response) => {
${
  r.requiredCreate.length
    ? `  const missing = [${r.requiredCreate.map((f) => `"${f}"`).join(", ")}].filter((k) => !req.body?.[k]);
  if (missing.length) return fail(res, \`Missing: \${missing.join(", ")}\`);`
    : ""
}
${
  r.adminCreateOnly
    ? `  if (!isAdmin(req.user?.role)) return fail(res, "Admin only", 403);
  const userId = String(req.body.userId || req.user!.userId);`
    : `  const userId = isAdmin(req.user?.role) && req.body.userId ? String(req.body.userId) : req.user!.userId;`
}
  const item = await ${r.key}Service.create(userId, req.body);
  return created(res, item, "${r.name} created");
});

export const update${r.name} = asyncHandler(async (req: CustomUserRequest, res: Response) => {
  const existing = await ${r.key}Service.getById(String(req.params.id));
  if (!existing) return fail(res, "${r.name} not found", 404);
  if (!isAdmin(req.user?.role) && (existing as any).userId !== req.user!.userId) {
    return fail(res, "Forbidden", 403);
  }
  const item = await ${r.key}Service.update(String(req.params.id), req.body);
  return ok(res, item, "${r.name} updated");
});

export const delete${r.name} = asyncHandler(async (req: CustomUserRequest, res: Response) => {
  const existing = await ${r.key}Service.getById(String(req.params.id));
  if (!existing) return fail(res, "${r.name} not found", 404);
  if (!isAdmin(req.user?.role) && (existing as any).userId !== req.user!.userId) {
    return fail(res, "Forbidden", 403);
  }
  await ${r.key}Service.remove(String(req.params.id));
  return ok(res, null, "${r.name} deleted");
});
`;

  const router = `import { Router } from "express";
import { decodeToken } from "../helpers/middleware/VerifyToken";
import {
  create${r.name},
  delete${r.name},
  get${r.name},
  list${r.name}s,
  update${r.name},
} from "../Controllers/${r.name}Controller";

const router = Router();

router.use(decodeToken);
router.get("/", list${r.name}s);
router.get("/:id", get${r.name});
router.post("/", create${r.name});
router.put("/:id", update${r.name});
router.patch("/:id", update${r.name});
router.delete("/:id", delete${r.name});

export default router;
`;

  fs.writeFileSync(path.join(root, "services", `${r.name}Service.ts`), service);
  fs.writeFileSync(path.join(root, "Controllers", `${r.name}Controller.ts`), controller);
  fs.writeFileSync(path.join(root, "Routes", `${r.name}Router.ts`), router);
  console.log("Generated", r.name);
}

console.log("Done:", resources.length, "resources");
