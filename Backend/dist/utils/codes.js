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
exports.generateCardNumber = exports.generatePaymentReference = exports.generatePrescriptionNumber = exports.generateConsultationCode = exports.generateAppointmentCode = exports.generateUniqueHealthId = exports.generateHealthId = exports.randomCode = void 0;
const prisma_1 = require("../lib/prisma");
const randomCode = (prefix, length = 8) => {
    const body = Math.random()
        .toString(36)
        .slice(2, 2 + length)
        .toUpperCase();
    return `${prefix}-${body}`;
};
exports.randomCode = randomCode;
const generateHealthId = () => {
    const n = Math.floor(100000 + Math.random() * 900000);
    return `DYL-${n}`;
};
exports.generateHealthId = generateHealthId;
const generateUniqueHealthId = () => __awaiter(void 0, void 0, void 0, function* () {
    for (let i = 0; i < 12; i++) {
        const healthId = (0, exports.generateHealthId)();
        const exists = yield prisma_1.prisma.user.findUnique({ where: { healthId } });
        if (!exists)
            return healthId;
    }
    return `DYL-${Date.now().toString().slice(-6)}`;
});
exports.generateUniqueHealthId = generateUniqueHealthId;
const generateAppointmentCode = () => (0, exports.randomCode)("APT");
exports.generateAppointmentCode = generateAppointmentCode;
const generateConsultationCode = () => (0, exports.randomCode)("CON");
exports.generateConsultationCode = generateConsultationCode;
const generatePrescriptionNumber = () => (0, exports.randomCode)("RX");
exports.generatePrescriptionNumber = generatePrescriptionNumber;
const generatePaymentReference = () => (0, exports.randomCode)("PAY");
exports.generatePaymentReference = generatePaymentReference;
const generateCardNumber = () => (0, exports.randomCode)("EMG", 10);
exports.generateCardNumber = generateCardNumber;
