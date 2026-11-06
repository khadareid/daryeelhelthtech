import { prisma } from "../lib/prisma";
import { createOwnedRouter } from "../utils/createOwnedRouter";
import {
  optionalString,
  parseBool,
  parseDate,
  requireString,
} from "../utils/validation";

export default createOwnedRouter(prisma.healthDeviceConnection, {
  sanitizeCreate: (body) => ({
    provider: requireString(body.provider, "provider"),
    deviceName: optionalString(body.deviceName) ?? null,
    providerUserId: optionalString(body.providerUserId) ?? null,
    accessTokenEncrypted: optionalString(body.accessTokenEncrypted) ?? null,
    refreshTokenEncrypted: optionalString(body.refreshTokenEncrypted) ?? null,
    tokenExpiresAt: parseDate(body.tokenExpiresAt, "tokenExpiresAt") ?? null,
    scopes: Array.isArray(body.scopes)
      ? body.scopes.map(String)
      : [],
    isActive: parseBool(body.isActive, true),
    lastSyncAt: parseDate(body.lastSyncAt, "lastSyncAt") ?? null,
    lastError: optionalString(body.lastError) ?? null,
  }),
  sanitizeUpdate: (body) => {
    const data: Record<string, unknown> = {};
    if (body.provider !== undefined)
      data.provider = requireString(body.provider, "provider");
    if (body.deviceName !== undefined)
      data.deviceName = optionalString(body.deviceName) ?? null;
    if (body.providerUserId !== undefined)
      data.providerUserId = optionalString(body.providerUserId) ?? null;
    if (body.accessTokenEncrypted !== undefined)
      data.accessTokenEncrypted = optionalString(body.accessTokenEncrypted) ?? null;
    if (body.refreshTokenEncrypted !== undefined)
      data.refreshTokenEncrypted =
        optionalString(body.refreshTokenEncrypted) ?? null;
    if (body.tokenExpiresAt !== undefined)
      data.tokenExpiresAt = parseDate(body.tokenExpiresAt, "tokenExpiresAt") ?? null;
    if (body.scopes !== undefined)
      data.scopes = Array.isArray(body.scopes) ? body.scopes.map(String) : [];
    if (body.isActive !== undefined) data.isActive = parseBool(body.isActive);
    if (body.lastSyncAt !== undefined)
      data.lastSyncAt = parseDate(body.lastSyncAt, "lastSyncAt") ?? null;
    if (body.lastError !== undefined)
      data.lastError = optionalString(body.lastError) ?? null;
    return data;
  },
});
