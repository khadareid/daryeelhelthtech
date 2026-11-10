import {
  AppointmentSource,
  AppointmentStatus,
  ConsentStatus,
  AccessLevel,
  HospitalPaymentStatus,
  NotificationChannel,
  NotificationType,
  Prisma,
} from "@prisma/client";
import { randomBytes } from "crypto";
import { prisma } from "../../lib/prisma";
import { SaasIntegrationService } from "./saasIntegration.service";
import {
  HealthcareError,
  HealthcareErrorCodes,
} from "./healthcareErrors";

function makeCode(prefix: string) {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${randomBytes(2)
    .toString("hex")
    .toUpperCase()}`;
}

function mapSaasStatus(status: unknown): AppointmentStatus {
  const s = String(status || "").toUpperCase();
  if ((Object.values(AppointmentStatus) as string[]).includes(s)) {
    return s as AppointmentStatus;
  }
  if (s === "CANCELLED_BY_PATIENT" || s === "CANCELLED_BY_HOSPITAL") {
    return AppointmentStatus.CANCELLED;
  }
  if (s === "SCHEDULED") return AppointmentStatus.CONFIRMED;
  return AppointmentStatus.PENDING;
}

function mapHospitalPayment(status: unknown): HospitalPaymentStatus {
  const s = String(status || "UNPAID").toUpperCase();
  if ((Object.values(HospitalPaymentStatus) as string[]).includes(s)) {
    return s as HospitalPaymentStatus;
  }
  return HospitalPaymentStatus.UNPAID;
}

export async function recordHealthcareActivity(
  userId: string,
  type: string,
  title: string,
  body?: string | null,
  appointmentId?: string | null,
  metadata?: Record<string, unknown>
) {
  const safeMeta = metadata
    ? Object.fromEntries(
        Object.entries(metadata).filter(
          ([k]) =>
            !/password|token|secret|key|authorization|medical/i.test(k)
        )
      )
    : undefined;

  await prisma.healthcareActivityEvent
    .create({
      data: {
        userId,
        type,
        title,
        body: body || null,
        appointmentId: appointmentId || null,
        metadata: (safeMeta || undefined) as Prisma.InputJsonValue | undefined,
      },
    })
    .catch(() => undefined);

  await prisma.notification
    .create({
      data: {
        userId,
        title,
        body: body || title,
        type: NotificationType.APPOINTMENT,
        channel: NotificationChannel.IN_APP,
        data: {
          ...(safeMeta || {}),
          activityType: type,
          appointmentId,
        } as Prisma.InputJsonValue,
      },
    })
    .catch(() => undefined);
}

export async function syncLocalFromSaas(localId: string, saasAppt: any) {
  return prisma.appointment.update({
    where: { id: localId },
    data: {
      externalAppointmentId: saasAppt.appointmentId || undefined,
      externalHospitalId: saasAppt.tenantId || undefined,
      externalDoctorId: saasAppt.doctorId || undefined,
      externalFacilityId: saasAppt.facilityId || undefined,
      externalTicketId: saasAppt.opdTicket?.opdTicketId || undefined,
      externalTicketNumber: saasAppt.opdTicket?.ticketNumber || undefined,
      externalVisitId: saasAppt.visit?.visitId || undefined,
      status: mapSaasStatus(saasAppt.status),
      scheduledAt: new Date(saasAppt.scheduledAt),
      proposedScheduledAt: saasAppt.proposedScheduledAt
        ? new Date(saasAppt.proposedScheduledAt)
        : null,
      proposedMessage: saasAppt.proposedMessage || null,
      rejectionReason: saasAppt.rejectionReason || null,
      hospitalPaymentStatus: mapHospitalPayment(saasAppt.paymentStatus),
      confirmedAt: saasAppt.confirmedAt ? new Date(saasAppt.confirmedAt) : null,
      cancelledAt: saasAppt.cancelledAt ? new Date(saasAppt.cancelledAt) : null,
      cancellationReason: saasAppt.cancelledReason || null,
      doctorName: saasAppt.doctor?.name || undefined,
      facilityName: saasAppt.tenant?.companyName || undefined,
      specialty:
        saasAppt.doctor?.professionalProfile?.specialization || undefined,
      department: saasAppt.department || undefined,
    },
  });
}

async function ensureBookingConsent(input: {
  userId: string;
  hospitalId: string;
  hospitalName?: string | null;
  doctorId?: string | null;
  consentId?: string | null;
  consentGranted?: boolean;
}) {
  if (!input.consentGranted && !input.consentId) {
    throw new HealthcareError(
      "You must consent to share booking information with the hospital before requesting an appointment",
      400,
      HealthcareErrorCodes.CONSENT_REQUIRED
    );
  }

  if (input.consentGranted) {
    const consent = await prisma.consent.create({
      data: {
        userId: input.userId,
        hospitalId: input.hospitalId,
        hospitalName: input.hospitalName || null,
        doctorId: input.doctorId || null,
        accessLevel: AccessLevel.VIEW,
        status: ConsentStatus.APPROVED,
        appointments: true,
        grantedAt: new Date(),
        purpose: "Share booking and contact details for hospital appointment",
        notes: "Granted during Healthtech appointment request",
      },
    });
    return consent.id;
  }

  const existing = await prisma.consent.findFirst({
    where: {
      id: String(input.consentId),
      userId: input.userId,
      status: ConsentStatus.APPROVED,
      appointments: true,
    },
  });
  if (!existing) {
    throw new HealthcareError(
      "Valid consent is required",
      400,
      HealthcareErrorCodes.CONSENT_REQUIRED
    );
  }
  return existing.id;
}

export type CreateHealthcareBookingInput = {
  userId: string;
  tenantId?: string;
  hospitalId?: string;
  doctorId: string;
  facilityId?: string | null;
  departmentId?: string | null;
  department?: string | null;
  scheduledAt: string | Date;
  duration?: number;
  reason?: string | null;
  notes?: string | null;
  type?: string | null;
  consentId?: string | null;
  consentGranted?: boolean;
  consultationFee?: number | null;
  currency?: string | null;
  doctorName?: string | null;
  facilityName?: string | null;
  specialty?: string | null;
  idempotencyKey?: string | null;
  externalRequestId?: string | null;
};

export async function createHealthcareBooking(
  input: CreateHealthcareBookingInput
) {
  const saasTenantId = String(input.tenantId || input.hospitalId || "");
  const saasDoctorId = String(input.doctorId || "");
  const when = new Date(input.scheduledAt);

  if (!saasTenantId || !saasDoctorId || Number.isNaN(when.getTime())) {
    throw new HealthcareError(
      "hospital, doctor and scheduledAt are required",
      400,
      HealthcareErrorCodes.VALIDATION_ERROR
    );
  }

  // Validate hospital + doctor against SaaS (do not trust frontend IDs)
  let hospital: any;
  let doctor: any;
  try {
    const hospitalRes = await SaasIntegrationService.getHospital(saasTenantId);
    hospital = hospitalRes.data ?? hospitalRes.result;
  } catch (error: any) {
    if (error?.status === 404) {
      throw new HealthcareError(
        "Hospital not found",
        404,
        HealthcareErrorCodes.HOSPITAL_NOT_FOUND
      );
    }
    throw error;
  }

  try {
    const doctorRes = await SaasIntegrationService.getDoctor(saasDoctorId);
    doctor = doctorRes.data ?? doctorRes.result;
  } catch (error: any) {
    if (error?.status === 404) {
      throw new HealthcareError(
        "Doctor not found",
        404,
        HealthcareErrorCodes.DOCTOR_NOT_FOUND
      );
    }
    throw error;
  }

  if (doctor?.tenantId && doctor.tenantId !== saasTenantId) {
    throw new HealthcareError(
      "Doctor does not belong to the selected hospital",
      400,
      HealthcareErrorCodes.VALIDATION_ERROR
    );
  }

  // Soft availability check when date provided
  try {
    const date = when.toISOString().slice(0, 10);
    const availRes = await SaasIntegrationService.getDoctorAvailability(
      saasDoctorId,
      date
    );
    const avail = availRes.data ?? availRes.result;
    const slots: any[] = Array.isArray(avail?.slots)
      ? avail.slots
      : Array.isArray(avail)
        ? avail
        : [];
    if (slots.length > 0) {
      const target = when.toISOString();
      const ok = slots.some((slot) => {
        const start =
          typeof slot === "string"
            ? slot
            : slot?.start || slot?.scheduledAt || slot?.time;
        if (!start) return false;
        return new Date(start).toISOString() === target || start === target;
      });
      // If slots use local times without Z, compare by HH:mm
      const hhmm = when.toISOString().slice(11, 16);
      const okLoose = slots.some((slot) => {
        const start =
          typeof slot === "string"
            ? slot
            : slot?.start || slot?.time || slot?.label;
        return String(start).includes(hhmm);
      });
      if (!ok && !okLoose && avail?.available !== false) {
        // Only hard-fail when SaaS explicitly marks unavailable / empty availableSlots
        if (avail?.available === false || avail?.slotAvailable === false) {
          throw new HealthcareError(
            "Appointment slot is no longer available",
            409,
            HealthcareErrorCodes.SLOT_NOT_AVAILABLE
          );
        }
      }
    } else if (avail?.available === false) {
      throw new HealthcareError(
        "Appointment slot is no longer available",
        409,
        HealthcareErrorCodes.SLOT_NOT_AVAILABLE
      );
    }
  } catch (error) {
    if (error instanceof HealthcareError) throw error;
    // Availability endpoint failures should not soft-block if SaaS create will validate
  }

  const patient = await prisma.user.findUnique({
    where: { userid: input.userId },
    select: {
      userid: true,
      fullName: true,
      email: true,
      phone: true,
      gender: true,
      dateOfBirth: true,
      healthId: true,
      isActive: true,
      isSuspended: true,
    },
  });

  if (!patient?.isActive || patient.isSuspended) {
    throw new HealthcareError(
      "Your account cannot book appointments right now",
      403,
      HealthcareErrorCodes.UNAUTHORIZED
    );
  }
  if (!patient.email) {
    throw new HealthcareError(
      "Your profile email is required to book with a hospital",
      400,
      HealthcareErrorCodes.VALIDATION_ERROR
    );
  }

  const facilityName =
    input.facilityName || hospital?.companyName || hospital?.name || null;
  const doctorName =
    input.doctorName || doctor?.user?.name || doctor?.name || "Doctor";
  const specialty =
    input.specialty ||
    doctor?.specialization ||
    doctor?.professionalProfile?.specialization ||
    null;

  const consentRecordId = await ensureBookingConsent({
    userId: input.userId,
    hospitalId: saasTenantId,
    hospitalName: facilityName,
    doctorId: saasDoctorId,
    consentId: input.consentId,
    consentGranted: input.consentGranted,
  });

  const idempotencyKey =
    (typeof input.idempotencyKey === "string" && input.idempotencyKey.trim()) ||
    (typeof input.externalRequestId === "string" &&
      input.externalRequestId.trim()) ||
    `ht-${input.userId}-${saasDoctorId}-${when.toISOString()}`;

  const existingLocal = await prisma.appointment.findFirst({
    where: {
      OR: [
        { idempotencyKey },
        {
          userId: input.userId,
          externalDoctorId: saasDoctorId,
          scheduledAt: when,
          source: AppointmentSource.HEALTHTECH,
          status: {
            in: [
              AppointmentStatus.PENDING,
              AppointmentStatus.ACCEPTED,
              AppointmentStatus.CONFIRMED,
              AppointmentStatus.RESCHEDULE_REQUESTED,
            ],
          },
        },
      ],
    },
  });

  if (existingLocal?.externalAppointmentId) {
    return { appointment: existingLocal, created: false };
  }

  const duration = Number(input.duration) > 0 ? Number(input.duration) : 30;
  const local = await prisma.appointment.create({
    data: {
      userId: input.userId,
      doctorId: null, // SaaS doctor IDs must not pollute local Doctor FK
      appointmentCode: makeCode("APT"),
      source: AppointmentSource.HEALTHTECH,
      doctorName: String(doctorName),
      facilityName: facilityName ? String(facilityName) : null,
      specialty: specialty ? String(specialty) : null,
      department:
        (input.department && String(input.department)) ||
        specialty ||
        null,
      externalHospitalId: saasTenantId,
      externalDoctorId: saasDoctorId,
      externalFacilityId: input.facilityId ? String(input.facilityId) : null,
      externalDepartmentId: input.departmentId
        ? String(input.departmentId)
        : null,
      externalRequestId: input.externalRequestId
        ? String(input.externalRequestId)
        : idempotencyKey,
      idempotencyKey,
      scheduledAt: when,
      duration,
      reason: input.reason ? String(input.reason) : null,
      notes: input.notes ? String(input.notes) : null,
      status: AppointmentStatus.PENDING,
      hospitalPaymentStatus: HospitalPaymentStatus.UNPAID,
      paymentRequired: false,
      paymentStatus: "PENDING",
      consultationFee:
        input.consultationFee !== undefined && input.consultationFee !== null
          ? Number(input.consultationFee)
          : doctor?.consultationFee != null
            ? Number(doctor.consultationFee)
            : null,
      currency: input.currency ? String(input.currency) : "USD",
      consentId: consentRecordId,
    },
  });

  try {
    const saas = await SaasIntegrationService.createAppointment(
      {
        tenantId: saasTenantId,
        doctorId: saasDoctorId,
        facilityId: input.facilityId || null,
        department: input.department || specialty || null,
        scheduledAt: when.toISOString(),
        duration,
        type: input.type || "IN_PERSON",
        reason: input.reason || null,
        notes: input.notes || null,
        healthtechUserId: input.userId,
        externalAppointmentId: local.id,
        idempotencyKey,
        patient: {
          email: patient.email,
          name: patient.fullName || patient.email,
          phone: patient.phone,
          healthId: patient.healthId,
          dateOfBirth: patient.dateOfBirth,
          gender: patient.gender === "OTHER" ? null : patient.gender,
        },
      },
      idempotencyKey
    );

    const saasAppt = saas.result || saas.data;
    if (!saasAppt?.appointmentId) {
      throw new HealthcareError(
        "Hospital system did not confirm the booking",
        503,
        HealthcareErrorCodes.SAAS_UNAVAILABLE
      );
    }

    const updated = await syncLocalFromSaas(local.id, saasAppt);
    await recordHealthcareActivity(
      input.userId,
      "HEALTHTECH_BOOKING_CREATED",
      "Appointment request sent",
      `Your request with ${updated.doctorName || "the doctor"} was sent to ${
        updated.facilityName || "the hospital"
      }.`,
      updated.id,
      {
        externalAppointmentId: saasAppt.appointmentId,
        externalRequestId: idempotencyKey,
      }
    );

    return {
      appointment: updated,
      created: Boolean(saas.created !== false),
    };
  } catch (error: any) {
    await prisma.appointment
      .delete({ where: { id: local.id } })
      .catch(() => undefined);

    if (error instanceof HealthcareError) throw error;

    const msg = String(error?.message || "");
    if (/slot|available|conflict/i.test(msg)) {
      throw new HealthcareError(
        "Appointment slot is no longer available",
        409,
        HealthcareErrorCodes.SLOT_NOT_AVAILABLE
      );
    }
    throw error;
  }
}

export async function listHealthcareBookings(userId: string) {
  const local = await prisma.appointment.findMany({
    where: { userId, source: AppointmentSource.HEALTHTECH },
    orderBy: { scheduledAt: "desc" },
    take: 100,
    include: { doctorReviews: true },
  });

  try {
    const remote = await SaasIntegrationService.listAppointments(userId);
    const rows = (remote.result || remote.data || []) as any[];
    for (const saasAppt of rows) {
      const match = local.find(
        (l) =>
          l.externalAppointmentId === saasAppt.appointmentId ||
          l.id === saasAppt.externalAppointmentId
      );
      if (match) await syncLocalFromSaas(match.id, saasAppt);
    }
  } catch {
    // offline SaaS — return local mirrors
  }

  return prisma.appointment.findMany({
    where: { userId, source: AppointmentSource.HEALTHTECH },
    orderBy: { scheduledAt: "desc" },
    take: 100,
    include: { doctorReviews: true },
  });
}

export async function getHealthcareBooking(userId: string, id: string) {
  const local = await prisma.appointment.findFirst({
    where: {
      userId,
      source: AppointmentSource.HEALTHTECH,
      OR: [{ id }, { externalAppointmentId: id }],
    },
    include: { doctorReviews: true },
  });
  if (!local) {
    throw new HealthcareError(
      "Appointment not found",
      404,
      HealthcareErrorCodes.APPOINTMENT_NOT_FOUND
    );
  }

  if (local.externalAppointmentId) {
    try {
      const remote = await SaasIntegrationService.getAppointment(
        local.externalAppointmentId
      );
      const saasAppt = remote.result || remote.data;
      if (saasAppt) {
        const updated = await syncLocalFromSaas(local.id, saasAppt);
        return { ...updated, saas: saasAppt };
      }
    } catch {
      /* use local */
    }
  }
  return local;
}

export async function cancelHealthcareBooking(
  userId: string,
  id: string,
  reason?: string | null
) {
  const local = await prisma.appointment.findFirst({
    where: { id, userId, source: AppointmentSource.HEALTHTECH },
  });
  if (!local?.externalAppointmentId) {
    throw new HealthcareError(
      "Appointment not found",
      404,
      HealthcareErrorCodes.APPOINTMENT_NOT_FOUND
    );
  }

  const saas = await SaasIntegrationService.cancelAppointment(
    local.externalAppointmentId,
    { healthtechUserId: userId, reason: reason || null }
  );
  const saasAppt = saas.result || saas.data;
  const updated = await syncLocalFromSaas(local.id, saasAppt);
  await recordHealthcareActivity(
    userId,
    "HEALTHTECH_BOOKING_CANCELLED",
    "Appointment cancelled",
    "You cancelled this appointment request.",
    local.id,
    { externalAppointmentId: local.externalAppointmentId }
  );
  return updated;
}

export async function requestHealthcareReschedule(
  userId: string,
  id: string,
  proposedScheduledAt: string,
  message?: string | null
) {
  const local = await prisma.appointment.findFirst({
    where: { id, userId, source: AppointmentSource.HEALTHTECH },
  });
  if (!local?.externalAppointmentId) {
    throw new HealthcareError(
      "Appointment not found",
      404,
      HealthcareErrorCodes.APPOINTMENT_NOT_FOUND
    );
  }

  const saas = await SaasIntegrationService.requestReschedule(
    local.externalAppointmentId,
    {
      healthtechUserId: userId,
      proposedScheduledAt,
      scheduledAt: proposedScheduledAt,
      message: message || null,
    }
  );
  const saasAppt = saas.result || saas.data;
  const updated = await syncLocalFromSaas(local.id, saasAppt);
  await recordHealthcareActivity(
    userId,
    "HEALTHTECH_BOOKING_RESCHEDULED",
    "Reschedule requested",
    message || "You requested a new appointment time.",
    local.id
  );
  return updated;
}

export async function respondHealthcareReschedule(
  userId: string,
  id: string,
  accept: boolean
) {
  const local = await prisma.appointment.findFirst({
    where: { id, userId, source: AppointmentSource.HEALTHTECH },
  });
  if (!local?.externalAppointmentId) {
    throw new HealthcareError(
      "Appointment not found",
      404,
      HealthcareErrorCodes.APPOINTMENT_NOT_FOUND
    );
  }

  const saas = await SaasIntegrationService.respondReschedule(
    local.externalAppointmentId,
    { healthtechUserId: userId, accept }
  );
  const saasAppt = saas.result || saas.data;
  const updated = await syncLocalFromSaas(local.id, saasAppt);
  await recordHealthcareActivity(
    userId,
    accept ? "RESCHEDULE_ACCEPTED" : "RESCHEDULE_DECLINED",
    accept ? "New appointment time accepted" : "Proposed time declined",
    accept
      ? "Your appointment is confirmed for the new time."
      : "You declined the hospital's proposed time.",
    local.id
  );
  return updated;
}

export async function applySaasWebhook(payload: any) {
  const externalId =
    payload?.externalAppointmentId ||
    payload?.appointmentId ||
    payload?.data?.appointmentId;
  if (!externalId) return null;

  const local = await prisma.appointment.findFirst({
    where: {
      OR: [
        { id: String(payload.externalAppointmentId || "") },
        { externalAppointmentId: String(externalId) },
      ],
      source: AppointmentSource.HEALTHTECH,
    },
  });
  if (!local?.externalAppointmentId && !local) return null;

  const saasId = local?.externalAppointmentId || String(externalId);
  const remote = await SaasIntegrationService.getAppointment(saasId);
  const saasAppt = remote.result || remote.data;
  if (!saasAppt || !local) return null;

  const updated = await syncLocalFromSaas(local.id, saasAppt);

  const type = String(payload?.type || "APPOINTMENT_UPDATED");
  const titleMap: Record<string, string> = {
    APPOINTMENT_ACCEPTED: "Appointment accepted",
    APPOINTMENT_REJECTED: "Appointment rejected",
    RESCHEDULE_REQUESTED: "Hospital proposed a new time",
    OPD_TICKET_GENERATED: "OPD ticket ready",
    PATIENT_CHECKED_IN: "Checked in",
    VISIT_COMPLETED: "Visit completed",
    APPOINTMENT_CANCELLED: "Appointment cancelled",
  };

  await recordHealthcareActivity(
    local.userId,
    type.startsWith("HEALTHTECH_") ? type : `HEALTHTECH_${type}`,
    titleMap[type] || "Appointment updated",
    updated.externalTicketNumber
      ? `OPD Ticket: ${updated.externalTicketNumber}`
      : updated.status,
    local.id,
    {
      externalAppointmentId: updated.externalAppointmentId,
      status: updated.status,
      ticketNumber: updated.externalTicketNumber,
    }
  );

  return updated;
}
