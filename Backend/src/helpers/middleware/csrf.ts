import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import type { NextFunction, Request, Response } from "express";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
export const CSRF_COOKIE = "csrf-token";
export const CSRF_HEADER = "x-csrf-token";
const TOKEN_TTL_MS = 2 * 60 * 60 * 1000;

function csrfSecret(): string {
  return (
    process.env.CSRF_SECRET ||
    process.env.SESSION_SECRET ||
    process.env.JWT_SECRET ||
    process.env.JWT_SECRET_TOKEN ||
    "dev-csrf-secret"
  );
}

export function readCookie(req: Request, name: string): string {
  const raw = req.headers.cookie;
  if (!raw) return "";
  for (const part of raw.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }
  return "";
}

function cookieSecure(req: Request): boolean {
  const forwarded = String(req.headers["x-forwarded-proto"] || "")
    .split(",")[0]
    .trim();
  return req.secure || forwarded === "https";
}

function sign(payload: string): string {
  return createHmac("sha256", csrfSecret()).update(payload).digest("hex");
}

function safeEqual(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/** Signed token: issuedAt.nonce.hmac — works without cookies (mobile / cross-site). */
export function createSignedCsrfToken(): string {
  const issuedAt = Date.now().toString(36);
  const nonce = randomBytes(16).toString("hex");
  const payload = `${issuedAt}.${nonce}`;
  return `${payload}.${sign(payload)}`;
}

export function isValidCsrfToken(token: string): boolean {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [issuedAt, nonce, mac] = parts;
  if (!issuedAt || !nonce || !mac) return false;
  const payload = `${issuedAt}.${nonce}`;
  const expected = sign(payload);
  if (!safeEqual(expected, mac)) return false;
  const age = Date.now() - parseInt(issuedAt, 36);
  if (!Number.isFinite(age) || age < 0 || age > TOKEN_TTL_MS) return false;
  return true;
}

export function issueCsrfToken(req: Request, res: Response): string {
  const token = createSignedCsrfToken();
  const secure = cookieSecure(req);
  res.cookie(CSRF_COOKIE, token, {
    httpOnly: false,
    secure,
    sameSite: secure ? "none" : "lax",
    path: "/",
  });
  return token;
}

export function currentOrNewCsrf(req: Request, res: Response): string {
  const fromCookie = readCookie(req, CSRF_COOKIE);
  if (fromCookie && isValidCsrfToken(fromCookie)) return fromCookie;
  const fromLocals = res.locals.csrfToken as string | undefined;
  if (fromLocals && isValidCsrfToken(fromLocals)) return fromLocals;
  return issueCsrfToken(req, res);
}

export function csrfProtection(req: Request, res: Response, next: NextFunction): void {
  if (SAFE_METHODS.has(req.method)) {
    const existing = readCookie(req, CSRF_COOKIE);
    res.locals.csrfToken =
      existing && isValidCsrfToken(existing) ? existing : issueCsrfToken(req, res);
    next();
    return;
  }

  const cookieToken = readCookie(req, CSRF_COOKIE);
  const headerToken = req.get(CSRF_HEADER) ?? "";

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
