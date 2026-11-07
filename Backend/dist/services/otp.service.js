"use strict";
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.peekOtp = exports.consumeOtp = exports.createOtp = void 0;
const crypto_1 = require("crypto");
const store = new Map();
const TTL_MS = 10 * 60 * 1000;
const keyFor = (email) => email.trim().toLowerCase();
const createOtp = (email, userId) => {
    const normalized = keyFor(email);
    const code = (0, crypto_1.randomInt)(100000, 1000000).toString();
    store.set(normalized, {
        code,
        email: normalized,
        userId,
        expiresAt: Date.now() + TTL_MS,
    });
    return { code, expiresIn: Math.floor(TTL_MS / 1000) };
};
exports.createOtp = createOtp;
const consumeOtp = (email, code) => {
    const normalized = keyFor(email);
    const entry = store.get(normalized);
    if (!entry)
        return null;
    if (entry.expiresAt < Date.now()) {
        store.delete(normalized);
        return null;
    }
    if (entry.code !== String(code).trim())
        return null;
    store.delete(normalized);
    return entry;
};
exports.consumeOtp = consumeOtp;
const peekOtp = (email) => { var _a; return (_a = store.get(keyFor(email))) !== null && _a !== void 0 ? _a : null; };
exports.peekOtp = peekOtp;
// Periodic cleanup
(_b = (_a = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
        if (entry.expiresAt < now)
            store.delete(key);
    }
}, 60000)).unref) === null || _b === void 0 ? void 0 : _b.call(_a);
