"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const PassportConfig_1 = __importDefault(require("../config/PassportConfig"));
const router = (0, express_1.Router)();
const frontendBase = () => {
    const fromEnv = (process.env.FRONTEND_URL || "").replace(/"/g, "").trim();
    return (fromEnv ||
        "https://daryeel-healthtech.vercel.app").replace(/\/$/, "");
};
function isAllowedAppRedirect(value) {
    try {
        const url = new URL(value);
        const protocol = url.protocol.replace(":", "");
        if (protocol === "daryeelhealth")
            return true;
        if (protocol === "exp")
            return true;
        if (protocol === "exps")
            return true;
        if (url.hostname === "localhost" || url.hostname === "127.0.0.1")
            return true;
        return false;
    }
    catch (_a) {
        return false;
    }
}
function encodeState(payload) {
    return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}
function decodeState(raw) {
    if (!raw)
        return {};
    try {
        const json = Buffer.from(raw, "base64url").toString("utf8");
        const parsed = JSON.parse(json);
        return parsed && typeof parsed === "object" ? parsed : {};
    }
    catch (_a) {
        return {};
    }
}
// ============================================================
// GOOGLE OAUTH
// ============================================================
router.get("/google", (req, res, next) => {
    const appRedirect = String(req.query.app_redirect || "").trim();
    const statePayload = {};
    if (appRedirect && isAllowedAppRedirect(appRedirect)) {
        statePayload.app_redirect = appRedirect;
    }
    PassportConfig_1.default.authenticate("google", {
        scope: ["profile", "email"],
        state: encodeState(statePayload),
    })(req, res, next);
});
// ============================================================
// GOOGLE CALLBACK
// ============================================================
router.get("/google/callback", (req, res, next) => {
    PassportConfig_1.default.authenticate("google", { session: false }, (err, user) => {
        const frontend = frontendBase();
        const state = decodeState(typeof req.query.state === "string" ? req.query.state : undefined);
        const appRedirect = state.app_redirect || "";
        const targetBase = appRedirect && isAllowedAppRedirect(appRedirect)
            ? appRedirect
            : `${frontend}/auth/google/callback`;
        if (err || !user) {
            const message = encodeURIComponent((err === null || err === void 0 ? void 0 : err.message) || "Google sign-in failed");
            const joiner = targetBase.includes("?") ? "&" : "?";
            res.redirect(`${targetBase}${joiner}error=${message}`);
            return;
        }
        const joiner = targetBase.includes("?") ? "&" : "?";
        const redirectUrl = `${targetBase}${joiner}` +
            `accessToken=${encodeURIComponent(user.accessToken)}` +
            `&refreshToken=${encodeURIComponent(user.refreshToken)}` +
            `&userId=${encodeURIComponent(user.userId)}` +
            `&name=${encodeURIComponent(user.name)}` +
            `&email=${encodeURIComponent(user.email)}` +
            `&image=${encodeURIComponent(user.picture || "")}` +
            `&role=${encodeURIComponent(user.role)}`;
        res.redirect(redirectUrl);
    })(req, res, next);
});
exports.default = router;
