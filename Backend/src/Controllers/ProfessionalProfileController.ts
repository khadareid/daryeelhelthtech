import { Request, Response } from "express";
import { Role } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { createAuditLog, getClientMeta } from "../services/audit.service";
import { slugifyProfessionalName } from "../services/healthId.service";

function actor(req: Request) {
  const user = (req as any).user;
  return {
    userId: (user?.userId || user?.userid || user?.id || null) as string | null,
    role: (user?.role || null) as Role | null,
  };
}

/** GET /professional/profile — own professional profile */
export const getMyProfessionalProfile = async (req: Request, res: Response) => {
  try {
    const { userId } = actor(req);
    if (!userId) {
      res.status(401).json({ isSuccess: false, message: "Sign in required" });
      return;
    }

    const profile = await prisma.professionalProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            userid: true,
            fullName: true,
            email: true,
            phone: true,
            avatarUrl: true,
            picture: true,
            role: true,
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
      },
    });

    if (!profile || profile.deletedAt) {
      res.status(404).json({
        isSuccess: false,
        message: "No professional profile yet",
      });
      return;
    }

    res.status(200).json({ isSuccess: true, result: profile });
  } catch (error) {
    console.error("getMyProfessionalProfile error:", error);
    res.status(500).json({
      isSuccess: false,
      message: "Failed to load professional profile",
    });
  }
};

/** PATCH /professional/profile — owner updates public professional info */
export const updateMyProfessionalProfile = async (
  req: Request,
  res: Response
) => {
  try {
    const { userId } = actor(req);
    if (!userId) {
      res.status(401).json({ isSuccess: false, message: "Sign in required" });
      return;
    }

    const existing = await prisma.professionalProfile.findUnique({
      where: { userId },
    });
    if (!existing || existing.deletedAt) {
      res.status(404).json({
        isSuccess: false,
        message: "No professional profile to update",
      });
      return;
    }

    const body = req.body ?? {};
    const data: Record<string, unknown> = {};

    if (body.specialization !== undefined)
      data.specialization = String(body.specialization || "") || null;
    if (body.subSpecialty !== undefined)
      data.subSpecialty = String(body.subSpecialty || "") || null;
    if (body.publicBio !== undefined)
      data.publicBio = String(body.publicBio || "") || null;
    if (body.workplace !== undefined)
      data.workplace = String(body.workplace || "") || null;
    if (body.facilityName !== undefined)
      data.facilityName = String(body.facilityName || "") || null;
    if (body.publicPhone !== undefined)
      data.publicPhone = String(body.publicPhone || "") || null;
    if (body.publicEmail !== undefined)
      data.publicEmail = String(body.publicEmail || "") || null;
    if (body.website !== undefined)
      data.website = String(body.website || "") || null;
    if (body.linkedin !== undefined)
      data.linkedin = String(body.linkedin || "") || null;
    if (body.twitter !== undefined)
      data.twitter = String(body.twitter || "") || null;
    if (body.facebook !== undefined)
      data.facebook = String(body.facebook || "") || null;
    if (body.publicPhotoUrl !== undefined)
      data.publicPhotoUrl = String(body.publicPhotoUrl || "") || null;
    if (body.yearsOfExperience !== undefined) {
      const n = Number(body.yearsOfExperience);
      data.yearsOfExperience = Number.isFinite(n) && n >= 0 ? n : null;
    }
    if (body.languages !== undefined) {
      data.languages = Array.isArray(body.languages)
        ? body.languages.map(String).filter(Boolean)
        : String(body.languages || "")
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
    }
    if (body.isPubliclyVisible !== undefined) {
      data.isPubliclyVisible = Boolean(body.isPubliclyVisible);
    }
    if (body.consultationFee !== undefined) {
      const fee = Number(body.consultationFee);
      data.consultationFee = Number.isFinite(fee) ? fee : null;
    }
    if (body.slug !== undefined) {
      const raw = String(body.slug || "").trim().toLowerCase();
      data.slug = raw
        ? slugifyProfessionalName(raw.replace(/^-+|-+$/g, ""))
        : existing.slug;
    }

    // Never allow self-setting verification or role type from this endpoint
    const updated = await prisma.professionalProfile.update({
      where: { userId },
      data,
      include: {
        user: {
          select: {
            userid: true,
            fullName: true,
            profile: { select: { healthId: true, city: true } },
          },
        },
      },
    });

    await createAuditLog({
      userId,
      action: "PROFESSIONAL_PROFILE_UPDATED",
      entity: "ProfessionalProfile",
      entityId: updated.professionalprofileid,
      metadata: { fields: Object.keys(data) },
      ...getClientMeta(req),
    });

    res.status(200).json({
      isSuccess: true,
      message: "Professional profile updated",
      result: updated,
    });
  } catch (error) {
    console.error("updateMyProfessionalProfile error:", error);
    res.status(500).json({
      isSuccess: false,
      message: "Failed to update professional profile",
    });
  }
};
