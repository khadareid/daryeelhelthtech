import { randomInt } from "crypto";

type OtpEntry = {
  code: string;
  email: string;
  userId: string;
  expiresAt: number;
};

const store = new Map<string, OtpEntry>();
const TTL_MS = 10 * 60 * 1000;

const keyFor = (email: string) => email.trim().toLowerCase();

export const createOtp = (email: string, userId: string) => {
  const normalized = keyFor(email);
  const code = randomInt(100000, 1000000).toString();
  store.set(normalized, {
    code,
    email: normalized,
    userId,
    expiresAt: Date.now() + TTL_MS,
  });
  return { code, expiresIn: Math.floor(TTL_MS / 1000) };
};

export const consumeOtp = (email: string, code: string) => {
  const normalized = keyFor(email);
  const entry = store.get(normalized);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    store.delete(normalized);
    return null;
  }
  if (entry.code !== String(code).trim()) return null;
  store.delete(normalized);
  return entry;
};

export const peekOtp = (email: string) => store.get(keyFor(email)) ?? null;

// Periodic cleanup
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.expiresAt < now) store.delete(key);
  }
}, 60_000).unref?.();
