import {
  HospitalPatientRequestStatus,
  PrismaClient,
} from "@prisma/client";
import { saasApi } from "../../lib/saasClient";
import { recordHealthcareActivity } from "./healthcareBooking.service";

const prisma = new PrismaClient();

export async function findPatientByHealthId(healthIdRaw: string) {
  const healthId = String(healthIdRaw || "").trim();
  if (!healthId) {
    return { found: false as const, patient: null, message: "Daryeel Health ID Not Found" };
  }

  const user = await prisma.user.findFirst({
    where: {
      healthId: { equals: healthId, mode: "insensitive" },
      deletedAt: null,
      isActive: true,
    },
    select: {
      userid: true,
      healthId: true,
      fullName: true,
      phone: true,
      email: true,
      gender: true,
      dateOfBirth: true,
    },
  });

  if (!user?.healthId) {
    return {
      found: false as const,
      patient: null,
      message: "Daryeel Health ID Not Found",
    };
  }

  return {
    found: true as const,
    message: "Daryeel Health ID Found",
    patient: {
      patientId: user.userid,
      healthId: user.healthId,
      name: user.fullName,
      phone: user.phone,
      email: user.email,
      gender: user.gender,
      dateOfBirth: user.dateOfBirth?.toISOString() || null,
    },
  };
}

/** Ingest SaaS hospital request webhook — never creates a User. */
export async function upsertHospitalPatientRequestFromSaas(payload: any) {
  const externalRequestId = String(
    payload?.requestId || payload?.externalRequestId || ""
  ).trim();
  const healthId = String(payload?.healthId || "").trim();
  const patientId = String(payload?.patientId || "").trim();
  if (!externalRequestId || !healthId) return null;

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        patientId ? { userid: patientId } : undefined,
        { healthId: { equals: healthId, mode: "insensitive" } },
      ].filter(Boolean) as any[],
      deletedAt: null,
    },
    select: { userid: true, healthId: true },
  });
  if (!user) return null;

  const idempotencyKey =
    String(payload?.idempotencyKey || "").trim() ||
    `saas-req-${externalRequestId}`;

  const existing = await prisma.hospitalPatientRequest.findFirst({
    where: {
      OR: [{ externalRequestId }, { idempotencyKey }],
    },
  });

  const data = {
    externalRequestId,
    healthId: user.healthId || healthId,
    patientId: user.userid,
    userId: user.userid,
    hospitalId: payload?.hospitalId ? String(payload.hospitalId) : null,
    tenantId: payload?.tenantId ? String(payload.tenantId) : null,
    branchId: payload?.branchId ? String(payload.branchId) : null,
    doctorId: payload?.doctorId ? String(payload.doctorId) : null,
    requestType: String(payload?.requestType || "HOSPITAL_INVITE"),
    message: payload?.message ? String(payload.message) : null,
    status: HospitalPatientRequestStatus.PENDING,
    idempotencyKey,
    hospitalName: payload?.hospitalName ? String(payload.hospitalName) : null,
    branchName: payload?.branchName ? String(payload.branchName) : null,
    doctorName: payload?.doctorName ? String(payload.doctorName) : null,
    department: payload?.department ? String(payload.department) : null,
  };

  const row = existing
    ? await prisma.hospitalPatientRequest.update({
        where: { id: existing.id },
        data: {
          ...data,
          status:
            existing.status === HospitalPatientRequestStatus.PENDING
              ? HospitalPatientRequestStatus.PENDING
              : existing.status,
        },
      })
    : await prisma.hospitalPatientRequest.create({ data });

  if (!existing) {
    await recordHealthcareActivity(
      user.userid,
      "HOSPITAL_PATIENT_REQUESTED",
      "Hospital Request",
      [
        data.hospitalName ? `From ${data.hospitalName}` : "Hospital request",
        data.doctorName ? `Doctor: ${data.doctorName}` : null,
        data.department ? `Dept: ${data.department}` : null,
        data.message || null,
      ]
        .filter(Boolean)
        .join(" · "),
      null,
      {
        externalRequestId,
        healthId: data.healthId,
        status: "PENDING",
        source: "HEALTHTECH",
        brand: "DARYEEL",
      }
    );
  }

  return row;
}

export async function listMyHospitalPatientRequests(userId: string) {
  return prisma.hospitalPatientRequest.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function respondMyHospitalPatientRequest(opts: {
  id: string;
  userId: string;
  accept: boolean;
}) {
  const local = await prisma.hospitalPatientRequest.findFirst({
    where: { id: opts.id, userId: opts.userId },
  });
  if (!local) {
    throw Object.assign(new Error("Hospital request not found"), { status: 404 });
  }
  if (local.status !== HospitalPatientRequestStatus.PENDING) {
    return { request: local, changed: false };
  }

  if (!local.externalRequestId) {
    throw Object.assign(new Error("Request is not linked to SaaS"), {
      status: 400,
    });
  }

  // Notify SaaS first (source of truth for hospital inbox)
  await saasApi.respondHospitalRequest(local.externalRequestId, {
    accept: opts.accept,
    healthtechUserId: opts.userId,
    healthId: local.healthId,
  });

  const updated = await prisma.hospitalPatientRequest.update({
    where: { id: local.id },
    data: {
      status: opts.accept
        ? HospitalPatientRequestStatus.ACCEPTED
        : HospitalPatientRequestStatus.REJECTED,
      respondedAt: new Date(),
    },
  });

  await recordHealthcareActivity(
    opts.userId,
    opts.accept ? "HOSPITAL_PATIENT_ACCEPTED" : "HOSPITAL_PATIENT_REJECTED",
    opts.accept ? "Hospital request accepted" : "Hospital request rejected",
    updated.hospitalName
      ? `${updated.hospitalName} · ${updated.status}`
      : updated.status,
    null,
    {
      externalRequestId: updated.externalRequestId,
      healthId: updated.healthId,
      status: updated.status,
    }
  );

  return { request: updated, changed: true };
}
