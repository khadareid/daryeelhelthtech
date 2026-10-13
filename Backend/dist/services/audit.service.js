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
exports.getClientMeta = exports.createAuditLog = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const createAuditLog = (input) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    try {
        // Haddii `metadata` la soo diray, isticmaal. Haddii kale, ka dhis oldValue/newValue
        let metadata;
        if (input.metadata && Object.keys(input.metadata).length > 0) {
            metadata = input.metadata;
        }
        else if (input.oldValue !== undefined || input.newValue !== undefined) {
            const built = {};
            if (input.oldValue !== undefined)
                built.oldValue = input.oldValue;
            if (input.newValue !== undefined)
                built.newValue = input.newValue;
            metadata = built;
        }
        return yield prisma.auditLog.create({
            data: {
                action: input.action,
                entity: (_a = input.entity) !== null && _a !== void 0 ? _a : null,
                entityId: (_b = input.entityId) !== null && _b !== void 0 ? _b : null,
                metadata: metadata !== null && metadata !== void 0 ? metadata : undefined,
                userId: (_c = input.userId) !== null && _c !== void 0 ? _c : null,
                ipAddress: (_d = input.ipAddress) !== null && _d !== void 0 ? _d : null,
                userAgent: (_e = input.userAgent) !== null && _e !== void 0 ? _e : null,
            },
        });
    }
    catch (error) {
        console.error("Audit log error:", error);
        return null;
    }
});
exports.createAuditLog = createAuditLog;
const getClientMeta = (req) => {
    var _a, _b, _c, _d;
    const forwardedFor = (_a = req.headers) === null || _a === void 0 ? void 0 : _a["x-forwarded-for"];
    const ipAddress = typeof forwardedFor === "string"
        ? forwardedFor.split(",")[0].trim()
        : (_b = req.ip) !== null && _b !== void 0 ? _b : (_c = req.socket) === null || _c === void 0 ? void 0 : _c.remoteAddress;
    const userAgent = typeof ((_d = req.headers) === null || _d === void 0 ? void 0 : _d["user-agent"]) === "string"
        ? req.headers["user-agent"]
        : undefined;
    return { ipAddress, userAgent };
};
exports.getClientMeta = getClientMeta;
