// src/controllers/UserController.ts

import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { generateTokens } from "../helpers/GenerateToken"; 
import { CustomUserRequest } from "../helpers/middleware/VerifyToken";
import { createAuditLog } from "../services/audit.service";
import {
  ensureUserProfileWithHealthId,
  generateUniqueHealthId,
} from "../services/healthId.service";

/* ==================================================================
   SHARED SELECTS
================================================================== */

/** Safe fields for the authenticated user's own profile. */
const SELF_PROFILE_SELECT = {
  userid: true,
  email: true,
  phone: true,
  fullName: true,
  gender: true,
  dateOfBirth: true,
  avatarUrl: true,
  picture: true,
  role: true,
  emailVerified: true,
  phoneVerified: true,
  twoFactorEnabled: true,
  language: true,
  timezone: true,
  isActive: true,
  isSuspended: true,
  lastLogin: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
  profile: {
    select: {
      userprofileid: true,
      healthId: true,
      middleName: true,
      nationalId: true,
      nationality: true,
      maritalStatus: true,
      occupation: true,
      country: true,
      region: true,
      city: true,
      district: true,
      addressLine: true,
      postalCode: true,
      alternatePhone: true,
      alternateEmail: true,
      bloodType: true,
      height: true,
      weight: true,
      preferredLanguage: true,
      preferredContact: true,
    },
  },
  medicalProfile: {
    select: {
      medicalprofileid: true,
      smokingStatus: true,
      alcoholUse: true,
      exerciseFrequency: true,
      dietType: true,
      familyHistory: true,
      surgicalHistory: true,
      hospitalizationHistory: true,
      immunizationRecords: true,
      organDonor: true,
      dnrStatus: true,
      notes: true,
    },
  },
  professionalProfiles: {
    select: {
      professionalprofileid: true,
      professionalType: true,
      licenseNumber: true,
      specialization: true,
      subSpecialty: true,
      yearsOfExperience: true,
      languages: true,
      consultationFee: true,
      currency: true,
      rating: true,
      totalReviews: true,
      totalPatients: true,
      isVerified: true,
      isPubliclyVisible: true,
      publicBio: true,
      publicPhotoUrl: true,
      publicPhone: true,
      publicEmail: true,
    },
  },
} as const;

/** Minimal safe shape for login responses. */
const LOGIN_USER_SELECT = {
  userid: true,
  email: true,
  phone: true,
  fullName: true,
  role: true,
  gender: true,
  dateOfBirth: true,
  avatarUrl: true,
  picture: true,
  emailVerified: true,
  phoneVerified: true,
  language: true,
  timezone: true,
  isActive: true,
  isSuspended: true,
} as const;

/* ==================================================================
   POST /auth/register
================================================================== */
export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, fullName, name, phone, gender, dateOfBirth } =
      req.body as {
        email?: string;
        password?: string;
        fullName?: string;
        name?: string;
        phone?: string;
        gender?: "MALE" | "FEMALE" | "OTHER";
        dateOfBirth?: string;
      };

    // Accept either `fullName` or `name`
    const displayName = fullName ?? name;

    // Only these three are required
    if (!email || !password || !displayName) {
      res.status(400).json({
        isSuccess: false,
        message: "Email, password, and name (or fullName) are required",
      });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({
        isSuccess: false,
        message: "Password must be at least 6 characters",
      });
      return;
    }

    // Check email uniqueness
    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      res.status(400).json({
        isSuccess: false,
        message: "Email is already in use",
      });
      return;
    }

    // Only check phone if provided
    if (phone) {
      const existingPhone = await prisma.user.findUnique({ where: { phone } });
      if (existingPhone) {
        res.status(400).json({
          isSuccess: false,
          message: "Phone number is already in use",
        });
        return;
      }
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const healthId = await generateUniqueHealthId();

    // Never trust client role — professionals must apply and be approved
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        fullName: displayName,
        phone: phone ?? null,
        gender: gender ?? null,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        role: Role.USER,
        profile: {
          create: { healthId },
        },
        medicalProfile: {
          create: {},
        },
      },
      select: {
        userid: true,
        email: true,
        phone: true,
        fullName: true,
        role: true,
        createdAt: true,
        profile: { select: { healthId: true } },
      },
    });

    await createAuditLog({
      userId: user.userid,
      action: "USER_REGISTERED",
      entity: "User",
      entityId: user.userid,
      metadata: { healthId, email: user.email },
    });

    await createAuditLog({
      userId: user.userid,
      action: "PATIENT_ID_CREATED",
      entity: "UserProfile",
      entityId: user.userid,
      metadata: { healthId },
    });

    const { accessToken, refreshToken } = await generateTokens({
      userId: user.userid,
      email: user.email,
      role: user.role,
    });

    res.status(201).json({
      isSuccess: true,
      message: "User registered successfully",
      result: {
        user: {
          ...user,
          healthId: user.profile?.healthId ?? healthId,
        },
        healthId: user.profile?.healthId ?? healthId,
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({
      isSuccess: false,
      message: "Failed to register user",
    });
  }
};
/* ==================================================================
   POST /auth/login
================================================================== */
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body as {
      email?: string;
      password?: string;
    };

    if (!email || !password) {
      res.status(400).json({
        isSuccess: false,
        message: "Email and password are required",
      });
      return;
    }

    const user = await prisma.user.findFirst({
      where: { email, isDeleted: false },
      select: { ...LOGIN_USER_SELECT, passwordHash: true },
    });

    if (!user || !user.passwordHash) {
      res.status(401).json({
        isSuccess: false,
        message: "Invalid email or password",
      });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({
        isSuccess: false,
        message: "Account is deactivated",
      });
      return;
    }

    if (user.isSuspended) {
      res.status(403).json({
        isSuccess: false,
        message: "Account is suspended",
      });
      return;
    }

    const passwordOk = await bcrypt.compare(password, user.passwordHash);
    if (!passwordOk) {
      res.status(401).json({
        isSuccess: false,
        message: "Invalid email or password",
      });
      return;
    }

    const { accessToken, refreshToken } = await generateTokens({
      userId: user.userid,
      email: user.email,
      role: user.role,
    });

    await prisma.user.update({
      where: { userid: user.userid },
      data: { lastLogin: new Date(), lastLoginAt: new Date() },
    });

    const { passwordHash: _pw, ...safeUser } = user;

    res.status(200).json({
      isSuccess: true,
      message: "Login successful",
      result: { user: safeUser, accessToken, refreshToken },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      isSuccess: false,
      message: "Something went wrong. Please try again.",
    });
  }
};

/* ==================================================================
   GET /profile/:userid   (public)
================================================================== */
export const getUserProfile = async (req: CustomUserRequest, res: any) => {
  try {
    const tokenUserId = (req.user as { userId?: string } | undefined)?.userId;
    const tokenRole = (req.user as { role?: Role } | undefined)?.role;
    const param = String(req.params.userid ?? "");
    const userid = param === "me" ? tokenUserId : param;

    if (!userid) {
      res.status(401).json({
        isSuccess: false,
        message: "Access Denied. No Token Provided.",
      });
      return;
    }

    const isOwner = tokenUserId === userid;

    if (!isOwner) {
      const { canAccessPatientData } = await import(
        "../services/healthcareAccess.service"
      );
      const access = await canAccessPatientData({
        actorUserId: tokenUserId || "",
        actorRole: tokenRole || Role.USER,
        patientUserId: userid,
        requireConsent: true,
      });
      if (!access.ok) {
        res.status(access.status).json({
          isSuccess: false,
          message: access.message,
        });
        return;
      }
    }

    // Every account gets a permanent Patient/Health ID (owner path creates if missing)
    if (isOwner) {
      await ensureUserProfileWithHealthId(userid).catch(() => undefined);
    }

    const user = await prisma.user.findFirst({
      where: { userid, isDeleted: false },
      select: {
        // ─── Core user ───────────────────────────────
        userid: true,
        email: true,
        phone: true,
        fullName: true,
        gender: true,
        dateOfBirth: true,
        avatarUrl: true,
        picture: true,
        role: true,
        googleId: true,
        lastLogin: true,
        lastLoginAt: true,

        emailVerified: true,
        phoneVerified: true,
        twoFactorEnabled: true,

        language: true,
        timezone: true,

        isActive: true,
        isSuspended: true,
        isDeleted: true,
        deletedAt: true,
        createdAt: true,
        updatedAt: true,

        // ─── Profile ─────────────────────────────────
        profile: {
          select: {
            userprofileid: true,
            healthId: true,
            middleName: true,
            nationalId: true,
            nationality: true,
            maritalStatus: true,
            occupation: true,
            country: true,
            region: true,
            city: true,
            district: true,
            addressLine: true,
            postalCode: true,
            alternatePhone: true,
            alternateEmail: true,
            bloodType: true,
            height: true,
            weight: true,
            preferredLanguage: true,
            preferredContact: true,
            createdAt: true,
            updatedAt: true,
          },
        },

        // ─── Medical profile ─────────────────────────
        medicalProfile: true,

        // ─── Professional profiles ───────────────────
        professionalProfiles: {
          where: { isActive: true, deletedAt: null },
          select: {
            professionalprofileid: true,
            professionalType: true,
            licenseNumber: true,
            licenseExpiry: true,
            certifications: true,
            specialization: true,
            subSpecialty: true,
            qualifications: true,
            isPubliclyVisible: true,
            publicBio: true,
            publicPhotoUrl: true,
            publicCoverUrl: true,
            yearsOfExperience: true,
            languages: true,
            consultationFee: true,
            currency: true,
            rating: true,
            totalReviews: true,
            totalPatients: true,
            publicPhone: true,
            publicEmail: true,
            website: true,
            linkedin: true,
            twitter: true,
            facebook: true,
            isVerified: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
          },
        },

        // ─── Emergency contacts ──────────────────────
        emergencyContacts: {
          orderBy: [{ isPrimary: "desc" }, { priority: "asc" }],
        },

        // ─── Allergies ───────────────────────────────
        allergies: {
          where: { isActive: true },
          orderBy: { createdAt: "desc" },
        },

        // ─── Chronic conditions ──────────────────────
        chronicConditions: {
          where: { isActive: true },
          orderBy: { createdAt: "desc" },
        },

        // ─── Current medications ─────────────────────
        medications: {
          where: { isActive: true },
          orderBy: { startedAt: "desc" },
        },

        // ─── Latest vitals ───────────────────────────
        vitalSigns: {
          orderBy: { recordedAt: "desc" },
          take: 10,
        },

        // ─── Recent daily logs ───────────────────────
        dailyHealthLogs: {
          orderBy: { date: "desc" },
          take: 7,
        },

        // ─── Upcoming appointments ───────────────────
        appointments: {
          where: {
            status: { in: ["SCHEDULED", "CONFIRMED", "CHECKED_IN"] },
          },
          orderBy: { scheduledAt: "asc" },
          take: 5,
        },

        // ─── Recent prescriptions ────────────────────
        prescriptions: {
          orderBy: { issuedAt: "desc" },
          take: 5,
        },

        // ─── Recent lab orders / results ─────────────
        labOrders: {
          orderBy: { orderedAt: "desc" },
          take: 5,
          include: {
            result: true,
          },
        },

        // ─── Wallet ──────────────────────────────────
        wallets: {
          where: { isActive: true },
          select: {
            walletid: true,
            balance: true,
            currency: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
          },
        },

        // ─── Counts (lightweight summary) ────────────
        _count: {
          select: {
            appointments: true,
            prescriptions: true,
            labOrders: true,
            labResults: true,
            documents: true,
            notifications: true,
            healthRecords: true,
            vitalSigns: true,
            consentsGranted: true,
          },
        },

        // ─── Private only for owner ──────────────────
        ...(isOwner
          ? {
              sessions: {
                where: { revokedAt: null },
                orderBy: { createdAt: "desc" },
                take: 5,
                select: {
                  sessionid: true,
                  userAgent: true,
                  ipAddress: true,
                  deviceInfo: true,
                  expiresAt: true,
                  createdAt: true,
                },
              },
            }
          : {}),
      },
    });

    if (!user) {
      res.status(404).json({ isSuccess: false, message: "User not found" });
      return;
    }

    res.status(200).json({ isSuccess: true, user });
  } catch (error) {
    console.error("getUserProfile error:", error);
    res.status(500).json({
      isSuccess: false,
      message: "Failed to load profile",
    });
  }
};

/** Immediate self-service roles (no admin approval). */
const SELF_ROLES = new Set(["USER", "PATIENT"]);
/** Clinical roles — create a ProfessionalApplication; Super Admin must approve. */
const APPLY_ROLES = new Set([
  "DOCTOR",
  "NURSE",
  "MIDWIFE",
  "LAB_TECH",
  "PHARMACIST",
  "RECEPTIONIST",
]);
const GENDERS = new Set(["MALE", "FEMALE", "OTHER"]);
const BLOOD_TYPES = new Set([
  "A_POSITIVE", "A_NEGATIVE", "B_POSITIVE", "B_NEGATIVE",
  "AB_POSITIVE", "AB_NEGATIVE", "O_POSITIVE", "O_NEGATIVE", "UNKNOWN",
]);

function ownerFromRequest(req: Request) {
  const tokenUserId = (req.user as { userId?: string } | undefined)?.userId;
  const param = String(req.params.userid ?? "");
  const userid = param === "me" ? tokenUserId : param;
  if (!tokenUserId || !userid) {
    return { ok: false as const, status: 401, message: "Access Denied. No Token Provided." };
  }
  if (tokenUserId !== userid) {
    return { ok: false as const, status: 403, message: "You can only change your own account" };
  }
  return { ok: true as const, userid };
}

/* ==================================================================
   PUT /profile/:userid
================================================================== */
export const updateUserProfile = async (req: Request, res: Response) => {
  try {
    const owner = ownerFromRequest(req);
    if (!owner.ok) {
      res.status(owner.status).json({ isSuccess: false, message: owner.message });
      return;
    }

    const body = req.body as {
      fullName?: string;
      email?: string;
      phone?: string | null;
      avatarUrl?: string | null;
      picture?: string | null;
      gender?: string | null;
      dateOfBirth?: string | null;
      language?: string;
      timezone?: string;
      profile?: {
        nationality?: string | null;
        country?: string | null;
        region?: string | null;
        city?: string | null;
        district?: string | null;
        addressLine?: string | null;
        occupation?: string | null;
        maritalStatus?: string | null;
        bloodType?: string;
        height?: number | null;
        weight?: number | null;
        alternatePhone?: string | null;
        preferredLanguage?: string;
        preferredContact?: string;
      };
    };

    if (body.email) {
      const taken = await prisma.user.findFirst({
        where: { email: body.email, NOT: { userid: owner.userid } },
      });
      if (taken) {
        res.status(400).json({ isSuccess: false, message: "Email is already in use" });
        return;
      }
    }

    if (body.phone) {
      const taken = await prisma.user.findFirst({
        where: { phone: body.phone, NOT: { userid: owner.userid } },
      });
      if (taken) {
        res.status(400).json({ isSuccess: false, message: "Phone number is already in use" });
        return;
      }
    }

    if (body.gender && !GENDERS.has(body.gender)) {
      res.status(400).json({ isSuccess: false, message: "Invalid gender" });
      return;
    }

    const profile = body.profile;
    if (profile?.bloodType && !BLOOD_TYPES.has(profile.bloodType)) {
      res.status(400).json({ isSuccess: false, message: "Invalid blood type" });
      return;
    }

    const user = await prisma.user.update({
      where: { userid: owner.userid },
      data: {
        ...(body.fullName !== undefined ? { fullName: body.fullName } : {}),
        ...(body.email !== undefined ? { email: body.email } : {}),
        ...(body.phone !== undefined ? { phone: body.phone || null } : {}),
        ...(body.avatarUrl !== undefined ? { avatarUrl: body.avatarUrl || null } : {}),
        ...(body.picture !== undefined ? { picture: body.picture || null } : {}),
        ...(body.gender !== undefined
          ? { gender: (body.gender || null) as "MALE" | "FEMALE" | "OTHER" | null }
          : {}),
        ...(body.dateOfBirth !== undefined
          ? { dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : null }
          : {}),
        ...(body.language !== undefined ? { language: body.language } : {}),
        ...(body.timezone !== undefined ? { timezone: body.timezone } : {}),
        ...(profile
          ? {
              profile: {
                upsert: {
                  create: {
                    nationality: profile.nationality ?? undefined,
                    country: profile.country ?? undefined,
                    region: profile.region ?? undefined,
                    city: profile.city ?? undefined,
                    district: profile.district ?? undefined,
                    addressLine: profile.addressLine ?? undefined,
                    occupation: profile.occupation ?? undefined,
                    maritalStatus: profile.maritalStatus ?? undefined,
                    bloodType: (profile.bloodType as never) ?? undefined,
                    height: profile.height ?? undefined,
                    weight: profile.weight ?? undefined,
                    alternatePhone: profile.alternatePhone ?? undefined,
                    preferredLanguage: profile.preferredLanguage ?? undefined,
                    preferredContact: profile.preferredContact ?? undefined,
                  },
                  update: {
                    ...(profile.nationality !== undefined ? { nationality: profile.nationality } : {}),
                    ...(profile.country !== undefined ? { country: profile.country } : {}),
                    ...(profile.region !== undefined ? { region: profile.region } : {}),
                    ...(profile.city !== undefined ? { city: profile.city } : {}),
                    ...(profile.district !== undefined ? { district: profile.district } : {}),
                    ...(profile.addressLine !== undefined ? { addressLine: profile.addressLine } : {}),
                    ...(profile.occupation !== undefined ? { occupation: profile.occupation } : {}),
                    ...(profile.maritalStatus !== undefined ? { maritalStatus: profile.maritalStatus } : {}),
                    ...(profile.bloodType !== undefined
                      ? { bloodType: profile.bloodType as never }
                      : {}),
                    ...(profile.height !== undefined ? { height: profile.height } : {}),
                    ...(profile.weight !== undefined ? { weight: profile.weight } : {}),
                    ...(profile.alternatePhone !== undefined
                      ? { alternatePhone: profile.alternatePhone }
                      : {}),
                    ...(profile.preferredLanguage !== undefined
                      ? { preferredLanguage: profile.preferredLanguage }
                      : {}),
                    ...(profile.preferredContact !== undefined
                      ? { preferredContact: profile.preferredContact }
                      : {}),
                  },
                },
              },
            }
          : {}),
      },
      select: {
        userid: true,
        email: true,
        phone: true,
        fullName: true,
        role: true,
        gender: true,
        dateOfBirth: true,
        avatarUrl: true,
        picture: true,
        emailVerified: true,
        phoneVerified: true,
        language: true,
        timezone: true,
      },
    });

    const { accessToken, refreshToken } = await generateTokens({
      userId: user.userid,
      email: user.email,
      role: user.role,
    });

    res.status(200).json({
      isSuccess: true,
      message: "Profile updated",
      user,
      result: { accessToken, refreshToken },
    });
  } catch (error) {
    console.error("updateUserProfile error:", error);
    res.status(500).json({ isSuccess: false, message: "Failed to update profile" });
  }
};

/* ==================================================================
   PUT /profile/:userid/password
================================================================== */
export const changePassword = async (req: Request, res: Response) => {
  try {
    const owner = ownerFromRequest(req);
    if (!owner.ok) {
      res.status(owner.status).json({ isSuccess: false, message: owner.message });
      return;
    }

    const { currentPassword, newPassword } = req.body as {
      currentPassword?: string;
      newPassword?: string;
    };

    if (!currentPassword || !newPassword) {
      res.status(400).json({
        isSuccess: false,
        message: "Current password and new password are required",
      });
      return;
    }
    if (newPassword.length < 6) {
      res.status(400).json({
        isSuccess: false,
        message: "New password must be at least 6 characters",
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { userid: owner.userid },
      select: { passwordHash: true },
    });
    if (!user?.passwordHash) {
      res.status(400).json({ isSuccess: false, message: "Password login is not set" });
      return;
    }

    const matches = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!matches) {
      res.status(400).json({ isSuccess: false, message: "Current password is incorrect" });
      return;
    }

    await prisma.user.update({
      where: { userid: owner.userid },
      data: { passwordHash: await bcrypt.hash(newPassword, 12) },
    });

    res.status(200).json({ isSuccess: true, message: "Password changed" });
  } catch (error) {
    console.error("changePassword error:", error);
    res.status(500).json({ isSuccess: false, message: "Failed to change password" });
  }
};

/* ==================================================================
   PATCH /profile/:userid/role
================================================================== */
export const changeRole = async (req: Request, res: Response) => {
  try {
    const owner = ownerFromRequest(req);
    if (!owner.ok) {
      res.status(owner.status).json({ isSuccess: false, message: owner.message });
      return;
    }

    const { role, reason } = req.body as { role?: string; reason?: string };
    const reasonText = typeof reason === "string" ? reason.trim() : "";

    if (!role || (!SELF_ROLES.has(role) && !APPLY_ROLES.has(role))) {
      res.status(400).json({
        isSuccess: false,
        message: "Choose a valid role",
      });
      return;
    }

    const existing = await prisma.user.findUnique({
      where: { userid: owner.userid },
      select: {
        role: true,
        isActive: true,
        isSuspended: true,
        email: true,
        fullName: true,
        phone: true,
        avatarUrl: true,
        picture: true,
        emailVerified: true,
        phoneVerified: true,
      },
    });

    if (!existing?.isActive || existing.isSuspended) {
      res.status(403).json({ isSuccess: false, message: "Account is not active" });
      return;
    }

    if (existing.role === Role.SUPER_ADMIN || existing.role === Role.ADMIN) {
      res.status(403).json({
        isSuccess: false,
        message: "Admin roles can only be changed by Super Admin",
      });
      return;
    }

    // Clinical / staff roles → application queue (never self-grant)
    if (APPLY_ROLES.has(role)) {
      if (reasonText.length < 10) {
        res.status(400).json({
          isSuccess: false,
          message: "Please explain why you need this role (at least 10 characters)",
        });
        return;
      }

      const open = await prisma.professionalApplication.findFirst({
        where: {
          userId: owner.userid,
          requestedRole: role as Role,
          status: {
            in: ["PENDING", "UNDER_REVIEW", "MORE_INFORMATION_REQUIRED"],
          },
        },
      });
      if (open) {
        res.status(409).json({
          isSuccess: false,
          message: "You already have an open application for this role",
          result: { application: open, applicationPending: true },
        });
        return;
      }

      const application = await prisma.professionalApplication.create({
        data: {
          userId: owner.userid,
          requestedRole: role as Role,
          notes: reasonText,
          status: "PENDING",
        },
      });

      await prisma.notification.create({
        data: {
          userId: owner.userid,
          title: "Role application submitted",
          body: `Your request to become ${role.replace(/_/g, " ")} is pending Super Admin review.`,
          type: "PROFESSIONAL_APPLICATION",
          channel: "IN_APP",
          metadata: {
            applicationId: application.professionalapplicationid,
            reason: reasonText,
          },
        },
      });

      await createAuditLog({
        userId: owner.userid,
        action: "ROLE_APPLICATION_SUBMIT",
        entity: "ProfessionalApplication",
        entityId: application.professionalapplicationid,
        metadata: { requestedRole: role, reason: reasonText },
      });

      res.status(200).json({
        isSuccess: true,
        message:
          "Application submitted. Your current role stays the same until Super Admin approves.",
        user: {
          userid: owner.userid,
          email: existing.email,
          fullName: existing.fullName,
          role: existing.role,
          phone: existing.phone,
          avatarUrl: existing.avatarUrl,
          picture: existing.picture,
          emailVerified: existing.emailVerified,
          phoneVerified: existing.phoneVerified,
        },
        result: { applicationPending: true, application },
      });
      return;
    }

    // USER / PATIENT — immediate switch (still block if currently clinical without admin)
    if (
      existing.role === Role.DOCTOR ||
      existing.role === Role.NURSE ||
      existing.role === Role.MIDWIFE ||
      existing.role === Role.LAB_TECH ||
      existing.role === Role.PHARMACIST ||
      existing.role === Role.RECEPTIONIST
    ) {
      res.status(403).json({
        isSuccess: false,
        message:
          "Professional roles can only be changed by Super Admin. Contact support if you need to switch.",
      });
      return;
    }

    const user = await prisma.user.update({
      where: { userid: owner.userid },
      data: { role: role as Role },
      select: {
        userid: true,
        email: true,
        fullName: true,
        role: true,
        phone: true,
        avatarUrl: true,
        picture: true,
        emailVerified: true,
        phoneVerified: true,
      },
    });

    await createAuditLog({
      userId: owner.userid,
      action: "ROLE_SELF_CHANGE",
      entity: "User",
      entityId: owner.userid,
      metadata: {
        from: existing.role,
        to: role,
        reason: reasonText || null,
      },
    });

    const { accessToken, refreshToken } = await generateTokens({
      userId: user.userid,
      email: user.email,
      role: user.role,
    });

    res.status(200).json({
      isSuccess: true,
      message: "Role updated",
      user,
      result: { accessToken, refreshToken, applicationPending: false },
    });
  } catch (error) {
    console.error("changeRole error:", error);
    res.status(500).json({ isSuccess: false, message: "Failed to change role" });
  }
};

/* ==================================================================
   GET /doctors  (public care-team directory)
================================================================== */
const PUBLIC_CLINICAL: Role[] = [
  Role.DOCTOR,
  Role.NURSE,
  Role.MIDWIFE,
  Role.LAB_TECH,
  Role.PHARMACIST,
];

function mapPublicProfessional(item: {
  professionalprofileid: string;
  slug: string | null;
  professionalType: Role;
  specialization: string | null;
  subSpecialty: string | null;
  yearsOfExperience: number | null;
  consultationFee: unknown;
  currency: string;
  rating: number;
  totalReviews: number;
  totalPatients: number;
  publicBio: string | null;
  publicPhotoUrl: string | null;
  languages: string[];
  workplace: string | null;
  facilityName: string | null;
  isVerified: boolean;
  user: {
    userid: string;
    fullName: string;
    picture: string | null;
    avatarUrl: string | null;
    profile: {
      healthId: string | null;
      city: string | null;
      region: string | null;
      country: string | null;
    } | null;
  };
}) {
  return {
    id: item.professionalprofileid,
    professionalProfileId: item.professionalprofileid,
    slug: item.slug || item.professionalprofileid,
    userId: item.user.userid,
    name: item.user.fullName,
    professionalType: item.professionalType,
    specialty: item.specialization || item.professionalType,
    specialization: item.specialization || item.professionalType,
    subSpecialty: item.subSpecialty,
    experienceYears: item.yearsOfExperience ?? 0,
    yearsOfExperience: item.yearsOfExperience ?? 0,
    fee: item.consultationFee != null ? Number(item.consultationFee) : 15,
    currency: item.currency || "USD",
    rating: item.rating ?? 0,
    reviews: item.totalReviews ?? 0,
    totalPatients: item.totalPatients ?? 0,
    bio: item.publicBio || "Trusted clinician on Daryeel Health.",
    image: item.publicPhotoUrl || item.user.avatarUrl || item.user.picture,
    languages: item.languages ?? [],
    workplace: item.workplace || item.facilityName,
    facilityName: item.facilityName,
    city: item.user.profile?.city || item.user.profile?.region || "Somaliland",
    country: item.user.profile?.country || "Somaliland",
    verified: item.isVerified,
    isVerified: item.isVerified,
    availableToday: true,
    // Patient ID of the professional (their own health identity) — not medical records
    healthId: item.user.profile?.healthId ?? null,
  };
}

const PROFESSIONAL_PUBLIC_SELECT = {
  professionalprofileid: true,
  slug: true,
  professionalType: true,
  specialization: true,
  subSpecialty: true,
  yearsOfExperience: true,
  consultationFee: true,
  currency: true,
  rating: true,
  totalReviews: true,
  totalPatients: true,
  publicBio: true,
  publicPhotoUrl: true,
  languages: true,
  workplace: true,
  facilityName: true,
  isVerified: true,
  user: {
    select: {
      userid: true,
      fullName: true,
      picture: true,
      avatarUrl: true,
      profile: {
        select: {
          healthId: true,
          city: true,
          region: true,
          country: true,
        },
      },
    },
  },
} as const;

/** GET /user/doctors — public directory from local ProfessionalProfile (DB) */
export const listPublicDoctors = async (req: Request, res: Response) => {
  try {
    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
    const type =
      typeof req.query.type === "string"
        ? req.query.type.toUpperCase()
        : typeof req.query.professionalType === "string"
          ? req.query.professionalType.toUpperCase()
          : "";
    const specialty =
      typeof req.query.specialty === "string" ? req.query.specialty.trim() : "";
    const city = typeof req.query.city === "string" ? req.query.city.trim() : "";
    const verifiedOnly =
      req.query.verified === "1" ||
      req.query.verified === "true" ||
      req.query.verified === "yes";
    const limit = Math.min(Number(req.query.limit) || 40, 100);

    const typeFilter =
      type && PUBLIC_CLINICAL.includes(type as Role)
        ? [type as Role]
        : PUBLIC_CLINICAL;

    const doctors = await prisma.professionalProfile.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        isPubliclyVisible: true,
        professionalType: { in: typeFilter },
        ...(verifiedOnly ? { isVerified: true } : {}),
        ...(specialty
          ? {
              OR: [
                { specialization: { contains: specialty, mode: "insensitive" } },
                { subSpecialty: { contains: specialty, mode: "insensitive" } },
              ],
            }
          : {}),
        ...(city
          ? {
              user: {
                profile: {
                  OR: [
                    { city: { contains: city, mode: "insensitive" } },
                    { region: { contains: city, mode: "insensitive" } },
                  ],
                },
              },
            }
          : {}),
        ...(q
          ? {
              OR: [
                { specialization: { contains: q, mode: "insensitive" } },
                { subSpecialty: { contains: q, mode: "insensitive" } },
                { facilityName: { contains: q, mode: "insensitive" } },
                { workplace: { contains: q, mode: "insensitive" } },
                { user: { fullName: { contains: q, mode: "insensitive" } } },
              ],
            }
          : {}),
      },
      orderBy: [{ isVerified: "desc" }, { rating: "desc" }, { totalReviews: "desc" }],
      take: limit,
      select: PROFESSIONAL_PUBLIC_SELECT,
    });

    res.status(200).json({
      isSuccess: true,
      result: doctors.map(mapPublicProfessional),
    });
  } catch (error) {
    console.error("listPublicDoctors error:", error);
    res.status(500).json({
      isSuccess: false,
      message: "Failed to load doctors",
    });
  }
};

/** GET /user/doctors/:idOrSlug — public professional detail from DB */
export const getPublicDoctor = async (req: Request, res: Response) => {
  try {
    const idOrSlug = String(req.params.idOrSlug || "").trim();
    if (!idOrSlug) {
      res.status(400).json({ isSuccess: false, message: "Professional id required" });
      return;
    }

    // Exact id/slug lookup first (so directory cards never 404 after listing)
    let item = await prisma.professionalProfile.findFirst({
      where: {
        deletedAt: null,
        OR: [
          { professionalprofileid: idOrSlug },
          { slug: idOrSlug },
          { userId: idOrSlug },
        ],
      },
      select: {
        ...PROFESSIONAL_PUBLIC_SELECT,
        isActive: true,
        isPubliclyVisible: true,
        deletedAt: true,
        publicCoverUrl: true,
        publicPhone: true,
        publicEmail: true,
        website: true,
        linkedin: true,
        twitter: true,
        facebook: true,
        qualifications: true,
        certifications: true,
        licenseNumber: true,
      },
    });

    // Directory-safe fallback: only expose active public profiles
    if (!item) {
      item = await prisma.professionalProfile.findFirst({
        where: {
          isActive: true,
          deletedAt: null,
          isPubliclyVisible: true,
          OR: [
            { professionalprofileid: idOrSlug },
            { slug: idOrSlug },
          ],
        },
        select: {
          ...PROFESSIONAL_PUBLIC_SELECT,
          isActive: true,
          isPubliclyVisible: true,
          deletedAt: true,
          publicCoverUrl: true,
          publicPhone: true,
          publicEmail: true,
          website: true,
          linkedin: true,
          twitter: true,
          facebook: true,
          qualifications: true,
          certifications: true,
          licenseNumber: true,
        },
      });
    }

    if (!item || item.deletedAt) {
      res.status(404).json({ isSuccess: false, message: "Professional not found" });
      return;
    }

    const availability = await prisma.professionalAvailability.findMany({
      where: {
        professionalUserId: item.user.userid,
        isAvailable: true,
      },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    });

    res.status(200).json({
      isSuccess: true,
      result: {
        ...mapPublicProfessional(item),
        coverImage: item.publicCoverUrl,
        publicPhone: item.publicPhone,
        publicEmail: item.publicEmail,
        website: item.website,
        linkedin: item.linkedin,
        twitter: item.twitter,
        facebook: item.facebook,
        qualifications: item.qualifications,
        certifications: item.certifications,
        // License shown only as presence for verified badge context — not full number publicly if preferred
        hasLicense: Boolean(item.licenseNumber),
        availability,
      },
    });
  } catch (error) {
    console.error("getPublicDoctor error:", error);
    res.status(500).json({
      isSuccess: false,
      message: "Failed to load professional",
    });
  }
};

/** GET /user/me/patient-id */
export const getMyPatientId = async (req: Request, res: Response) => {
  try {
    const userId =
      (req as CustomUserRequest).user?.userId ||
      (req as any).user?.userid ||
      null;
    if (!userId) {
      res.status(401).json({ isSuccess: false, message: "Sign in required" });
      return;
    }
    const { healthId } = await ensureUserProfileWithHealthId(userId);
    res.status(200).json({
      isSuccess: true,
      result: { healthId, patientId: healthId },
    });
  } catch (error) {
    console.error("getMyPatientId error:", error);
    res.status(500).json({
      isSuccess: false,
      message: "Failed to load patient id",
    });
  }
};