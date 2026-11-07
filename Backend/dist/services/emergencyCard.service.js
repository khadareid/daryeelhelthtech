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
exports.upsertEmergencyCard = exports.getEmergencyCard = void 0;
const client_1 = require("@prisma/client");
const prisma_1 = require("../lib/prisma");
const codes_1 = require("../utils/codes");
const ownership_1 = require("../utils/ownership");
const validation_1 = require("../utils/validation");
const getEmergencyCard = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    return prisma_1.prisma.emergencyCard.findUnique({ where: { userId } });
});
exports.getEmergencyCard = getEmergencyCard;
const upsertEmergencyCard = (userId, body) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p;
    const existing = yield prisma_1.prisma.emergencyCard.findUnique({ where: { userId } });
    const data = {
        lastUpdatedAt: new Date(),
    };
    if (body.bloodType !== undefined) {
        const bt = String(body.bloodType);
        if (!Object.values(client_1.BloodType).includes(bt)) {
            throw new ownership_1.HttpError(400, "Invalid bloodType");
        }
        data.bloodType = bt;
    }
    if (body.emergencyContactName !== undefined) {
        data.emergencyContactName =
            (_a = (0, validation_1.optionalString)(body.emergencyContactName)) !== null && _a !== void 0 ? _a : null;
    }
    if (body.emergencyContactPhone !== undefined) {
        data.emergencyContactPhone =
            (_b = (0, validation_1.optionalString)(body.emergencyContactPhone)) !== null && _b !== void 0 ? _b : null;
    }
    if (body.allergiesSummary !== undefined) {
        data.allergiesSummary = (_c = (0, validation_1.optionalString)(body.allergiesSummary)) !== null && _c !== void 0 ? _c : null;
    }
    if (body.conditionsSummary !== undefined) {
        data.conditionsSummary = (_d = (0, validation_1.optionalString)(body.conditionsSummary)) !== null && _d !== void 0 ? _d : null;
    }
    if (body.medicationsSummary !== undefined) {
        data.medicationsSummary = (_e = (0, validation_1.optionalString)(body.medicationsSummary)) !== null && _e !== void 0 ? _e : null;
    }
    if (body.doctorNotes !== undefined) {
        data.doctorNotes = (_f = (0, validation_1.optionalString)(body.doctorNotes)) !== null && _f !== void 0 ? _f : null;
    }
    if (body.qrCode !== undefined) {
        data.qrCode = (_g = (0, validation_1.optionalString)(body.qrCode)) !== null && _g !== void 0 ? _g : null;
    }
    if (body.isActive !== undefined)
        data.isActive = Boolean(body.isActive);
    if (existing) {
        return prisma_1.prisma.emergencyCard.update({
            where: { userId },
            data,
        });
    }
    return prisma_1.prisma.emergencyCard.create({
        data: {
            userId,
            cardNumber: (0, validation_1.optionalString)(body.cardNumber) || (0, codes_1.generateCardNumber)(),
            bloodType: data.bloodType || client_1.BloodType.UNKNOWN,
            emergencyContactName: (_h = data.emergencyContactName) !== null && _h !== void 0 ? _h : null,
            emergencyContactPhone: (_j = data.emergencyContactPhone) !== null && _j !== void 0 ? _j : null,
            allergiesSummary: (_k = data.allergiesSummary) !== null && _k !== void 0 ? _k : null,
            conditionsSummary: (_l = data.conditionsSummary) !== null && _l !== void 0 ? _l : null,
            medicationsSummary: (_m = data.medicationsSummary) !== null && _m !== void 0 ? _m : null,
            doctorNotes: (_o = data.doctorNotes) !== null && _o !== void 0 ? _o : null,
            qrCode: (_p = data.qrCode) !== null && _p !== void 0 ? _p : null,
            isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
        },
    });
});
exports.upsertEmergencyCard = upsertEmergencyCard;
