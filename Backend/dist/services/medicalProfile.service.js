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
exports.upsertMedicalProfile = exports.getMedicalProfile = void 0;
const client_1 = require("@prisma/client");
const prisma_1 = require("../lib/prisma");
const ownership_1 = require("../utils/ownership");
const validation_1 = require("../utils/validation");
const getMedicalProfile = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    // Single round-trip upsert avoids find+create races that hold extra pool slots.
    return prisma_1.prisma.medicalProfile.upsert({
        where: { userId },
        create: { userId },
        update: {},
    });
});
exports.getMedicalProfile = getMedicalProfile;
const upsertMedicalProfile = (userId, body) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
    const data = {};
    if (body.bloodType !== undefined) {
        const bt = String(body.bloodType);
        if (!Object.values(client_1.BloodType).includes(bt)) {
            throw new ownership_1.HttpError(400, "Invalid bloodType");
        }
        data.bloodType = bt;
    }
    if (body.smokingStatus !== undefined) {
        data.smokingStatus = (_a = (0, validation_1.optionalString)(body.smokingStatus)) !== null && _a !== void 0 ? _a : null;
    }
    if (body.alcoholUse !== undefined) {
        data.alcoholUse = (_b = (0, validation_1.optionalString)(body.alcoholUse)) !== null && _b !== void 0 ? _b : null;
    }
    if (body.exerciseFrequency !== undefined) {
        data.exerciseFrequency = (_c = (0, validation_1.optionalString)(body.exerciseFrequency)) !== null && _c !== void 0 ? _c : null;
    }
    if (body.dietType !== undefined) {
        data.dietType = (_d = (0, validation_1.optionalString)(body.dietType)) !== null && _d !== void 0 ? _d : null;
    }
    if (body.familyHistory !== undefined) {
        data.familyHistory = body.familyHistory;
    }
    if (body.surgicalHistory !== undefined) {
        data.surgicalHistory = body.surgicalHistory;
    }
    if (body.notes !== undefined) {
        data.notes = (_e = (0, validation_1.optionalString)(body.notes)) !== null && _e !== void 0 ? _e : null;
    }
    return prisma_1.prisma.medicalProfile.upsert({
        where: { userId },
        create: {
            userId,
            bloodType: data.bloodType || client_1.BloodType.UNKNOWN,
            smokingStatus: (_f = data.smokingStatus) !== null && _f !== void 0 ? _f : null,
            alcoholUse: (_g = data.alcoholUse) !== null && _g !== void 0 ? _g : null,
            exerciseFrequency: (_h = data.exerciseFrequency) !== null && _h !== void 0 ? _h : null,
            dietType: (_j = data.dietType) !== null && _j !== void 0 ? _j : null,
            familyHistory: (_k = data.familyHistory) !== null && _k !== void 0 ? _k : undefined,
            surgicalHistory: (_l = data.surgicalHistory) !== null && _l !== void 0 ? _l : undefined,
            notes: (_m = data.notes) !== null && _m !== void 0 ? _m : null,
        },
        update: data,
    });
});
exports.upsertMedicalProfile = upsertMedicalProfile;
