import { HttpError } from "./ownership";

export const requireString = (
  value: unknown,
  field: string,
  opts?: { min?: number; max?: number }
) => {
  if (typeof value !== "string" || !value.trim()) {
    throw new HttpError(400, `${field} is required`);
  }
  const trimmed = value.trim();
  if (opts?.min && trimmed.length < opts.min) {
    throw new HttpError(400, `${field} is too short`);
  }
  if (opts?.max && trimmed.length > opts.max) {
    throw new HttpError(400, `${field} is too long`);
  }
  return trimmed;
};

export const optionalString = (value: unknown) => {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string") throw new HttpError(400, "Invalid string");
  return value.trim();
};

export const requireEmail = (value: unknown) => {
  const email = requireString(value, "email").toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new HttpError(400, "Invalid email");
  }
  return email;
};

export const parseDate = (value: unknown, field: string, required = false) => {
  if (value === undefined || value === null || value === "") {
    if (required) throw new HttpError(400, `${field} is required`);
    return undefined;
  }
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) {
    throw new HttpError(400, `Invalid ${field}`);
  }
  return date;
};

export const parseBool = (value: unknown, fallback?: boolean) => {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "boolean") return value;
  if (value === "true" || value === "1") return true;
  if (value === "false" || value === "0") return false;
  throw new HttpError(400, "Invalid boolean");
};

export const parseNumber = (
  value: unknown,
  field = "value",
  required = false
) => {
  if (value === undefined || value === null || value === "") {
    if (required) throw new HttpError(400, `${field} is required`);
    return undefined;
  }
  const n = Number(value);
  if (Number.isNaN(n)) throw new HttpError(400, `Invalid ${field}`);
  return n;
};

export const parseEnum = <T extends string>(
  value: unknown,
  allowed: readonly T[],
  field: string,
  required = false
): T | undefined => {
  if (value === undefined || value === null || value === "") {
    if (required) throw new HttpError(400, `${field} is required`);
    return undefined;
  }
  const str = String(value);
  if (!allowed.includes(str as T)) {
    throw new HttpError(400, `Invalid ${field}`);
  }
  return str as T;
};
