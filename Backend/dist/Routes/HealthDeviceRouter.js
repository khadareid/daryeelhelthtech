"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = require("../lib/prisma");
const createOwnedRouter_1 = require("../utils/createOwnedRouter");
const validation_1 = require("../utils/validation");
exports.default = (0, createOwnedRouter_1.createOwnedRouter)(prisma_1.prisma.healthDeviceConnection, {
    sanitizeCreate: (body) => {
        var _a, _b, _c, _d, _e, _f, _g;
        return ({
            provider: (0, validation_1.requireString)(body.provider, "provider"),
            deviceName: (_a = (0, validation_1.optionalString)(body.deviceName)) !== null && _a !== void 0 ? _a : null,
            providerUserId: (_b = (0, validation_1.optionalString)(body.providerUserId)) !== null && _b !== void 0 ? _b : null,
            accessTokenEncrypted: (_c = (0, validation_1.optionalString)(body.accessTokenEncrypted)) !== null && _c !== void 0 ? _c : null,
            refreshTokenEncrypted: (_d = (0, validation_1.optionalString)(body.refreshTokenEncrypted)) !== null && _d !== void 0 ? _d : null,
            tokenExpiresAt: (_e = (0, validation_1.parseDate)(body.tokenExpiresAt, "tokenExpiresAt")) !== null && _e !== void 0 ? _e : null,
            scopes: Array.isArray(body.scopes)
                ? body.scopes.map(String)
                : [],
            isActive: (0, validation_1.parseBool)(body.isActive, true),
            lastSyncAt: (_f = (0, validation_1.parseDate)(body.lastSyncAt, "lastSyncAt")) !== null && _f !== void 0 ? _f : null,
            lastError: (_g = (0, validation_1.optionalString)(body.lastError)) !== null && _g !== void 0 ? _g : null,
        });
    },
    sanitizeUpdate: (body) => {
        var _a, _b, _c, _d, _e, _f, _g;
        const data = {};
        if (body.provider !== undefined)
            data.provider = (0, validation_1.requireString)(body.provider, "provider");
        if (body.deviceName !== undefined)
            data.deviceName = (_a = (0, validation_1.optionalString)(body.deviceName)) !== null && _a !== void 0 ? _a : null;
        if (body.providerUserId !== undefined)
            data.providerUserId = (_b = (0, validation_1.optionalString)(body.providerUserId)) !== null && _b !== void 0 ? _b : null;
        if (body.accessTokenEncrypted !== undefined)
            data.accessTokenEncrypted = (_c = (0, validation_1.optionalString)(body.accessTokenEncrypted)) !== null && _c !== void 0 ? _c : null;
        if (body.refreshTokenEncrypted !== undefined)
            data.refreshTokenEncrypted =
                (_d = (0, validation_1.optionalString)(body.refreshTokenEncrypted)) !== null && _d !== void 0 ? _d : null;
        if (body.tokenExpiresAt !== undefined)
            data.tokenExpiresAt = (_e = (0, validation_1.parseDate)(body.tokenExpiresAt, "tokenExpiresAt")) !== null && _e !== void 0 ? _e : null;
        if (body.scopes !== undefined)
            data.scopes = Array.isArray(body.scopes) ? body.scopes.map(String) : [];
        if (body.isActive !== undefined)
            data.isActive = (0, validation_1.parseBool)(body.isActive);
        if (body.lastSyncAt !== undefined)
            data.lastSyncAt = (_f = (0, validation_1.parseDate)(body.lastSyncAt, "lastSyncAt")) !== null && _f !== void 0 ? _f : null;
        if (body.lastError !== undefined)
            data.lastError = (_g = (0, validation_1.optionalString)(body.lastError)) !== null && _g !== void 0 ? _g : null;
        return data;
    },
});
