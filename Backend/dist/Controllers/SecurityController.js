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
exports.patchRecoveryEmail = exports.patchSecurityEmail = exports.patchSecurityPhone = exports.revokeOtherSecuritySessions = exports.revokeSecuritySession = exports.securitySessions = exports.securityActivity = exports.securityStatus = void 0;
const audit_service_1 = require("../services/audit.service");
const security_service_1 = require("../services/security.service");
const errors_1 = require("../utils/errors");
const ownership_1 = require("../utils/ownership");
const response_1 = require("../utils/response");
function refreshFromReq(req) {
    var _a;
    return (req.headers["x-refresh-token"] ||
        ((_a = req.body) === null || _a === void 0 ? void 0 : _a.refreshToken) ||
        (typeof req.query.refreshToken === "string"
            ? req.query.refreshToken
            : undefined) ||
        undefined);
}
const securityStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = (0, ownership_1.requireUser)(req);
        (0, response_1.ok)(res, yield (0, security_service_1.getSecurityStatus)(user.userId));
    }
    catch (error) {
        (0, errors_1.handleRouteError)(error, res);
    }
});
exports.securityStatus = securityStatus;
const securityActivity = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = (0, ownership_1.requireUser)(req);
        const limit = Number(req.query.limit || 30);
        (0, response_1.ok)(res, yield (0, security_service_1.listSecurityActivity)(user.userId, limit));
    }
    catch (error) {
        (0, errors_1.handleRouteError)(error, res);
    }
});
exports.securityActivity = securityActivity;
const securitySessions = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = (0, ownership_1.requireUser)(req);
        (0, response_1.ok)(res, yield (0, security_service_1.getSessions)(user.userId, refreshFromReq(req)));
    }
    catch (error) {
        (0, errors_1.handleRouteError)(error, res);
    }
});
exports.securitySessions = securitySessions;
const revokeSecuritySession = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = (0, ownership_1.requireUser)(req);
        const meta = (0, audit_service_1.getClientMeta)(req);
        (0, response_1.ok)(res, yield (0, security_service_1.revokeOneSession)(user.userId, String(req.params.id), refreshFromReq(req), meta), "Session revoked");
    }
    catch (error) {
        (0, errors_1.handleRouteError)(error, res);
    }
});
exports.revokeSecuritySession = revokeSecuritySession;
const revokeOtherSecuritySessions = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = (0, ownership_1.requireUser)(req);
        const meta = (0, audit_service_1.getClientMeta)(req);
        (0, response_1.ok)(res, yield (0, security_service_1.revokeOthers)(user.userId, refreshFromReq(req), meta), "All other devices have been signed out.");
    }
    catch (error) {
        (0, errors_1.handleRouteError)(error, res);
    }
});
exports.revokeOtherSecuritySessions = revokeOtherSecuritySessions;
const patchSecurityPhone = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = (0, ownership_1.requireUser)(req);
        const meta = (0, audit_service_1.getClientMeta)(req);
        (0, response_1.ok)(res, yield (0, security_service_1.updateSecurityPhone)(user.userId, req.body || {}, meta), "Phone updated");
    }
    catch (error) {
        (0, errors_1.handleRouteError)(error, res);
    }
});
exports.patchSecurityPhone = patchSecurityPhone;
const patchSecurityEmail = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = (0, ownership_1.requireUser)(req);
        const meta = (0, audit_service_1.getClientMeta)(req);
        (0, response_1.ok)(res, yield (0, security_service_1.updatePrimaryEmail)(user.userId, req.body || {}, meta), "Email updated");
    }
    catch (error) {
        (0, errors_1.handleRouteError)(error, res);
    }
});
exports.patchSecurityEmail = patchSecurityEmail;
const patchRecoveryEmail = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = (0, ownership_1.requireUser)(req);
        (0, response_1.ok)(res, yield (0, security_service_1.updateRecoveryEmail)(user.userId, req.body || {}), "Recovery email updated");
    }
    catch (error) {
        (0, errors_1.handleRouteError)(error, res);
    }
});
exports.patchRecoveryEmail = patchRecoveryEmail;
