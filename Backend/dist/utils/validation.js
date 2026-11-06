"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseEnum = exports.parseNumber = exports.parseBool = exports.parseDate = exports.requireEmail = exports.optionalString = exports.requireString = void 0;
const ownership_1 = require("./ownership");
const requireString = (value, field, opts) => {
    if (typeof value !== "string" || !value.trim()) {
        throw new ownership_1.HttpError(400, `${field} is required`);
    }
    const trimmed = value.trim();
    if ((opts === null || opts === void 0 ? void 0 : opts.min) && trimmed.length < opts.min) {
        throw new ownership_1.HttpError(400, `${field} is too short`);
    }
    if ((opts === null || opts === void 0 ? void 0 : opts.max) && trimmed.length > opts.max) {
        throw new ownership_1.HttpError(400, `${field} is too long`);
    }
    return trimmed;
};
exports.requireString = requireString;
const optionalString = (value) => {
    if (value === undefined || value === null || value === "")
        return undefined;
    if (typeof value !== "string")
        throw new ownership_1.HttpError(400, "Invalid string");
    return value.trim();
};
exports.optionalString = optionalString;
const requireEmail = (value) => {
    const email = (0, exports.requireString)(value, "email").toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new ownership_1.HttpError(400, "Invalid email");
    }
    return email;
};
exports.requireEmail = requireEmail;
const parseDate = (value, field, required = false) => {
    if (value === undefined || value === null || value === "") {
        if (required)
            throw new ownership_1.HttpError(400, `${field} is required`);
        return undefined;
    }
    const date = new Date(String(value));
    if (Number.isNaN(date.getTime())) {
        throw new ownership_1.HttpError(400, `Invalid ${field}`);
    }
    return date;
};
exports.parseDate = parseDate;
const parseBool = (value, fallback) => {
    if (value === undefined || value === null || value === "")
        return fallback;
    if (typeof value === "boolean")
        return value;
    if (value === "true" || value === "1")
        return true;
    if (value === "false" || value === "0")
        return false;
    throw new ownership_1.HttpError(400, "Invalid boolean");
};
exports.parseBool = parseBool;
const parseNumber = (value, field = "value", required = false) => {
    if (value === undefined || value === null || value === "") {
        if (required)
            throw new ownership_1.HttpError(400, `${field} is required`);
        return undefined;
    }
    const n = Number(value);
    if (Number.isNaN(n))
        throw new ownership_1.HttpError(400, `Invalid ${field}`);
    return n;
};
exports.parseNumber = parseNumber;
const parseEnum = (value, allowed, field, required = false) => {
    if (value === undefined || value === null || value === "") {
        if (required)
            throw new ownership_1.HttpError(400, `${field} is required`);
        return undefined;
    }
    const str = String(value);
    if (!allowed.includes(str)) {
        throw new ownership_1.HttpError(400, `Invalid ${field}`);
    }
    return str;
};
exports.parseEnum = parseEnum;
