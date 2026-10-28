import { Request, Response } from "express";
import { Role } from "@prisma/client";
import { prisma } from "../lib/prisma";

const CLINICAL: Role[] = [
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

function parseSlot(body: any) {
  const dayOfWeek = Number(body?.dayOfWeek);
  const startTime = String(body?.startTime || "").trim();
  const endTime = String(body?.endTime || "").trim();
  const isAvailable = body?.isAvailable !== false;

  if (!Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
    return { error: "dayOfWeek must be 0–6 (Sunday–Saturday)" };
  }
  if (!/^\d{2}:\d{2}$/.test(startTime) || !/^\d{2}:\d{2}$/.test(endTime)) {
    return { error: "startTime and endTime must be HH:MM" };
  }
  if (startTime >= endTime) {
    return { error: "endTime must be after startTime" };
  }
  return { dayOfWeek, startTime, endTime, isAvailable };
}

/** GET /professional/availability — own slots */
export const listMyAvailability = async (req: Request, res: Response) => {
  try {
    const { userId, role } = actor(req);
    if (!userId) {
      res.status(401).json({ isSuccess: false, message: "Sign in required" });
      return;
    }
    if (!role || !CLINICAL.includes(role)) {
      res.status(403).json({
        isSuccess: false,
        message: "Only professionals manage availability",
      });
      return;
    }

    const rows = await prisma.professionalAvailability.findMany({
      where: { professionalUserId: userId },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    });
    res.status(200).json({ isSuccess: true, result: rows });
  } catch (error) {
    console.error("listMyAvailability error:", error);
    res.status(500).json({
      isSuccess: false,
      message: "Failed to load availability",
    });
  }
};

/** POST /professional/availability */
export const createAvailability = async (req: Request, res: Response) => {
  try {
    const { userId, role } = actor(req);
    if (!userId) {
      res.status(401).json({ isSuccess: false, message: "Sign in required" });
      return;
    }
    if (!role || !CLINICAL.includes(role)) {
      res.status(403).json({
        isSuccess: false,
        message: "Only professionals manage availability",
      });
      return;
    }

    const parsed = parseSlot(req.body);
    if ("error" in parsed && parsed.error) {
      res.status(400).json({ isSuccess: false, message: parsed.error });
      return;
    }

    const { dayOfWeek, startTime, endTime, isAvailable } = parsed as {
      dayOfWeek: number;
      startTime: string;
      endTime: string;
      isAvailable: boolean;
    };

    const row = await prisma.professionalAvailability.create({
      data: {
        professionalUserId: userId,
        dayOfWeek,
        startTime,
        endTime,
        isAvailable,
      },
    });

    res.status(201).json({ isSuccess: true, result: row });
  } catch (error) {
    console.error("createAvailability error:", error);
    res.status(500).json({
      isSuccess: false,
      message: "Failed to create availability",
    });
  }
};

/** PATCH /professional/availability/:id */
export const updateAvailability = async (req: Request, res: Response) => {
  try {
    const { userId } = actor(req);
    if (!userId) {
      res.status(401).json({ isSuccess: false, message: "Sign in required" });
      return;
    }

    const id = String(req.params.id || "");
    const existing = await prisma.professionalAvailability.findUnique({
      where: { id },
    });
    if (!existing || existing.professionalUserId !== userId) {
      res.status(404).json({ isSuccess: false, message: "Slot not found" });
      return;
    }

    const data: Record<string, unknown> = {};
    if (req.body?.dayOfWeek !== undefined) {
      const d = Number(req.body.dayOfWeek);
      if (!Number.isInteger(d) || d < 0 || d > 6) {
        res.status(400).json({ isSuccess: false, message: "Invalid dayOfWeek" });
        return;
      }
      data.dayOfWeek = d;
    }
    if (req.body?.startTime !== undefined) data.startTime = String(req.body.startTime);
    if (req.body?.endTime !== undefined) data.endTime = String(req.body.endTime);
    if (req.body?.isAvailable !== undefined) data.isAvailable = Boolean(req.body.isAvailable);

    const row = await prisma.professionalAvailability.update({
      where: { id },
      data,
    });
    res.status(200).json({ isSuccess: true, result: row });
  } catch (error) {
    console.error("updateAvailability error:", error);
    res.status(500).json({
      isSuccess: false,
      message: "Failed to update availability",
    });
  }
};

/** DELETE /professional/availability/:id */
export const deleteAvailability = async (req: Request, res: Response) => {
  try {
    const { userId } = actor(req);
    if (!userId) {
      res.status(401).json({ isSuccess: false, message: "Sign in required" });
      return;
    }

    const id = String(req.params.id || "");
    const existing = await prisma.professionalAvailability.findUnique({
      where: { id },
    });
    if (!existing || existing.professionalUserId !== userId) {
      res.status(404).json({ isSuccess: false, message: "Slot not found" });
      return;
    }

    await prisma.professionalAvailability.delete({ where: { id } });
    res.status(200).json({ isSuccess: true, message: "Deleted" });
  } catch (error) {
    console.error("deleteAvailability error:", error);
    res.status(500).json({
      isSuccess: false,
      message: "Failed to delete availability",
    });
  }
};

/** GET /professionals/:id/availability — public booking slots */
export const listPublicAvailability = async (req: Request, res: Response) => {
  try {
    const idOrSlug = String(req.params.id || "").trim();
    const profile = await prisma.professionalProfile.findFirst({
      where: {
        isActive: true,
        deletedAt: null,
        isPubliclyVisible: true,
        OR: [{ professionalprofileid: idOrSlug }, { slug: idOrSlug }],
      },
      select: { userId: true },
    });
    if (!profile) {
      res.status(404).json({ isSuccess: false, message: "Professional not found" });
      return;
    }

    const rows = await prisma.professionalAvailability.findMany({
      where: { professionalUserId: profile.userId, isAvailable: true },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    });
    res.status(200).json({ isSuccess: true, result: rows });
  } catch (error) {
    console.error("listPublicAvailability error:", error);
    res.status(500).json({
      isSuccess: false,
      message: "Failed to load availability",
    });
  }
};
