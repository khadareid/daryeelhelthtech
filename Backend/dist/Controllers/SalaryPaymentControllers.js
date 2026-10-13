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
exports.deleteSalaryPayment = exports.updateSalaryPayment = exports.getSalaryPaymentById = exports.getAllSalaryPayments = exports.createSalaryPayment = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// Create Salary Payment
const createSalaryPayment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { employeeId, paymentType, amount, paymentDate, } = req.body;
        const salaryPayment = yield prisma.salaryPayment.create({
            data: {
                employeeId,
                paymentType,
                amount,
                paymentDate: paymentDate || new Date(),
                userUserid: (_a = req.user) === null || _a === void 0 ? void 0 : _a.Userid,
            },
        });
        res.status(201).json({
            message: 'Salary payment recorded successfully',
            data: salaryPayment,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to create salary payment', error });
    }
});
exports.createSalaryPayment = createSalaryPayment;
// Get All Salary Payments
const getAllSalaryPayments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const payments = yield prisma.salaryPayment.findMany({
            include: {
                employee: true,
                User: true,
            },
        });
        res.status(200).json({ data: payments });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch salary payments', error });
    }
});
exports.getAllSalaryPayments = getAllSalaryPayments;
// Get Salary Payment by ID
const getSalaryPaymentById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const paymentId = parseInt(req.params.id);
        const payment = yield prisma.salaryPayment.findUnique({
            where: { SalaryPaymentid: paymentId },
            include: {
                employee: true,
                User: true,
            },
        });
        if (!payment) {
            return res.status(404).json({ message: 'Salary payment not found' });
        }
        res.status(200).json({ data: payment });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch salary payment', error });
    }
});
exports.getSalaryPaymentById = getSalaryPaymentById;
// Update Salary Payment
const updateSalaryPayment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const paymentId = parseInt(req.params.id);
        const updates = req.body;
        const updated = yield prisma.salaryPayment.update({
            where: { SalaryPaymentid: paymentId },
            data: Object.assign(Object.assign({}, updates), { updatedAt: new Date() }),
        });
        res.status(200).json({ message: 'Salary payment updated successfully', data: updated });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to update salary payment', error });
    }
});
exports.updateSalaryPayment = updateSalaryPayment;
// (Optional) Delete Salary Payment - If needed for soft deletion
const deleteSalaryPayment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const paymentId = parseInt(req.params.id);
        // If you want to soft-delete, you'd need an `isdeleted` field in the model
        const deleted = yield prisma.salaryPayment.delete({
            where: { SalaryPaymentid: paymentId },
        });
        res.status(200).json({ message: 'Salary payment deleted successfully', data: deleted });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to delete salary payment', error });
    }
});
exports.deleteSalaryPayment = deleteSalaryPayment;
