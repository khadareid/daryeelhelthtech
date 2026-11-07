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
exports.updatePayment = exports.createPayment = exports.getPayment = exports.listPayments = void 0;
const client_1 = require("@prisma/client");
const rbac_1 = require("../helpers/middleware/rbac");
const prisma_1 = require("../lib/prisma");
const codes_1 = require("../utils/codes");
const ownership_1 = require("../utils/ownership");
const pagination_1 = require("../utils/pagination");
const validation_1 = require("../utils/validation");
const listPayments = (actor, query) => __awaiter(void 0, void 0, void 0, function* () {
    const { page, limit, skip, take } = (0, pagination_1.parsePagination)(query);
    const where = {};
    if ((0, rbac_1.isAdminRole)(actor.role)) {
        if (query.userId)
            where.userId = String(query.userId);
    }
    else if (query.as === "doctor") {
        const doctor = yield prisma_1.prisma.doctor.findUnique({
            where: { userId: actor.userId },
            select: { id: true },
        });
        if (!doctor)
            throw new ownership_1.HttpError(403, "Doctor profile required");
        where.appointment = { doctorId: doctor.id };
    }
    else {
        where.userId = actor.userId;
    }
    if (query.status) {
        where.status = (0, validation_1.parseEnum)(query.status, Object.values(client_1.PaymentStatus), "status", true);
    }
    const [items, total] = yield Promise.all([
        prisma_1.prisma.payment.findMany({
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
        prisma_1.prisma.payment.count({ where }),
    ]);
    return { items, meta: (0, pagination_1.pageMeta)(total, page, limit) };
});
exports.listPayments = listPayments;
const getPayment = (id, actor) => __awaiter(void 0, void 0, void 0, function* () {
    const row = yield prisma_1.prisma.payment.findUnique({
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
    if (!row)
        throw new ownership_1.HttpError(404, "Payment not found");
    if (!(0, rbac_1.isAdminRole)(actor.role) && row.userId !== actor.userId) {
        throw new ownership_1.HttpError(403, "Forbidden");
    }
    return row;
});
exports.getPayment = getPayment;
const createPayment = (actor, body) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f;
    const userId = (0, rbac_1.isAdminRole)(actor.role) && body.userId
        ? (0, validation_1.requireString)(body.userId, "userId")
        : actor.userId;
    let amount = (0, validation_1.parseNumber)(body.amount, "amount");
    const appointmentId = (_a = (0, validation_1.optionalString)(body.appointmentId)) !== null && _a !== void 0 ? _a : null;
    let currency = (0, validation_1.optionalString)(body.currency) || "USD";
    if (appointmentId) {
        const appt = yield prisma_1.prisma.appointment.findUnique({
            where: { id: appointmentId },
        });
        if (!appt)
            throw new ownership_1.HttpError(404, "Appointment not found");
        if (!(0, rbac_1.isAdminRole)(actor.role) && appt.userId !== actor.userId) {
            throw new ownership_1.HttpError(403, "Forbidden");
        }
        if (amount === undefined || amount === null) {
            amount = appt.consultationFee != null ? Number(appt.consultationFee) : 0;
        }
        currency = (0, validation_1.optionalString)(body.currency) || appt.currency || "USD";
        // Pay existing pending invoice for this appointment instead of duplicating
        const existing = yield prisma_1.prisma.payment.findFirst({
            where: {
                appointmentId,
                userId: appt.userId,
                status: { in: [client_1.PaymentStatus.PENDING, client_1.PaymentStatus.FAILED] },
            },
            orderBy: { createdAt: "desc" },
        });
        if (existing && !(0, rbac_1.isAdminRole)(actor.role)) {
            return (0, exports.updatePayment)(existing.id, actor, {
                status: body.status || client_1.PaymentStatus.PAID,
                method: body.method || client_1.PaymentMethod.MOBILE_MONEY,
                provider: body.provider || "ZAAD",
                transactionId: body.transactionId,
            });
        }
    }
    if (amount === undefined || amount === null) {
        throw new ownership_1.HttpError(400, "amount is required");
    }
    const isFree = Number(amount) <= 0;
    const status = (0, validation_1.parseEnum)(body.status, Object.values(client_1.PaymentStatus), "status") ||
        (isFree ? client_1.PaymentStatus.PAID : client_1.PaymentStatus.PENDING);
    const payment = yield prisma_1.prisma.payment.create({
        data: {
            userId,
            appointmentId,
            amount: isFree ? 0 : amount,
            currency,
            status,
            method: (_b = (0, validation_1.parseEnum)(body.method, Object.values(client_1.PaymentMethod), "method")) !== null && _b !== void 0 ? _b : (isFree ? client_1.PaymentMethod.OTHER : null),
            transactionId: (_c = (0, validation_1.optionalString)(body.transactionId)) !== null && _c !== void 0 ? _c : null,
            paymentReference: (0, validation_1.optionalString)(body.paymentReference) || (0, codes_1.generatePaymentReference)(),
            externalTransactionId: (_d = (0, validation_1.optionalString)(body.externalTransactionId)) !== null && _d !== void 0 ? _d : null,
            provider: (_e = (0, validation_1.optionalString)(body.provider)) !== null && _e !== void 0 ? _e : (isFree ? "FREE" : null),
            providerResponse: (_f = body.providerResponse) !== null && _f !== void 0 ? _f : undefined,
            paidAt: status === client_1.PaymentStatus.PAID ? new Date() : null,
        },
        include: {
            appointment: true,
            user: {
                select: { userid: true, fullName: true, email: true, phone: true },
            },
        },
    });
    if (appointmentId && status === client_1.PaymentStatus.PAID) {
        yield prisma_1.prisma.appointment.update({
            where: { id: appointmentId },
            data: {
                paymentStatus: client_1.PaymentStatus.PAID,
                paymentRequired: Number(amount) > 0,
            },
        });
        try {
            yield prisma_1.prisma.notification.create({
                data: {
                    userId,
                    title: isFree ? "Free visit confirmed" : "Payment successful",
                    body: isFree
                        ? "Your booking fee is Free ($0) and marked Paid."
                        : `Payment marked Paid with ${(0, validation_1.optionalString)(body.provider) || "local money"}. Open My Visits to track the booking.`,
                    type: isFree ? "PAYMENT" : "PAYMENT_SUCCESS",
                    channel: "IN_APP",
                    data: {
                        paymentId: payment.id,
                        appointmentId,
                    },
                },
            });
        }
        catch (_g) {
            /* payment still succeeds */
        }
    }
    return payment;
});
exports.createPayment = createPayment;
const updatePayment = (id, actor, body) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    const row = yield (0, exports.getPayment)(id, actor);
    if (!(0, rbac_1.isAdminRole)(actor.role) && row.userId !== actor.userId) {
        throw new ownership_1.HttpError(403, "Forbidden");
    }
    const data = {};
    if (body.status !== undefined) {
        const status = (0, validation_1.parseEnum)(body.status, Object.values(client_1.PaymentStatus), "status", true);
        data.status = status;
        if (status === client_1.PaymentStatus.PAID)
            data.paidAt = new Date();
        if (status === client_1.PaymentStatus.FAILED) {
            data.failureCode = (_a = (0, validation_1.optionalString)(body.failureCode)) !== null && _a !== void 0 ? _a : null;
            data.failureReason = (_b = (0, validation_1.optionalString)(body.failureReason)) !== null && _b !== void 0 ? _b : null;
        }
        if (status === client_1.PaymentStatus.REFUNDED ||
            status === client_1.PaymentStatus.PARTIALLY_REFUNDED) {
            data.refundedAt = new Date();
            data.refundedAmount =
                (_c = (0, validation_1.parseNumber)(body.refundedAmount, "refundedAmount")) !== null && _c !== void 0 ? _c : row.amount;
            data.refundReason = (_d = (0, validation_1.optionalString)(body.refundReason)) !== null && _d !== void 0 ? _d : null;
            data.refundReference = (_e = (0, validation_1.optionalString)(body.refundReference)) !== null && _e !== void 0 ? _e : null;
        }
        if (row.appointmentId && status === client_1.PaymentStatus.PAID) {
            yield prisma_1.prisma.appointment.update({
                where: { id: row.appointmentId },
                data: { paymentStatus: client_1.PaymentStatus.PAID },
            });
            try {
                yield prisma_1.prisma.notification.create({
                    data: {
                        userId: row.userId,
                        title: "Payment successful",
                        body: `Your visit payment is marked Paid (${(0, validation_1.optionalString)(body.provider) || row.provider || "local money"}). Open My Visits to track the booking.`,
                        type: "PAYMENT_SUCCESS",
                        channel: "IN_APP",
                        data: {
                            paymentId: row.id,
                            appointmentId: row.appointmentId,
                        },
                    },
                });
            }
            catch (_k) {
                /* payment still succeeds */
            }
        }
    }
    if (body.method !== undefined) {
        data.method =
            (_f = (0, validation_1.parseEnum)(body.method, Object.values(client_1.PaymentMethod), "method")) !== null && _f !== void 0 ? _f : null;
    }
    if (body.provider !== undefined) {
        data.provider = (_g = (0, validation_1.optionalString)(body.provider)) !== null && _g !== void 0 ? _g : null;
    }
    if (body.transactionId !== undefined) {
        data.transactionId = (_h = (0, validation_1.optionalString)(body.transactionId)) !== null && _h !== void 0 ? _h : null;
    }
    if (body.paidAt !== undefined) {
        data.paidAt = (_j = (0, validation_1.parseDate)(body.paidAt, "paidAt")) !== null && _j !== void 0 ? _j : null;
    }
    return prisma_1.prisma.payment.update({
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
});
exports.updatePayment = updatePayment;
