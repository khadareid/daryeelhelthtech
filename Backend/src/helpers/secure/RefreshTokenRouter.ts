import { Router, Request, Response } from "express";
import { prisma } from "../../lib/prisma";
import { generateTokens, verifyRefreshToken } from "../GenerateToken";

const router = Router();

router.post("/", async (req: Request, res: Response) => {
  try {
    const refreshToken =
      (req.body?.refreshToken as string | undefined) ||
      (req.headers["x-refresh-token"] as string | undefined);

    if (!refreshToken) {
      res.status(400).json({
        isSuccess: false,
        message: "Refresh token is required",
      });
      return;
    }

    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      res.status(401).json({
        isSuccess: false,
        message: "Invalid or expired refresh token",
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { userid: payload.userId },
      select: {
        userid: true,
        email: true,
        role: true,
        isActive: true,
        isSuspended: true,
        deletedAt: true,
      },
    });

    if (!user || user.deletedAt || !user.isActive || user.isSuspended) {
      res.status(401).json({
        isSuccess: false,
        message: "User is not allowed to refresh session",
      });
      return;
    }

    const tokens = await generateTokens({
      userId: user.userid,
      email: user.email,
      role: user.role,
    });

    res.status(200).json({
      isSuccess: true,
      message: "Token refreshed",
      result: tokens,
    });
  } catch (error) {
    console.error("Refresh token error:", error);
    res.status(500).json({ isSuccess: false, message: "Could not refresh token" });
  }
});

router.post("/logout", async (req: Request, res: Response) => {
  // Stateless JWTs — client discards tokens
  res.status(200).json({ isSuccess: true, message: "Logged out" });
});

export default router;
