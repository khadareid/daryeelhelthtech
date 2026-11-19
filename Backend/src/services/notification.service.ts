import {
  NotificationChannel,
  NotificationType,
  Prisma,
} from "@prisma/client";
import { prisma } from "../lib/prisma";

export interface CreateNotificationInput {
  userId: string;
  title: string;
  body: string;
  type?: NotificationType;
  channel?: NotificationChannel;
  data?: Prisma.InputJsonValue;
  idempotencyKey?: string | null;
}

export const createNotification = async (input: CreateNotificationInput) => {
  if (input.idempotencyKey) {
    const existing = await prisma.notification.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
    });
    if (existing) return existing;
  }

  try {
    return await prisma.notification.create({
      data: {
        userId: input.userId,
        title: input.title,
        body: input.body,
        type: input.type || NotificationType.SYSTEM,
        channel: input.channel || NotificationChannel.IN_APP,
        data: input.data,
        idempotencyKey: input.idempotencyKey || null,
      },
    });
  } catch (err: any) {
    if (err?.code === "P2002" && input.idempotencyKey) {
      return prisma.notification.findUnique({
        where: { idempotencyKey: input.idempotencyKey },
      });
    }
    throw err;
  }
};

const SAAS_EVENT_TO_TYPE: Record<string, NotificationType> = {
  APPOINTMENT_REQUESTED: NotificationType.APPOINTMENT,
  BOOKING_CREATED: NotificationType.APPOINTMENT,
  PAYMENT_STATUS_CHANGED: NotificationType.PAYMENT,
  PAYMENT_PENDING: NotificationType.PAYMENT_PENDING,
  PAYMENT_SUCCESS: NotificationType.PAYMENT_SUCCESS,
  PAYMENT_FAILED: NotificationType.PAYMENT_FAILED,
  APPOINTMENT_ACCEPTED: NotificationType.APPOINTMENT_ACCEPTED,
  APPOINTMENT_REJECTED: NotificationType.APPOINTMENT_REJECTED,
  APPOINTMENT_CONFIRMED: NotificationType.APPOINTMENT_CONFIRMED,
  RESCHEDULE_REQUESTED: NotificationType.APPOINTMENT_RESCHEDULED,
  APPOINTMENT_CANCELLED: NotificationType.APPOINTMENT_CANCELLED,
  PATIENT_CHECKED_IN: NotificationType.CHECKED_IN,
  VISIT_COMPLETED: NotificationType.VISIT_COMPLETED,
  REFUND_PROCESSED: NotificationType.REFUND,
  APPOINTMENT_REMINDER_24H: NotificationType.APPOINTMENT_REMINDER,
  APPOINTMENT_REMINDER_2H: NotificationType.APPOINTMENT_REMINDER,
};

export function mapSaasEventToNotificationType(eventType: string): NotificationType {
  const key = String(eventType || "")
    .replace(/^HEALTHTECH_/, "")
    .toUpperCase();
  return SAAS_EVENT_TO_TYPE[key] || NotificationType.APPOINTMENT;
}
