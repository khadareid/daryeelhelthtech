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
exports.deletePayment = exports.updatePayment = exports.getPaymentById = exports.getAllPayments = exports.createPayment = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const createPayment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { studentId, amount, semester, method, paymentStatus, // optional, defaults to PENDING
        donorId, } = req.body;
        // Ensure user ID is available
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.Userid)) {
            return res.status(401).json({ message: "Unauthorized: Missing user ID" });
        }
        // Validate or default payment status
        const status = paymentStatus && Object.values(client_1.PaymentStatus).includes(paymentStatus)
            ? paymentStatus
            : client_1.PaymentStatus.PENDING;
        const payment = yield prisma.payment.create({
            data: {
                studentId,
                amount,
                semester,
                method,
                PaymentStatus: status,
                donorId,
                userUserid: req.user.Userid,
            },
        });
        return res.status(201).json({ message: "Payment recorded successfully", data: payment });
    }
    catch (error) {
        console.error("Create Payment Error:", error);
        return res.status(500).json({ message: "Failed to create payment", error });
    }
});
exports.createPayment = createPayment;
// Get All Payments
const getAllPayments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const payments = yield prisma.payment.findMany({
            where: { isdeleted: false },
            include: {
                student: true,
                Donor: true,
                User: true,
            },
        });
        res.status(200).json({ data: payments });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch payments', error });
    }
});
exports.getAllPayments = getAllPayments;
// Get Payment by ID
const getPaymentById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const paymentId = parseInt(req.params.id);
        const payment = yield prisma.payment.findUnique({
            where: { id: paymentId },
            include: {
                student: true,
                Donor: true,
                User: true,
            },
        });
        if (!payment || payment.isdeleted) {
            return res.status(404).json({ message: 'Payment not found' });
        }
        res.status(200).json({ data: payment });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch payment', error });
    }
});
exports.getPaymentById = getPaymentById;
// Update Payment
const updatePayment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const paymentId = parseInt(req.params.id);
        const updates = req.body;
        // If status is being updated, validate it
        if (updates.PaymentStatus && !Object.values(client_1.PaymentStatus).includes(updates.PaymentStatus)) {
            return res.status(400).json({ message: 'Invalid PaymentStatus value' });
        }
        const updated = yield prisma.payment.update({
            where: { id: paymentId },
            data: Object.assign(Object.assign({}, updates), { updatedAt: new Date() }),
        });
        res.status(200).json({ message: 'Payment updated successfully', data: updated });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to update payment', error });
    }
});
exports.updatePayment = updatePayment;
// Soft Delete Payment
const deletePayment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const paymentId = parseInt(req.params.id);
        const deleted = yield prisma.payment.update({
            where: { id: paymentId },
            data: {
                isdeleted: true,
                isactive: false,
            },
        });
        res.status(200).json({ message: 'Payment soft-deleted successfully', data: deleted });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to delete payment', error });
    }
});
exports.deletePayment = deletePayment;
