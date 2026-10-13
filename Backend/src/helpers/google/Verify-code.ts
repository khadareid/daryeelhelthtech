import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { generateTokens } from '../GenerateToken';
 

const prisma = new PrismaClient();

export const verifyCode = async (req: Request, res: Response) => {
  try {
    const { email, code } = req.body;

    // --------------------------------------------------------
    // Validate input
    // --------------------------------------------------------

    if (!email || !code) {
      res.status(400).json({
        message: 'Email and verification code are required',
        isSuccess: false,
      });
      return;
    }

    // --------------------------------------------------------
    // Find verification code
    // --------------------------------------------------------

    const record = await prisma.verificationCode.findFirst({
      where: {
        email,
        code,
        purpose: 'EMAIL_VERIFICATION',
        isUsed: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // --------------------------------------------------------
    // Check code
    // --------------------------------------------------------

    if (!record) {
      res.status(401).json({
        message: 'Invalid verification code',
        isSuccess: false,
      });
      return;
    }

    if (record.expiresAt < new Date()) {
      res.status(401).json({
        message: 'Verification code has expired',
        isSuccess: false,
      });
      return;
    }

    // --------------------------------------------------------
    // Find user
    // --------------------------------------------------------

    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      res.status(404).json({
        message: 'User not found',
        isSuccess: false,
      });
      return;
    }

    // --------------------------------------------------------
    // Generate tokens
    // --------------------------------------------------------

    const { accessToken, refreshToken } = await generateTokens({
      userId: user.userid,
      email: user.email,
      role: user.role,
    });

    // --------------------------------------------------------
    // Mark verification code as used
    // --------------------------------------------------------

    await prisma.verificationCode.update({
      where: {
        verificationcodeid: record.verificationcodeid,
      },
      data: {
        isUsed: true,
      },
    });

    // --------------------------------------------------------
    // Mark email as verified
    // --------------------------------------------------------

    await prisma.user.update({
      where: {
        userid: user.userid,
      },
      data: {
        emailVerified: true,
        lastLoginAt: new Date(),
      },
    });

    // --------------------------------------------------------
    // Response
    // --------------------------------------------------------

    res.status(200).json({
      message: 'Verification successful',
      isSuccess: true,

      user: {
        userId: user.userid,
        name: user.fullName,
        email: user.email,
        phone: user.phone,
        image: user.picture,
        role: user.role,
        emailVerified: true,
      },

      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error('Verify code error:', error);

    res.status(500).json({
      message: 'Server error',
      isSuccess: false,
    });
  }
};
