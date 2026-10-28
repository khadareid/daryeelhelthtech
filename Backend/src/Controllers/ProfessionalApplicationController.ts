import { Request, Response } from "express";
import {
  NotificationChannel,
  NotificationType,
  ProfessionalApplicationStatus,
  Role,
} from "@prisma/client";
import { prisma } from "../lib/prisma";
import { createAuditLog, getClientMeta } from "../services/audit.service";
import { isFeatureAllowed } from "../services/featureFlag.service";
import { slugifyProfessionalName } from "../services/healthId.service";

const ELIGIBLE: Role[] = [
  Role.DOCTOR,
  Role.NURSE,
  Role.MIDWIFE,
  Role.LAB_TECH,
  Role.PHARMACIST,
];

function actor(req: Request) {
  const user = (req as any).user;
  return {
    userId: (user?.userId || user?.userid || user?.id || null) as string | null,
    role: (user?.role || null) as Role | null,
  };
}

/** POST /professional-applications */
export const submitApplication = async (req: Request, res: Response) => {
  try {
    const { userId, role } = actor(req);
    if (!userId) {
      res.status(401).json({ isSuccess: false, message: "Sign in required" });
      return;
    }

    const allowed = await isFeatureAllowed({
      key: "professional_applications",
      userId,
      role,
      action: "create",
    });
    if (!allowed) {
      res.status(403).json({ isSuccess: false, message: "Applications are disabled" });
      return;
    }

    const {
      requestedRole,
      licenseNumber,
      qualifications,
      specialization,
      yearsOfExperience,
      facilityName,
      workplace,
      supportingDocs,
      notes,
    } = req.body ?? {};

    if (!requestedRole || !ELIGIBLE.includes(requestedRole)) {
      res.status(400).json({
        isSuccess: false,
        message: "Choose a valid professional role",
      });
      return;
    }

    // Never trust client to set DOCTOR on User here
    const open = await prisma.professionalApplication.findFirst({
      where: {
        userId,
        requestedRole,
        status: {
          in: [
            ProfessionalApplicationStatus.PENDING,
            ProfessionalApplicationStatus.UNDER_REVIEW,
            ProfessionalApplicationStatus.MORE_INFORMATION_REQUIRED,
          ],
        },
      },
    });
    if (open) {
      res.status(409).json({
        isSuccess: false,
        message: "You already have an open application for this role",
        result: open,
      });
      return;
    }

    const year = new Date().getFullYear();
    const seq = Date.now().toString().slice(-6);
    const applicationCode = `APP-${year}-${seq}`;

    const application = await prisma.professionalApplication.create({
      data: {
        userId,
        applicationCode,
        requestedRole,
        licenseNumber: licenseNumber ? String(licenseNumber) : null,
        qualifications: qualifications ? String(qualifications) : null,
        specialization: specialization ? String(specialization) : null,
        subSpecialty: req.body?.subSpecialty
          ? String(req.body.subSpecialty)
          : null,
        yearsOfExperience:
          Number(yearsOfExperience) > 0 ? Number(yearsOfExperience) : null,
        languages: Array.isArray(req.body?.languages)
          ? req.body.languages.map(String)
          : [],
        facilityName: facilityName ? String(facilityName) : null,
        workplace: workplace ? String(workplace) : null,
        professionalBio: req.body?.professionalBio
          ? String(req.body.professionalBio)
          : null,
        supportingDocs: supportingDocs ?? undefined,
        notes: notes ? String(notes) : null,
        status: ProfessionalApplicationStatus.PENDING,
      },
    });

    await prisma.notification.create({
      data: {
        userId,
        title: "Application submitted",
        body: `Your ${requestedRole.replace(/_/g, " ")} application is pending review.`,
        type: NotificationType.PROFESSIONAL_APPLICATION,
        channel: NotificationChannel.IN_APP,
        metadata: { applicationId: application.professionalapplicationid },
      },
    });

    await createAuditLog({
      userId,
      action: "PROFESSIONAL_APPLICATION_SUBMIT",
      entity: "ProfessionalApplication",
      entityId: application.professionalapplicationid,
      ...getClientMeta(req),
    });

    res.status(201).json({
      isSuccess: true,
      message: "Application submitted",
      result: application,
    });
  } catch (error) {
    console.error("submitApplication error:", error);
    res.status(500).json({ isSuccess: false, message: "Failed to submit application" });
  }
};

/** GET /professional-applications/mine */
export const myApplications = async (req: Request, res: Response) => {
  try {
    const { userId } = actor(req);
    if (!userId) {
      res.status(401).json({ isSuccess: false, message: "Sign in required" });
      return;
    }
    const apps = await prisma.professionalApplication.findMany({
      where: { userId },
      orderBy: { submittedAt: "desc" },
    });
    res.status(200).json({ isSuccess: true, result: apps });
  } catch (error) {
    console.error("myApplications error:", error);
    res.status(500).json({ isSuccess: false, message: "Failed to load applications" });
  }
};

/** GET /admin/professional-applications */
export const listApplications = async (req: Request, res: Response) => {
  try {
    const status = String(req.query.status || "").trim();
    const where: any = {};
    if (status) where.status = status;

    const apps = await prisma.professionalApplication.findMany({
      where,
      orderBy: { submittedAt: "asc" },
      include: {
        user: {
          select: {
            userid: true,
            fullName: true,
            email: true,
            phone: true,
            role: true,
            profile: { select: { healthId: true } },
          },
        },
      },
      take: 100,
    });
    res.status(200).json({ isSuccess: true, result: apps });
  } catch (error) {
    console.error("listApplications error:", error);
    res.status(500).json({ isSuccess: false, message: "Failed to list applications" });
  }
};

/** PATCH /admin/professional-applications/:id */
export const reviewApplication = async (req: Request, res: Response) => {
  try {
    const { userId: adminId, role } = actor(req);
    if (!adminId) {
      res.status(401).json({ isSuccess: false, message: "Unauthorized" });
      return;
    }

    const allowed = await isFeatureAllowed({
      key: "professional_applications",
      userId: adminId,
      role,
      action: "approve",
    });
    if (!allowed) {
      res.status(403).json({ isSuccess: false, message: "Not permitted" });
      return;
    }

    const id = String(req.params.id);
    const { decision, reviewNotes, rejectionReason } = req.body ?? {};
    const app = await prisma.professionalApplication.findUnique({
      where: { professionalapplicationid: id },
    });
    if (!app) {
      res.status(404).json({ isSuccess: false, message: "Application not found" });
      return;
    }

    if (app.userId === adminId) {
      res.status(403).json({
        isSuccess: false,
        message: "Applicants cannot approve themselves",
      });
      return;
    }

    const next =
      decision === "APPROVED"
        ? ProfessionalApplicationStatus.APPROVED
        : decision === "REJECTED"
          ? ProfessionalApplicationStatus.REJECTED
          : decision === "MORE_INFORMATION_REQUIRED"
            ? ProfessionalApplicationStatus.MORE_INFORMATION_REQUIRED
            : decision === "UNDER_REVIEW"
              ? ProfessionalApplicationStatus.UNDER_REVIEW
              : null;

    if (!next) {
      res.status(400).json({
        isSuccess: false,
        message: "decision must be APPROVED, REJECTED, UNDER_REVIEW, or MORE_INFORMATION_REQUIRED",
      });
      return;
    }

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.professionalApplication.update({
        where: { professionalapplicationid: id },
        data: {
          status: next,
          reviewNotes: reviewNotes ? String(reviewNotes) : null,
          rejectionReason:
            next === ProfessionalApplicationStatus.REJECTED
              ? String(rejectionReason || reviewNotes || "Rejected")
              : null,
          reviewedById: adminId,
          reviewedAt: new Date(),
          decidedAt:
            next === ProfessionalApplicationStatus.APPROVED ||
            next === ProfessionalApplicationStatus.REJECTED
              ? new Date()
              : null,
        },
      });

      if (next === ProfessionalApplicationStatus.APPROVED) {
        await tx.user.update({
          where: { userid: app.userId },
          data: { role: app.requestedRole },
        });

        const applicant = await tx.user.findUnique({
          where: { userid: app.userId },
          select: { fullName: true },
        });
        const slugBase = slugifyProfessionalName(
          applicant?.fullName || "professional",
          app.userId.slice(-4).toLowerCase()
        );

        await tx.professionalProfile.upsert({
          where: { userId: app.userId },
          create: {
            userId: app.userId,
            professionalType: app.requestedRole,
            slug: slugBase,
            licenseNumber: app.licenseNumber,
            specialization: app.specialization,
            subSpecialty: app.subSpecialty,
            yearsOfExperience: app.yearsOfExperience,
            languages: app.languages ?? [],
            workplace: app.workplace,
            facilityName: app.facilityName,
            qualifications: app.qualifications
              ? { text: app.qualifications }
              : undefined,
            isVerified: true,
            isActive: true,
            isPubliclyVisible: true,
            publicBio:
              app.professionalBio ||
              `${app.requestedRole.replace(/_/g, " ")} on Daryeel Health`,
          },
          update: {
            professionalType: app.requestedRole,
            slug: slugBase,
            licenseNumber: app.licenseNumber ?? undefined,
            specialization: app.specialization ?? undefined,
            subSpecialty: app.subSpecialty ?? undefined,
            yearsOfExperience: app.yearsOfExperience ?? undefined,
            languages: app.languages?.length ? app.languages : undefined,
            workplace: app.workplace ?? undefined,
            facilityName: app.facilityName ?? undefined,
            publicBio: app.professionalBio ?? undefined,
            isVerified: true,
            isActive: true,
            deletedAt: null,
          },
        });
      }

      const body =
        next === ProfessionalApplicationStatus.APPROVED
          ? `Your ${app.requestedRole.replace(/_/g, " ")} application was approved.`
          : next === ProfessionalApplicationStatus.REJECTED
            ? `Your application was rejected. ${rejectionReason || ""}`.trim()
            : next === ProfessionalApplicationStatus.MORE_INFORMATION_REQUIRED
              ? `More information is required for your application. ${reviewNotes || ""}`.trim()
              : "Your application is under review.";

      await tx.notification.create({
        data: {
          userId: app.userId,
          title: "Professional application update",
          body,
          type: NotificationType.PROFESSIONAL_APPLICATION,
          channel: NotificationChannel.IN_APP,
          metadata: { applicationId: id, status: next },
        },
      });

      return updated;
    });

    await createAuditLog({
      userId: adminId,
      action: `PROFESSIONAL_APPLICATION_${next}`,
      entity: "ProfessionalApplication",
      entityId: id,
      metadata: { decision: next, applicantId: app.userId },
      ...getClientMeta(req),
    });

    res.status(200).json({
      isSuccess: true,
      message: "Application updated",
      result,
    });
  } catch (error) {
    console.error("reviewApplication error:", error);
    res.status(500).json({ isSuccess: false, message: "Failed to review application" });
  }
};
