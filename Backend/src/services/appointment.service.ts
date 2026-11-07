import {
  AppointmentStatus,
  PaymentMethod,
  PaymentStatus,
  Prisma,
  Role,
} from "@prisma/client";
import { prisma } from "../lib/prisma";
import {
  generateAppointmentCode,
  generatePaymentReference,
} from "../utils/codes";
import {
  assertOwnerOrAdmin,
  getActorDoctorId,
  HttpError,
} from "../utils/ownership";
import { pageMeta, parsePagination } from "../utils/pagination";
import {
  optionalString,
  parseBool,
  parseDate,
  parseEnum,
  parseNumber,
  requireString,
} from "../utils/validation";
import { isAdminRole } from "../helpers/middleware/rbac";

export const listAppointments = async (
  actor: { userId: string; role: Role },
  query: Record<string, unknown>
) => {
  const { page, limit, skip, take } = parsePagination(query);
  const where: Prisma.AppointmentWhereInput = {};

  if (isAdminRole(actor.role)) {
    if (query.userId) where.userId = String(query.userId);
    if (query.doctorId) where.doctorId = String(query.doctorId);
  } else {
    const doctorId = await getActorDoctorId(actor.userId);
    if (doctorId && query.as === "doctor") {
      where.doctorId = doctorId;
    } else if (doctorId) {
      where.OR = [{ userId: actor.userId }, { doctorId }];
    } else {
      where.userId = actor.userId;
    }
  }

  if (query.status) {
    where.status = parseEnum(
      query.status,
      Object.values(AppointmentStatus),
      "status",
      true
    );
  }

  const [items, total] = await Promise.all([
    prisma.appointment.findMany({
      where,
      include: {
        doctor: true,
        user: {
          select: { userid: true, fullName: true, email: true, phone: true },
        },
        payments: true,
        consultation: true,
      },
      orderBy: { scheduledAt: "desc" },
      skip,
      take,
    }),
    prisma.appointment.count({ where }),
  ]);

  return { items, meta: pageMeta(total, page, limit) };
};

export const getAppointment = async (
  id: string,
  actor: { userId: string; role: Role }
) => {
  const row = await prisma.appointment.findUnique({
    where: { id },
    include: {
      doctor: true,
      user: {
        select: { userid: true, fullName: true, email: true, phone: true },
      },
      payments: true,
      consultation: true,
      diagnoses: true,
      prescriptions: true,
    },
  });
  if (!row) throw new HttpError(404, "Appointment not found");

  if (!isAdminRole(actor.role) && row.userId !== actor.userId) {
    const doctorId = await getActorDoctorId(actor.userId);
    if (!doctorId || row.doctorId !== doctorId) {
      throw new HttpError(403, "Forbidden");
    }
  }
  return row;
};

export const createAppointment = async (
  actor: { userId: string; role: Role },
  body: Record<string, unknown>
) => {
  const userId =
    isAdminRole(actor.role) && body.userId
      ? requireString(body.userId, "userId")
      : actor.userId;

  const scheduledAt = parseDate(body.scheduledAt, "scheduledAt", true)!;
  if (scheduledAt.getTime() <= Date.now()) {
    throw new HttpError(400, "Cannot book a time that has already passed");
  }
  const doctorId = optionalString(body.doctorId) ?? null;

  let fee = parseNumber(body.consultationFee, "consultationFee");
  let paymentRequired = parseBool(body.paymentRequired);
  const currency = optionalString(body.currency) || "USD";

  if (doctorId) {
    const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } });
    if (!doctor || !doctor.isActive) {
      throw new HttpError(400, "Doctor not available");
    }
    if (fee === undefined || fee === null) {
      fee = doctor.consultationFee != null ? Number(doctor.consultationFee) : 0;
    }
    if (paymentRequired === undefined) {
      paymentRequired = Number(fee || 0) > 0;
    }
  } else {
    fee = fee ?? 0;
    if (paymentRequired === undefined) {
      paymentRequired = Number(fee || 0) > 0;
    }
  }

  const amount = Number(fee || 0);
  const isFree = !paymentRequired || amount <= 0;

  const appt = await prisma.appointment.create({
    data: {
      userId,
      doctorId,
      appointmentCode:
        optionalString(body.appointmentCode) || generateAppointmentCode(),
      scheduledAt,
      duration: parseNumber(body.duration, "duration") ?? 30,
      reason: optionalString(body.reason) ?? null,
      notes: optionalString(body.notes) ?? null,
      status: AppointmentStatus.PENDING,
      meetingLink: optionalString(body.meetingLink) ?? null,
      paymentRequired: !isFree,
      consultationFee: isFree ? 0 : amount,
      currency,
      paymentStatus: isFree ? PaymentStatus.PAID : PaymentStatus.PENDING,
    },
    include: { doctor: true, payments: true },
  });

  await prisma.payment.create({
    data: {
      userId,
      appointmentId: appt.id,
      amount: isFree ? 0 : amount,
      currency,
      status: isFree ? PaymentStatus.PAID : PaymentStatus.PENDING,
      method: isFree ? PaymentMethod.OTHER : null,
      paymentReference: generatePaymentReference(),
      provider: isFree ? "FREE" : null,
      paidAt: isFree ? new Date() : null,
    },
  });

  const doctorName = appt.doctor?.fullName || "your clinician";
  const whenLabel = new Date(scheduledAt).toLocaleString();
  try {
    await prisma.notification.create({
      data: {
        userId,
        title: isFree
          ? "Visit booked successfully"
          : "Booking request sent successfully",
        body: isFree
          ? `Connected with ${doctorName} · ${whenLabel}. Fee Free ($0) — payment marked Paid. Open My Visits to track status.`
          : `Connected with ${doctorName} · ${whenLabel}. Fee ${currency} ${amount.toFixed(2)} — pay from My Visits when ready.`,
        type: "APPOINTMENT",
        channel: "IN_APP",
        data: {
          appointmentId: appt.id,
          appointmentCode: appt.appointmentCode,
          paymentStatus: isFree ? "PAID" : "PENDING",
        },
      },
    });
  } catch {
    /* booking still succeeds if notification write fails */
  }

  return prisma.appointment.findUnique({
    where: { id: appt.id },
    include: { doctor: true, payments: true },
  });
};

export const updateAppointment = async (
  id: string,
  actor: { userId: string; role: Role },
  body: Record<string, unknown>
) => {
  const row = await getAppointment(id, actor);
  const doctorId = await getActorDoctorId(actor.userId);
  const isDoctor = Boolean(doctorId && row.doctorId === doctorId);
  const isOwner = row.userId === actor.userId;

  const data: Prisma.AppointmentUpdateInput = {};

  if (body.scheduledAt !== undefined) {
    data.scheduledAt = parseDate(body.scheduledAt, "scheduledAt", true);
  }
  if (body.duration !== undefined) {
    data.duration = parseNumber(body.duration, "duration");
  }
  if (body.reason !== undefined) data.reason = optionalString(body.reason) ?? null;
  if (body.notes !== undefined) data.notes = optionalString(body.notes) ?? null;
  if (body.meetingLink !== undefined) {
    data.meetingLink = optionalString(body.meetingLink) ?? null;
  }
  if (body.status !== undefined) {
    const status = parseEnum(
      body.status,
      Object.values(AppointmentStatus),
      "status",
      true
    )!;
    // Patients: cancel / reschedule request only
    // Doctors: clinical workflow statuses
    // Admins / SUPER_ADMIN: any status (including reopen cancelled)
    const patientAllowed: AppointmentStatus[] = [
      AppointmentStatus.CANCELLED,
      AppointmentStatus.RESCHEDULE_REQUESTED,
    ];
    const doctorAllowed: AppointmentStatus[] = [
      AppointmentStatus.ACCEPTED,
      AppointmentStatus.CONFIRMED,
      AppointmentStatus.REJECTED,
      AppointmentStatus.CHECKED_IN,
      AppointmentStatus.IN_PROGRESS,
      AppointmentStatus.COMPLETED,
      AppointmentStatus.CANCELLED,
      AppointmentStatus.NO_SHOW,
      AppointmentStatus.RESCHEDULE_REQUESTED,
      AppointmentStatus.PENDING,
    ];
    if (isAdminRole(actor.role)) {
      // full control
    } else if (isDoctor) {
      if (!doctorAllowed.includes(status)) {
        throw new HttpError(403, "Cannot set this status");
      }
    } else if (!patientAllowed.includes(status)) {
      throw new HttpError(403, "Cannot set this status");
    }
    data.status = status;
    if (status === AppointmentStatus.CONFIRMED || status === AppointmentStatus.ACCEPTED) {
      data.confirmedAt = new Date();
      data.cancelledAt = null;
      data.cancellationReason = null;
    }
    if (status === AppointmentStatus.PENDING && isAdminRole(actor.role)) {
      data.cancelledAt = null;
      data.cancellationReason = null;
    }
    if (status === AppointmentStatus.CANCELLED) {
      data.cancelledAt = new Date();
      data.cancellationReason =
        optionalString(body.cancellationReason) ?? null;
    }
  }
  if (body.cancellationReason !== undefined) {
    data.cancellationReason = optionalString(body.cancellationReason) ?? null;
  }
  if (isAdminRole(actor.role) || isDoctor) {
    if (body.paymentStatus !== undefined) {
      data.paymentStatus = parseEnum(
        body.paymentStatus,
        Object.values(PaymentStatus),
        "paymentStatus",
        true
      )!;
    }
    if (body.paymentRequired !== undefined) {
      data.paymentRequired = parseBool(body.paymentRequired, false)!;
    }
    if (body.consultationFee !== undefined) {
      data.consultationFee =
        parseNumber(body.consultationFee, "consultationFee") ?? null;
    }
  }

  if (!isAdminRole(actor.role) && !isOwner && !isDoctor) {
    assertOwnerOrAdmin(row.userId, actor);
  }

  return prisma.appointment.update({
    where: { id },
    data,
    include: { doctor: true, payments: true },
  });
};

export const deleteAppointment = async (
  id: string,
  actor: { userId: string; role: Role }
) => {
  const row = await getAppointment(id, actor);
  if (!isAdminRole(actor.role)) {
    assertOwnerOrAdmin(row.userId, actor);
  }
  return prisma.appointment.delete({ where: { id } });
};
