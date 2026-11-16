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

/**
 * Normalize to E.164-style: +[digits], e.g. +252634000100.
 * No OTP / verification — collect & store only.
 */
export const normalizePhone = (value: unknown): string | null => {
  if (value === undefined || value === null || value === "") return null;
  const raw = String(value).trim();
  if (!raw) return null;
  let digits = raw.replace(/[^\d+]/g, "");
  if (digits.startsWith("00")) digits = `+${digits.slice(2)}`;
  if (!digits.startsWith("+")) digits = `+${digits.replace(/\D/g, "")}`;
  const normalized = `+${digits.slice(1).replace(/\D/g, "")}`;
  return normalized === "+" ? null : normalized;
};

export const requirePhone = (value: unknown, field = "phone") => {
  const phone = normalizePhone(value);
  if (!phone) throw new HttpError(400, `${field} is required`);
  const digits = phone.slice(1);
  if (!/^\d{8,15}$/.test(digits)) {
    throw new HttpError(
      400,
      "Invalid phone number. Use international format, e.g. +252 63 XXX XXXX"
    );
  }
  return phone;
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
