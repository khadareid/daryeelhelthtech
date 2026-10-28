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
exports.formatHealthId = formatHealthId;
exports.generateUniqueHealthId = generateUniqueHealthId;
exports.ensureUserProfileWithHealthId = ensureUserProfileWithHealthId;
exports.backfillMissingHealthIds = backfillMissingHealthIds;
exports.slugifyProfessionalName = slugifyProfessionalName;
const prisma_1 = require("../lib/prisma");
/**
 * Permanent Daryeel Health / Patient ID.
 * Format: DRL-YYYY-NNNNNN (never reused, never changes with role).
 */
function formatHealthId(year, seq) {
    return `DRL-${year}-${String(seq).padStart(6, "0")}`;
}
function generateUniqueHealthId() {
    return __awaiter(this, void 0, void 0, function* () {
        const year = new Date().getFullYear();
        const prefix = `DRL-${year}-`;
        for (let attempt = 0; attempt < 8; attempt++) {
            const latest = yield prisma_1.prisma.userProfile.findFirst({
                where: { healthId: { startsWith: prefix } },
                orderBy: { healthId: "desc" },
                select: { healthId: true },
            });
            let next = 1;
            if (latest === null || latest === void 0 ? void 0 : latest.healthId) {
                const raw = latest.healthId.slice(prefix.length);
                const n = parseInt(raw, 10);
                if (!Number.isNaN(n))
                    next = n + 1;
            }
            const candidate = formatHealthId(year, next + attempt);
            const clash = yield prisma_1.prisma.userProfile.findUnique({
                where: { healthId: candidate },
                select: { userprofileid: true },
            });
            if (!clash)
                return candidate;
        }
        // Extremely unlikely fallback
        return `DRL-${year}-${Date.now().toString().slice(-6)}`;
    });
}
/** Ensure a user has a UserProfile with a permanent healthId. */
function ensureUserProfileWithHealthId(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        const existing = yield prisma_1.prisma.userProfile.findUnique({
            where: { userId },
            select: { healthId: true },
        });
        if (existing === null || existing === void 0 ? void 0 : existing.healthId) {
            return { healthId: existing.healthId, created: false };
        }
        const healthId = yield generateUniqueHealthId();
        if (existing) {
            yield prisma_1.prisma.userProfile.update({
                where: { userId },
                data: { healthId },
            });
            return { healthId, created: true };
        }
        yield prisma_1.prisma.userProfile.create({
            data: { userId, healthId },
        });
        return { healthId, created: true };
    });
}
/** Backfill health IDs for all users missing one. */
function backfillMissingHealthIds() {
    return __awaiter(this, void 0, void 0, function* () {
        const missing = yield prisma_1.prisma.userProfile.findMany({
            where: { OR: [{ healthId: null }, { healthId: "" }] },
            select: { userId: true },
        });
        const usersWithoutProfile = yield prisma_1.prisma.user.findMany({
            where: { profile: null, isDeleted: false },
            select: { userid: true },
        });
        let count = 0;
        for (const row of missing) {
            yield ensureUserProfileWithHealthId(row.userId);
            count += 1;
        }
        for (const row of usersWithoutProfile) {
            yield ensureUserProfileWithHealthId(row.userid);
            count += 1;
        }
        return count;
    });
}
function slugifyProfessionalName(fullName, suffix) {
    const base = fullName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 48);
    return suffix ? `${base}-${suffix}` : base || `pro-${Date.now().toString(36)}`;
}
