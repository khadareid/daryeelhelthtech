import jwt from "jsonwebtoken";
import { Role } from "@prisma/client";

const ACCESS_SECRET =
  process.env.JWT_SECRET ??
  process.env.JWT_SECRET_TOKEN ??
  "dev-access-secret";

const REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET ?? "dev-refresh-secret";

const ACCESS_TTL = "1d";
const REFRESH_DAYS = 7;

export type UserData = {
  userId: string;
  email: string;
  role: Role;
};

export interface TokenPayload {
  userId: string;
  email: string;
  role: Role;
}

export const generateTokens = async (payload: TokenPayload) => {
  const jwtPayload = {
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
  };

  const accessToken = jwt.sign(jwtPayload, ACCESS_SECRET, {
    expiresIn: ACCESS_TTL,
  });

  const refreshToken = jwt.sign(jwtPayload, REFRESH_SECRET, {
    expiresIn: `${REFRESH_DAYS}d`,
  });

  return { accessToken, refreshToken };
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  const decoded = jwt.verify(token, REFRESH_SECRET) as jwt.JwtPayload;

  if (!decoded.userId || typeof decoded.userId !== "string") {
    throw new Error("Invalid refresh token payload");
  }

  return {
    userId: decoded.userId,
    email: (decoded.email as string) ?? "",
    role: decoded.role as Role,
  };
};

export const verifyAccessToken = (token: string): TokenPayload => {
  const decoded = jwt.verify(token, ACCESS_SECRET) as jwt.JwtPayload;

  if (!decoded.userId || typeof decoded.userId !== "string") {
    throw new Error("Invalid access token payload");
  }

  return {
    userId: decoded.userId,
    email: (decoded.email as string) ?? "",
    role: decoded.role as Role,
  };
};
