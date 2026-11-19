import {
  HospitalPatientRequestStatus,
  PrismaClient,
} from "@prisma/client";
import { saasApi } from "../../lib/saasClient";
import { recordHealthcareActivity } from "./healthcareBooking.service";

const prisma = new PrismaClient();

export function normalizeHealthId(raw: string) {
  return String(raw || "").trim().toUpperCase();
}

type HealthIdLookupMiss = {
  found: false;
  patient: null;
  result: null;
  message: string;
};

type HealthIdLookupHit = {
  found: true;
  message: string;
  patient: {
    patientId: string;
    healthtechUserId: string;
    userid: string;
    healthId: string;
    name: string;
    fullName: string;
    phone: string | null;
    email: string | null;
    gender: string | null;
    dateOfBirth: string | null;
    country: string | null;
    region: string | null;
    city: string | null;
    isActive: boolean;
    isSuspended: boolean;
    role: string;
    status: string;
  };
  result: {
    userid: string;
    email: string | null;
    phone: string | null;
    fullName: string;
    healthId: string;
    country: string | null;
    region: string | null;
    city: string | null;
    gender: string | null;
    dateOfBirth: Date | null;
    role: string;
    isActive: boolean;
    isSuspended: boolean;
  };
};

export type HealthIdLookupOutcome = HealthIdLookupMiss | HealthIdLookupHit;

export async function findPatientByHealthId(
  healthIdRaw: string
): Promise<HealthIdLookupOutcome> {
  const healthId = normalizeHealthId(healthIdRaw);
  if (!healthId) {
    return {
      found: false,
      patient: null,
      result: null,
      message: "Daryeel Health ID Not Found",
    };
  }

  // Exact (case-insensitive) match on canonical Health ID — never create users
  const user = await prisma.user.findFirst({
    where: {
      deletedAt: null,
      OR: [
        { healthId: { equals: healthId, mode: "insensitive" } },
        { healthId },
      ],
    },
    select: {
      userid: true,
      healthId: true,
      fullName: true,
      phone: true,
      email: true,
      gender: true,
      dateOfBirth: true,
      country: true,
      region: true,
      city: true,
      isActive: true,
      isSuspended: true,
      role: true,
    },
  });

  if (!user?.healthId) {
    return {
      found: false,
      patient: null,
      result: null,
      message: "Daryeel Health ID Not Found",
    };
  }

  const normalizedReturned = normalizeHealthId(user.healthId);
  if (normalizedReturned !== healthId) {
    return {
      found: false,
      patient: null,
      result: null,
      message: "Daryeel Health ID Not Found",
    };
  }

  const patient: HealthIdLookupHit["patient"] = {
    patientId: user.userid,
    healthtechUserId: user.userid,
    userid: user.userid,
    healthId: normalizedReturned,
    name: user.fullName,
    fullName: user.fullName,
    phone: user.phone,
    email: user.email,
    gender: user.gender,
    dateOfBirth: user.dateOfBirth?.toISOString() || null,
    country: user.country || null,
    city: user.city || null,
    region: user.region || null,
    isActive: user.isActive,
    isSuspended: user.isSuspended,
    role: String(user.role),
    status: user.isSuspended
      ? "SUSPENDED"
      : user.isActive
        ? "ACTIVE"
        : "INACTIVE",
  };

  // `result` mirrors Healthtech user API shape (result.healthId) for SaaS parsers
  const result: HealthIdLookupHit["result"] = {
    userid: user.userid,
    email: user.email,
    phone: user.phone,
    fullName: user.fullName,
    healthId: normalizedReturned,
    country: user.country,
    region: user.region,
    city: user.city,
    gender: user.gender,
    dateOfBirth: user.dateOfBirth,
    role: String(user.role),
    isActive: user.isActive,
    isSuspended: user.isSuspended,
  };

  return {
    found: true,
    message: "Daryeel Health ID Found",
    patient,
    result,
  };
}

/** Ingest SaaS hospital request webhook — never creates a User. */
export async function upsertHospitalPatientRequestFromSaas(payload: any) {
  const externalRequestId = String(
    payload?.requestId || payload?.externalRequestId || ""
  ).trim();
  const healthId = normalizeHealthId(payload?.healthId || "");
  const patientId = String(payload?.patientId || "").trim();
  if (!externalRequestId || !healthId) return null;

  const user = await prisma.user.findFirst({
    where: {
      deletedAt: null,
      OR: [
        ...(patientId ? [{ userid: patientId }] : []),
        { healthId: { equals: healthId, mode: "insensitive" } },
      ],
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
    healthId: normalizeHealthId(user.healthId || healthId),
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
      "Hospital Booking Request",
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
