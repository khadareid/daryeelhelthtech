"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CSRF_HEADER = exports.CSRF_COOKIE = void 0;
exports.readCookie = readCookie;
exports.createSignedCsrfToken = createSignedCsrfToken;
exports.isValidCsrfToken = isValidCsrfToken;
exports.issueCsrfToken = issueCsrfToken;
exports.currentOrNewCsrf = currentOrNewCsrf;
exports.csrfProtection = csrfProtection;
const crypto_1 = require("crypto");
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
exports.CSRF_COOKIE = "csrf-token";
exports.CSRF_HEADER = "x-csrf-token";
const TOKEN_TTL_MS = 2 * 60 * 60 * 1000;
function csrfSecret() {
    return (process.env.CSRF_SECRET ||
        process.env.SESSION_SECRET ||
        process.env.JWT_SECRET ||
        process.env.JWT_SECRET_TOKEN ||
        "dev-csrf-secret");
}
function readCookie(req, name) {
    const raw = req.headers.cookie;
    if (!raw)
        return "";
    for (const part of raw.split(";")) {
        const [key, ...rest] = part.trim().split("=");
        if (key === name)
            return decodeURIComponent(rest.join("="));
    }
    return "";
}
function cookieSecure(req) {
    const forwarded = String(req.headers["x-forwarded-proto"] || "")
        .split(",")[0]
        .trim();
    return req.secure || forwarded === "https";
}
function sign(payload) {
    return (0, crypto_1.createHmac)("sha256", csrfSecret()).update(payload).digest("hex");
}
function safeEqual(left, right) {
    const a = Buffer.from(left);
    const b = Buffer.from(right);
    if (a.length !== b.length)
        return false;
    return (0, crypto_1.timingSafeEqual)(a, b);
}
/** Signed token: issuedAt.nonce.hmac — works without cookies (mobile / cross-site). */
function createSignedCsrfToken() {
    const issuedAt = Date.now().toString(36);
    const nonce = (0, crypto_1.randomBytes)(16).toString("hex");
    const payload = `${issuedAt}.${nonce}`;
    return `${payload}.${sign(payload)}`;
}
function isValidCsrfToken(token) {
    if (!token)
        return false;
    const parts = token.split(".");
    if (parts.length !== 3)
        return false;
    const [issuedAt, nonce, mac] = parts;
    if (!issuedAt || !nonce || !mac)
        return false;
    const payload = `${issuedAt}.${nonce}`;
    const expected = sign(payload);
    if (!safeEqual(expected, mac))
        return false;
    const age = Date.now() - parseInt(issuedAt, 36);
    if (!Number.isFinite(age) || age < 0 || age > TOKEN_TTL_MS)
        return false;
    return true;
}
function issueCsrfToken(req, res) {
    const token = createSignedCsrfToken();
    const secure = cookieSecure(req);
    res.cookie(exports.CSRF_COOKIE, token, {
        httpOnly: false,
        secure,
        sameSite: secure ? "none" : "lax",
        path: "/",
    });
    return token;
}
function currentOrNewCsrf(req, res) {
    const fromCookie = readCookie(req, exports.CSRF_COOKIE);
    if (fromCookie && isValidCsrfToken(fromCookie))
        return fromCookie;
    const fromLocals = res.locals.csrfToken;
    if (fromLocals && isValidCsrfToken(fromLocals))
        return fromLocals;
    return issueCsrfToken(req, res);
}
function csrfProtection(req, res, next) {
    var _a;
    if (SAFE_METHODS.has(req.method)) {
        const existing = readCookie(req, exports.CSRF_COOKIE);
        res.locals.csrfToken =
            existing && isValidCsrfToken(existing) ? existing : issueCsrfToken(req, res);
        next();
        return;
    }
    const cookieToken = readCookie(req, exports.CSRF_COOKIE);
    const headerToken = (_a = req.get(exports.CSRF_HEADER)) !== null && _a !== void 0 ? _a : "";
    // Prefer classic double-submit when the browser sent the cookie.
    if (cookieToken && headerToken && safeEqual(cookieToken, headerToken)) {
        next();
        return;
    }
    // Mobile / cross-site: cookie often dropped; accept a still-valid signed header token.
    if (headerToken && isValidCsrfToken(headerToken)) {
        next();
        return;
    }
    res.status(403).json({
        isSuccess: false,
        message: "CSRF token is missing or invalid",
    });
}
