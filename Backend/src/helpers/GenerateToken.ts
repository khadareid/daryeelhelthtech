// helpers/GenerateToken.ts

import jwt from "jsonwebtoken";
import { Role, User } from "@prisma/client";
import { prisma } from "../lib/prisma";

/* -------------------------------------------------------------
   Config
------------------------------------------------------------- */
const ACCESS_SECRET =
  process.env.JWT_SECRET ??
  process.env.JWT_SECRET_TOKEN ??
  "dev-access-secret";

const REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET ?? "dev-refresh-secret";

const ACCESS_TTL   = "1d";   // 1 day
const REFRESH_DAYS = 7;      // 7 days

/* -------------------------------------------------------------
   Types
------------------------------------------------------------- */

/** Full DB user record (matches Prisma's User model). */
export type UserData = User;

/** Minimal payload used to sign JWTs. */
export interface TokenPayload {
  userId:    string;
  email:     string;
  role:      Role;
  tenantId?: number | null;
}

/* -------------------------------------------------------------
   generateTokens
   - Creates access + refresh tokens
   - Persists a new Session row
------------------------------------------------------------- */
export const generateTokens = async (payload: TokenPayload) => {
  const jwtPayload = {
    userId:   payload.userId,
    email:    payload.email,
    role:     payload.role,
    tenantId: payload.tenantId ?? null,
  };

  const accessToken = jwt.sign(jwtPayload, ACCESS_SECRET, {
    expiresIn: ACCESS_TTL,
  });

  const refreshToken = jwt.sign(jwtPayload, REFRESH_SECRET, {
    expiresIn: `${REFRESH_DAYS}d`,
  });

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_DAYS);

  // ⚠️ IMPORTANT: only ONE user id field — see the schema note below.
  await prisma.session.create({
    data: {
      userId: payload.userId,
      refreshToken,
      expiresAt,
    },
  });

  return { accessToken, refreshToken };
};

/* -------------------------------------------------------------
   verifyRefreshToken
   - Returns the decoded refresh JWT payload
------------------------------------------------------------- */
export const verifyRefreshToken = (token: string): TokenPayload => {
  const decoded = jwt.verify(token, REFRESH_SECRET) as jwt.JwtPayload;

  if (!decoded.userId || typeof decoded.userId !== "string") {
    throw new Error("Invalid refresh token payload");
  }

  return {
    userId:   decoded.userId as string,
    email:    (decoded.email as string) ?? "",
    role:     decoded.role as Role,
    tenantId: (decoded.tenantId as number | null) ?? null,
  };
};

/* -------------------------------------------------------------
   verifyAccessToken  (optional but handy)
   - Use in your auth middleware
------------------------------------------------------------- */
export const verifyAccessToken = (token: string): TokenPayload => {
  const decoded = jwt.verify(token, ACCESS_SECRET) as jwt.JwtPayload;

  if (!decoded.userId || typeof decoded.userId !== "string") {
    throw new Error("Invalid access token payload");
  }

  return {
    userId:   decoded.userId as string,
    email:    (decoded.email as string) ?? "",
    role:     decoded.role as Role,
    tenantId: (decoded.tenantId as number | null) ?? null,
  };
};