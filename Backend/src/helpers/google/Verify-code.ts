import { AuditAction } from "@prisma/client";
import { Request, Response } from "express";
import { generateTokens } from "../GenerateToken";
import { prisma } from "../../lib/prisma";
import { createAuditLog, getClientMeta } from "../../services/audit.service";
import { consumeOtp } from "../../services/otp.service";

export const verifyCode = async (req: Request, res: Response) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      res.status(400).json({
        message: "Email and verification code are required",
        isSuccess: false,
      });
      return;
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const entry = consumeOtp(normalizedEmail, String(code));

    if (!entry) {
      res.status(401).json({
        message: "Invalid or expired verification code",
        isSuccess: false,
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user || user.deletedAt) {
      res.status(404).json({ message: "User not found", isSuccess: false });
      return;
    }

    const updated = await prisma.user.update({
      where: { userid: user.userid },
      data: {
        emailVerified: true,
        lastLoginAt: new Date(),
      },
    });

    const { accessToken, refreshToken } = await generateTokens({
      userId: updated.userid,
      email: updated.email,
      role: updated.role,
    });

    const meta = getClientMeta(req);
    await createAuditLog({
      action: AuditAction.LOGIN,
      entity: "User",
      entityId: updated.userid,
      description: "Email OTP verification login",
      userId: updated.userid,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    res.status(200).json({
      message: "Verification successful",
      isSuccess: true,
      result: {
        user: {
          userId: updated.userid,
          name: updated.fullName,
          email: updated.email,
          phone: updated.phone,
          image: updated.picture,
          role: updated.role,
          emailVerified: true,
        },
        accessToken,
        refreshToken,
      },
      user: {
        userId: updated.userid,
        name: updated.fullName,
        email: updated.email,
        phone: updated.phone,
        image: updated.picture,
        role: updated.role,
        emailVerified: true,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error("Verify code error:", error);
    res.status(500).json({ message: "Server error", isSuccess: false });
  }
};
