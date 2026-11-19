"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNotification = void 0;
exports.mapSaasEventToNotificationType = mapSaasEventToNotificationType;
const client_1 = require("@prisma/client");
const prisma_1 = require("../lib/prisma");
const createNotification = (input) => __awaiter(void 0, void 0, void 0, function* () {
    if (input.idempotencyKey) {
        const existing = yield prisma_1.prisma.notification.findUnique({
            where: { idempotencyKey: input.idempotencyKey },
        });
        if (existing)
            return existing;
    }
    try {
        return yield prisma_1.prisma.notification.create({
            data: {
                userId: input.userId,
                title: input.title,
                body: input.body,
                type: input.type || client_1.NotificationType.SYSTEM,
                channel: input.channel || client_1.NotificationChannel.IN_APP,
                data: input.data,
                idempotencyKey: input.idempotencyKey || null,
            },
        });
    }
    catch (err) {
        if ((err === null || err === void 0 ? void 0 : err.code) === "P2002" && input.idempotencyKey) {
            return prisma_1.prisma.notification.findUnique({
                where: { idempotencyKey: input.idempotencyKey },
            });
        }
        throw err;
    }
});
exports.createNotification = createNotification;
const SAAS_EVENT_TO_TYPE = {
    APPOINTMENT_REQUESTED: client_1.NotificationType.APPOINTMENT,
    BOOKING_CREATED: client_1.NotificationType.APPOINTMENT,
    PAYMENT_STATUS_CHANGED: client_1.NotificationType.PAYMENT,
    PAYMENT_PENDING: client_1.NotificationType.PAYMENT_PENDING,
    PAYMENT_SUCCESS: client_1.NotificationType.PAYMENT_SUCCESS,
    PAYMENT_FAILED: client_1.NotificationType.PAYMENT_FAILED,
    APPOINTMENT_ACCEPTED: client_1.NotificationType.APPOINTMENT_ACCEPTED,
    APPOINTMENT_REJECTED: client_1.NotificationType.APPOINTMENT_REJECTED,
    APPOINTMENT_CONFIRMED: client_1.NotificationType.APPOINTMENT_CONFIRMED,
    RESCHEDULE_REQUESTED: client_1.NotificationType.APPOINTMENT_RESCHEDULED,
    APPOINTMENT_CANCELLED: client_1.NotificationType.APPOINTMENT_CANCELLED,
    PATIENT_CHECKED_IN: client_1.NotificationType.CHECKED_IN,
    VISIT_COMPLETED: client_1.NotificationType.VISIT_COMPLETED,
    REFUND_PROCESSED: client_1.NotificationType.REFUND,
    APPOINTMENT_REMINDER_24H: client_1.NotificationType.APPOINTMENT_REMINDER,
    APPOINTMENT_REMINDER_2H: client_1.NotificationType.APPOINTMENT_REMINDER,
};
function mapSaasEventToNotificationType(eventType) {
    const key = String(eventType || "")
        .replace(/^HEALTHTECH_/, "")
        .toUpperCase();
    return SAAS_EVENT_TO_TYPE[key] || client_1.NotificationType.APPOINTMENT;
}
