import { PaymentMethod, PaymentStatus, Prisma, Role } from "@prisma/client";
import { isAdminRole } from "../helpers/middleware/rbac";
import { prisma } from "../lib/prisma";
import { generatePaymentReference } from "../utils/codes";
import { HttpError } from "../utils/ownership";
import { pageMeta, parsePagination } from "../utils/pagination";
import {
  optionalString,
  parseDate,
  parseEnum,
  parseNumber,
  requireString,
} from "../utils/validation";

export const listPayments = async (
  actor: { userId: string; role: Role },
  query: Record<string, unknown>
) => {
  const { page, limit, skip, take } = parsePagination(query);
  const where: Prisma.PaymentWhereInput = {};

  if (isAdminRole(actor.role)) {
    if (query.userId) where.userId = String(query.userId);
  } else if (query.as === "doctor") {
    const doctor = await prisma.doctor.findUnique({
      where: { userId: actor.userId },
      select: { id: true },
    });
    if (!doctor) throw new HttpError(403, "Doctor profile required");
    where.appointment = { doctorId: doctor.id };
  } else {
    where.userId = actor.userId;
  }

  if (query.status) {
    where.status = parseEnum(
      query.status,
      Object.values(PaymentStatus),
      "status",
      true
    );
  }

  const [items, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      include: {
        appointment: {
          include: {
            doctor: {
              select: { id: true, fullName: true, specialty: true },
            },
          },
        },
        user: {
          select: {
            userid: true,
            fullName: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    prisma.payment.count({ where }),
  ]);

  return { items, meta: pageMeta(total, page, limit) };
};

export const getPayment = async (
  id: string,
  actor: { userId: string; role: Role }
) => {
  const row = await prisma.payment.findUnique({
    where: { id },
    include: {
      appointment: {
        include: {
          doctor: {
            select: { id: true, fullName: true, specialty: true },
          },
        },
      },
      user: {
        select: {
          userid: true,
          fullName: true,
          email: true,
          phone: true,
        },
      },
    },
  });
  if (!row) throw new HttpError(404, "Payment not found");
  if (!isAdminRole(actor.role) && row.userId !== actor.userId) {
    throw new HttpError(403, "Forbidden");
  }
  return row;
};

export const createPayment = async (
  actor: { userId: string; role: Role },
  body: Record<string, unknown>
) => {
  const userId =
    isAdminRole(actor.role) && body.userId
      ? requireString(body.userId, "userId")
      : actor.userId;

  let amount = parseNumber(body.amount, "amount");
  const appointmentId = optionalString(body.appointmentId) ?? null;
  let currency = optionalString(body.currency) || "USD";

  if (appointmentId) {
    const appt = await prisma.appointment.findUnique({
      where: { id: appointmentId },
    });
    if (!appt) throw new HttpError(404, "Appointment not found");
    if (!isAdminRole(actor.role) && appt.userId !== actor.userId) {
      throw new HttpError(403, "Forbidden");
    }
    if (amount === undefined || amount === null) {
      amount = appt.consultationFee != null ? Number(appt.consultationFee) : 0;
    }
    currency = optionalString(body.currency) || appt.currency || "USD";

    // Pay existing pending invoice for this appointment instead of duplicating
    const existing = await prisma.payment.findFirst({
      where: {
        appointmentId,
        userId: appt.userId,
        status: { in: [PaymentStatus.PENDING, PaymentStatus.FAILED] },
      },
      orderBy: { createdAt: "desc" },
    });
    if (existing && !isAdminRole(actor.role)) {
      return updatePayment(existing.id, actor, {
        status: body.status || PaymentStatus.PAID,
        method: body.method || PaymentMethod.MOBILE_MONEY,
        provider: body.provider || "ZAAD",
        transactionId: body.transactionId,
      });
    }
  }

  if (amount === undefined || amount === null) {
    throw new HttpError(400, "amount is required");
  }

  const isFree = Number(amount) <= 0;
  const status =
    parseEnum(body.status, Object.values(PaymentStatus), "status") ||
    (isFree ? PaymentStatus.PAID : PaymentStatus.PENDING);

  const payment = await prisma.payment.create({
    data: {
      userId,
      appointmentId,
      amount: isFree ? 0 : amount,
      currency,
      status,
      method:
        parseEnum(body.method, Object.values(PaymentMethod), "method") ??
        (isFree ? PaymentMethod.OTHER : null),
      transactionId: optionalString(body.transactionId) ?? null,
      paymentReference:
        optionalString(body.paymentReference) || generatePaymentReference(),
      externalTransactionId:
        optionalString(body.externalTransactionId) ?? null,
      provider: optionalString(body.provider) ?? (isFree ? "FREE" : null),
      providerResponse: (body.providerResponse as Prisma.InputJsonValue) ?? undefined,
      paidAt: status === PaymentStatus.PAID ? new Date() : null,
    },
    include: {
      appointment: true,
      user: {
        select: { userid: true, fullName: true, email: true, phone: true },
      },
    },
  });

  if (appointmentId && status === PaymentStatus.PAID) {
    await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        paymentStatus: PaymentStatus.PAID,
        paymentRequired: Number(amount) > 0,
      },
    });
  }

  return payment;
};

export const updatePayment = async (
  id: string,
  actor: { userId: string; role: Role },
  body: Record<string, unknown>
) => {
  const row = await getPayment(id, actor);
  if (!isAdminRole(actor.role) && row.userId !== actor.userId) {
    throw new HttpError(403, "Forbidden");
  }

  const data: Prisma.PaymentUpdateInput = {};
  if (body.status !== undefined) {
    const status = parseEnum(
      body.status,
      Object.values(PaymentStatus),
      "status",
      true
    )!;
    data.status = status;
    if (status === PaymentStatus.PAID) data.paidAt = new Date();
    if (status === PaymentStatus.FAILED) {
      data.failureCode = optionalString(body.failureCode) ?? null;
      data.failureReason = optionalString(body.failureReason) ?? null;
    }
    if (
      status === PaymentStatus.REFUNDED ||
      status === PaymentStatus.PARTIALLY_REFUNDED
    ) {
      data.refundedAt = new Date();
      data.refundedAmount =
        parseNumber(body.refundedAmount, "refundedAmount") ?? row.amount;
      data.refundReason = optionalString(body.refundReason) ?? null;
      data.refundReference = optionalString(body.refundReference) ?? null;
    }

    if (row.appointmentId && status === PaymentStatus.PAID) {
      await prisma.appointment.update({
        where: { id: row.appointmentId },
        data: { paymentStatus: PaymentStatus.PAID },
      });
    }
  }
  if (body.method !== undefined) {
    data.method =
      parseEnum(body.method, Object.values(PaymentMethod), "method") ?? null;
  }
  if (body.provider !== undefined) {
    data.provider = optionalString(body.provider) ?? null;
  }
  if (body.transactionId !== undefined) {
    data.transactionId = optionalString(body.transactionId) ?? null;
  }
  if (body.paidAt !== undefined) {
    data.paidAt = parseDate(body.paidAt, "paidAt") ?? null;
  }

  return prisma.payment.update({
    where: { id },
    data,
    include: {
      appointment: {
        include: {
          doctor: {
            select: { id: true, fullName: true, specialty: true },
          },
        },
      },
      user: {
        select: { userid: true, fullName: true, email: true, phone: true },
      },
    },
  });
};
