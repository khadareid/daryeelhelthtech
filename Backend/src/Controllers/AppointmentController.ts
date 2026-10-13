import { Request, Response } from "express";
import { AppointmentStatus } from "@prisma/client";
import { prisma } from "../lib/prisma";

function getUserId(req: Request): string | null {
  const user = (req as any).user;
  return user?.userId || user?.userid || user?.id || null;
}

function makeAppointmentCode() {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `APT-${stamp}-${rand}`;
}

function parseScheduledAt(value: unknown): Date | null {
  if (typeof value !== "string" && !(value instanceof Date)) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** POST /appointments — any signed-in user can book */
export const createAppointment = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ isSuccess: false, message: "Sign in required" });
      return;
    }

    const {
      doctorId,
      doctorName,
      specialty,
      facilityName,
      facilityId,
      scheduledAt,
      duration,
      reason,
      notes,
      visitType,
    } = req.body ?? {};

    const when = parseScheduledAt(scheduledAt);
    if (!when) {
      res.status(400).json({
        isSuccess: false,
        message: "scheduledAt is required (ISO date)",
      });
      return;
    }

    if (when.getTime() < Date.now() - 60_000) {
      res.status(400).json({
        isSuccess: false,
        message: "Choose a future date and time",
      });
      return;
    }

    const isVideo =
      String(visitType || "").toLowerCase().includes("video") ||
      String(visitType || "").toLowerCase() === "telehealth";

    const appointment = await prisma.appointment.create({
      data: {
        userId,
        appointmentCode: makeAppointmentCode(),
        doctorId: doctorId ? String(doctorId) : null,
        doctorName: doctorName ? String(doctorName) : "Clinician",
        specialty: specialty ? String(specialty) : null,
        facilityName: facilityName ? String(facilityName) : null,
        facilityId: facilityId ? String(facilityId) : null,
        scheduledAt: when,
        duration: Number(duration) > 0 ? Number(duration) : 30,
        reason: reason ? String(reason) : null,
        notes: notes
          ? String(notes)
          : visitType
            ? `Visit type: ${visitType}`
            : null,
        meetingLink: isVideo
          ? `https://daryeel-healthtech.vercel.app/dashboard?section=appointments`
          : null,
        status: AppointmentStatus.SCHEDULED,
      },
    });

    res.status(201).json({
      isSuccess: true,
      message: "Appointment booked",
      result: appointment,
    });
  } catch (error) {
    console.error("createAppointment error:", error);
    res.status(500).json({
      isSuccess: false,
      message: "Failed to book appointment",
    });
  }
};

/** GET /appointments — list current user's bookings */
export const listMyAppointments = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ isSuccess: false, message: "Sign in required" });
      return;
    }

    const status = typeof req.query.status === "string" ? req.query.status : "";
    const where: { userId: string; status?: AppointmentStatus } = { userId };
    if (status && Object.values(AppointmentStatus).includes(status as AppointmentStatus)) {
      where.status = status as AppointmentStatus;
    }

    const appointments = await prisma.appointment.findMany({
      where,
      orderBy: { scheduledAt: "asc" },
      take: 100,
    });

    res.status(200).json({ isSuccess: true, result: appointments });
  } catch (error) {
    console.error("listMyAppointments error:", error);
    res.status(500).json({
      isSuccess: false,
      message: "Failed to load appointments",
    });
  }
};

/** PATCH /appointments/:id/cancel */
export const cancelAppointment = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ isSuccess: false, message: "Sign in required" });
      return;
    }

    const id = String(req.params.id || "");
    const existing = await prisma.appointment.findFirst({
      where: { appointmentid: id, userId },
    });

    if (!existing) {
      res.status(404).json({ isSuccess: false, message: "Appointment not found" });
      return;
    }

    if (existing.status === AppointmentStatus.CANCELLED) {
      res.status(200).json({ isSuccess: true, result: existing });
      return;
    }

    const appointment = await prisma.appointment.update({
      where: { appointmentid: id },
      data: {
        status: AppointmentStatus.CANCELLED,
        cancelledAt: new Date(),
        cancelledReason:
          typeof req.body?.reason === "string"
            ? req.body.reason
            : "Cancelled by patient",
      },
    });

    res.status(200).json({
      isSuccess: true,
      message: "Appointment cancelled",
      result: appointment,
    });
  } catch (error) {
    console.error("cancelAppointment error:", error);
    res.status(500).json({
      isSuccess: false,
      message: "Failed to cancel appointment",
    });
  }
};
