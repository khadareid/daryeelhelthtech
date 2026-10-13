// src/routes/auth/session.routes.ts  (adjust path as needed)

import express, { Request, Response } from "express";
import { prisma } from "../../lib/prisma";
import { createAuditLog, getClientMeta } from "../../services/audit.service";
import {
  generateTokens,
  verifyRefreshToken,
  TokenPayload,
} from "../../helpers/GenerateToken";

const router = express.Router();

/* ============================================================
   POST /refresh-token
   ============================================================ */
router.post("/refresh-token", async (req: Request, res: Response) => {
  const { refreshToken } = req.body as { refreshToken?: string };

  if (!refreshToken) {
    res.status(400).json({
      isSuccess: false,
      message: "Refresh token is required",
    });
    return;
  }

  try {
    const storedSession = await prisma.session.findUnique({
      where: { refreshToken },
      include: { user: true },
    });

    if (!storedSession) {
      res.status(403).json({
        isSuccess: false,
        message: "Invalid refresh token",
      });
      return;
    }

    if (storedSession.revokedAt) {
      res.status(403).json({
        isSuccess: false,
        message: "Session has been revoked",
      });
      return;
    }

    if (storedSession.expiresAt < new Date()) {
      await prisma.session.delete({ where: { refreshToken } });
      res.status(403).json({
        isSuccess: false,
        message: "Session expired. Please log in again.",
      });
      return;
    }

    /* ── Verify JWT signature ── */
    let payload: TokenPayload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      await prisma.session.deleteMany({ where: { refreshToken } });
      res.status(403).json({
        isSuccess: false,
        message: "Invalid refresh token",
      });
      return;
    }

    /* ── Reload the user ── */
    const user = await prisma.user.findUnique({
      where: { userid: payload.userId },
      select: {
        userid: true,
        email: true,
        role: true,
        isActive: true,
        isSuspended: true,
        isDeleted: true,
      },
    });

    if (!user || user.isDeleted || !user.isActive || user.isSuspended) {
      await prisma.session.deleteMany({ where: { refreshToken } });
      res.status(403).json({
        isSuccess: false,
        message: "Account is not active",
      });
      return;
    }

    /* ── Build fresh token payload ── */
    const tokenPayload: TokenPayload = {
      userId: user.userid,
      email: user.email,
      role: user.role,
    };

    /* ── Rotate: delete old session before issuing a new one ── */
    await prisma.session.deleteMany({ where: { refreshToken } });

    const { accessToken, refreshToken: newRefreshToken } =
      await generateTokens(tokenPayload);

    /* ── Audit log ── */
    const meta = getClientMeta(req);
    await createAuditLog({
      action: "TOKEN_REFRESH",
      entity: "Session",
      entityId: storedSession.sessionid,
      userId: user.userid,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      metadata: { email: user.email, role: user.role },
    });

    res.status(200).json({
      isSuccess: true,
      message: "Token refreshed",
      accessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    console.error("⚠️ Refresh token error:", error);
    res.status(500).json({
      isSuccess: false,
      message: "Failed to refresh token",
    });
  }
});

/* ============================================================
   POST /logout
   ============================================================ */
router.post("/logout", async (req: Request, res: Response) => {
  const { refreshToken } = req.body as { refreshToken?: string };

  if (!refreshToken) {
    res.status(400).json({
      isSuccess: false,
      message: "Refresh token is required",
    });
    return;
  }

  try {
    const session = await prisma.session.findUnique({
      where: { refreshToken },
    });

    await prisma.session.deleteMany({ where: { refreshToken } });

    if (session?.userId) {
      const meta = getClientMeta(req);
      await createAuditLog({
        action: "LOGOUT",
        entity: "User",
        entityId: session.userId,
        userId: session.userId,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
        metadata: { sessionId: session.sessionid },
      });
    }

    res.status(200).json({
      isSuccess: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      isSuccess: false,
      message: "Failed to logout",
    });
  }
});

export default router;