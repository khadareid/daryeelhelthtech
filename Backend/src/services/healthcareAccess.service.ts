import { ConsentScope, ConsentStatus, Role } from "@prisma/client";
import { prisma } from "../lib/prisma";

const ADMIN_ROLES: Role[] = [Role.SUPER_ADMIN, Role.ADMIN];
const CLINICAL_ROLES: Role[] = [
  Role.DOCTOR,
  Role.NURSE,
  Role.MIDWIFE,
  Role.LAB_TECH,
  Role.PHARMACIST,
];

export type AccessDecision =
  | { ok: true; reason: string }
  | { ok: false; status: number; message: string };

function isAdmin(role?: Role | string | null) {
  return !!role && ADMIN_ROLES.includes(role as Role);
}

/**
 * Patient owns the resource, or admin, or clinician with active appointment
 * and (when required) active consent for the scope.
 */
export async function canAccessPatientData(input: {
  actorUserId: string;
  actorRole: Role | string;
  patientUserId: string;
  scope?: ConsentScope;
  requireConsent?: boolean;
}): Promise<AccessDecision> {
  if (!input.actorUserId) {
    return { ok: false, status: 401, message: "Unauthorized" };
  }

  const actor = await prisma.user.findUnique({
    where: { userid: input.actorUserId },
    select: {
      userid: true,
      role: true,
      isActive: true,
      isSuspended: true,
      isDeleted: true,
    },
  });

  if (!actor || actor.isDeleted || !actor.isActive || actor.isSuspended) {
    return { ok: false, status: 403, message: "Account is not active" };
  }

  if (actor.userid === input.patientUserId) {
    return { ok: true, reason: "owner" };
  }

  if (isAdmin(actor.role)) {
    return { ok: true, reason: "admin" };
  }

  if (!CLINICAL_ROLES.includes(actor.role)) {
    return {
      ok: false,
      status: 403,
      message: "You do not have access to this patient record",
    };
  }

  const profile = await prisma.professionalProfile.findUnique({
    where: { userId: actor.userid },
    select: { professionalprofileid: true, isVerified: true, isActive: true },
  });

  if (!profile?.isVerified || !profile.isActive) {
    return {
      ok: false,
      status: 403,
      message: "Professional profile is not verified",
    };
  }

  // Care relationship via appointment (doctorId may be user id or profile id)
  const related = await prisma.appointment.findFirst({
    where: {
      userId: input.patientUserId,
      status: { notIn: ["CANCELLED"] },
      OR: [
        { doctorId: actor.userid },
        { doctorId: profile.professionalprofileid },
      ],
    },
    select: { appointmentid: true },
  });

  if (!related) {
    return {
      ok: false,
      status: 403,
      message: "No authorized care relationship with this patient",
    };
  }

  if (input.requireConsent !== false) {
    const scope = input.scope || ConsentScope.ALL;
    const consent = await prisma.consent.findFirst({
      where: {
        userId: input.patientUserId,
        grantedToUserId: actor.userid,
        status: ConsentStatus.ACTIVE,
        OR: [{ scope }, { scope: ConsentScope.ALL }],
        AND: [
          {
            OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
          },
        ],
      },
    });

    if (!consent) {
      return {
        ok: false,
        status: 403,
        message: "Active patient consent is required for this data",
      };
    }
  }

  return { ok: true, reason: "care_relationship" };
}

export async function assertActiveAccount(userId: string): Promise<AccessDecision> {
  const user = await prisma.user.findUnique({
    where: { userid: userId },
    select: { isActive: true, isSuspended: true, isDeleted: true },
  });
  if (!user || user.isDeleted || !user.isActive || user.isSuspended) {
    return { ok: false, status: 403, message: "Account is not active" };
  }
  return { ok: true, reason: "active" };
}
