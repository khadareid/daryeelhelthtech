import nodemailer from "nodemailer";
import { Request, Response } from "express";
import { prisma } from "../../lib/prisma";
import { createOtp } from "../../services/otp.service";

export const sendCode = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email || typeof email !== "string") {
      res.status(400).json({ message: "Email is required", isSuccess: false });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await prisma.user.findFirst({
      where: {
        email: normalizedEmail,
        isActive: true,
        deletedAt: null,
      },
    });

    if (!user) {
      res.status(404).json({
        message: "User not found or not active",
        isSuccess: false,
      });
      return;
    }

    const { code, expiresIn } = createOtp(normalizedEmail, user.userid);

    if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
      console.error("MAIL_USER or MAIL_PASS is missing");
      console.log(`[OTP] ${normalizedEmail} => ${code}`);
      res.status(200).json({
        message: "Verification code generated (email not configured)",
        isSuccess: true,
        expiresIn,
        ...(process.env.NODE_ENV !== "production" ? { debugCode: code } : {}),
      });
      return;
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.MAIL_USER,
      to: normalizedEmail,
      subject: "Verify Your Device - Daryeel Health",
      text: `Hello ${user.fullName},\n\nYour verification code is: ${code}\n\nExpires in 10 minutes.`,
      html: `<p>Hello ${user.fullName},</p><p>Your verification code is:</p><h2>${code}</h2><p>Expires in 10 minutes.</p>`,
    });

    res.status(200).json({
      message: "Verification code sent successfully",
      isSuccess: true,
      expiresIn,
    });
  } catch (error) {
    console.error("Send verification code error:", error);
    res.status(500).json({ message: "Server error", isSuccess: false });
  }
};
