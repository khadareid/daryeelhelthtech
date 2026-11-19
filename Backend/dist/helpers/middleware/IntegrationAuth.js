"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireIntegrationKey = void 0;
/** Must match SaaS HEALTHTECH_INTEGRATION_KEY / SAAS_INTEGRATION_KEY */
const DEFAULT_INTEGRATION_KEY = "daryeel-healthtech-saas-shared-2026";
function envIntegrationKey() {
    const raw = (process.env.SAAS_INTEGRATION_KEY ||
        process.env.HEALTHTECH_INTEGRATION_KEY ||
        "").trim();
    if (!raw ||
        raw === "replace-with-shared-integration-key" ||
        raw === "replace-me") {
        return DEFAULT_INTEGRATION_KEY;
    }
    return raw;
}
/**
 * Authenticate SaaS → Healthtech server calls via:
 *   Authorization: Bearer <key>  or  X-Integration-Key: <key>
 */
const requireIntegrationKey = (req, res, next) => {
    var _a;
    const header = req.header("x-integration-key") ||
        (((_a = req.header("authorization")) === null || _a === void 0 ? void 0 : _a.startsWith("Bearer "))
            ? req.header("authorization").slice(7)
            : "");
    if (!header) {
        res.status(401).json({
            isSuccess: false,
            message: "Integration API key required",
        });
        return;
    }
    const expected = envIntegrationKey();
    if (header.trim() !== expected) {
        res.status(401).json({
            isSuccess: false,
            message: "Invalid integration API key",
        });
        return;
    }
    next();
};
exports.requireIntegrationKey = requireIntegrationKey;
