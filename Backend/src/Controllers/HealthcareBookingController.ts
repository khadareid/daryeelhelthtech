import { Request, Response } from "express";
import {
  AppointmentStatus,
  ConsentStatus,
  NotificationChannel,
  NotificationType,
  PaymentStatusMirror,
} from "@prisma/client";
import { randomBytes } from "crypto";
import { prisma } from "../lib/prisma";
import { saasApi } from "../lib/saasClient";

function getUserId(req: Request): string | null {
  const user = (req as any).user;
  return user?.userId || user?.userid || user?.id || null;
}

function makeCode(prefix: string) {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${randomBytes(2)
    .toString("hex")
    .toUpperCase()}`;
}

async function recordActivity(
  userId: string,
  type: string,
  title: string,
  body?: string,
  appointmentId?: string,
  metadata?: Record<string, unknown>
) {
  await prisma.healthcareActivityEvent
    .create({
      data: {
        userId,
        type,
        title,
        body: body || null,
        appointmentId: appointmentId || null,
        metadata: (metadata || undefined) as any,
      },
    })
    .catch(() => undefined);

  await prisma.notification
    .create({
      data: {
        userId,
        title,
        body: body || title,
        type: NotificationType.APPOINTMENT,
        channel: NotificationChannel.IN_APP,
        metadata: {
          ...(metadata || {}),
          activityType: type,
          appointmentId,
        },
      },
    })
    .catch(() => undefined);
}

function mapSaasStatus(status: string): AppointmentStatus {
  const s = String(status || "").toUpperCase();
  if ((Object.values(AppointmentStatus) as string[]).includes(s)) {
    return s as AppointmentStatus;
  }
  return AppointmentStatus.PENDING;
}

function mapPayment(status?: string | null): PaymentStatusMirror {
  const s = String(status || "UNPAID").toUpperCase();
  if ((Object.values(PaymentStatusMirror) as string[]).includes(s)) {
    return s as PaymentStatusMirror;
  }
  return PaymentStatusMirror.UNPAID;
}

async function syncLocalFromSaas(localId: string, saasAppt: any) {
  return prisma.appointment.update({
    where: { appointmentid: localId },
    data: {
      saasAppointmentId: saasAppt.appointmentId,
      saasTenantId: saasAppt.tenantId,
      saasDoctorId: saasAppt.doctorId,
      saasTicketId: saasAppt.opdTicket?.opdTicketId || undefined,
      saasTicketNumber: saasAppt.opdTicket?.ticketNumber || undefined,
      saasVisitId: saasAppt.visit?.visitId || undefined,
      status: mapSaasStatus(saasAppt.status),
      scheduledAt: new Date(saasAppt.scheduledAt),
      proposedScheduledAt: saasAppt.proposedScheduledAt
        ? new Date(saasAppt.proposedScheduledAt)
        : null,
      proposedMessage: saasAppt.proposedMessage || null,
      rejectionReason: saasAppt.rejectionReason || null,
      paymentStatus: mapPayment(saasAppt.paymentStatus),
      confirmedAt: saasAppt.confirmedAt ? new Date(saasAppt.confirmedAt) : null,
      cancelledAt: saasAppt.cancelledAt ? new Date(saasAppt.cancelledAt) : null,
      cancelledReason: saasAppt.cancelledReason || null,
      doctorName: saasAppt.doctor?.name || undefined,
      facilityName: saasAppt.tenant?.companyName || undefined,
      specialty:
        saasAppt.doctor?.professionalProfile?.specialization || undefined,
      department: saasAppt.department || undefined,
    },
  });
}

/** GET /healthcare/hospitals — proxied SaaS directory */
export const listHealthcareHospitals = async (req: Request, res: Response) => {
  try {
    const result = await saasApi.listHospitals({
      search: typeof req.query.search === "string" ? req.query.search : undefined,
      page: typeof req.query.page === "string" ? req.query.page : undefined,
      limit: typeof req.query.limit === "string" ? req.query.limit : undefined,
    });
    res.status(200).json(result);
  } catch (error: any) {
    res.status(error?.status || 503).json({
      isSuccess: false,
      message:
        error?.message ||
        "We couldn't load hospitals right now. Please try again.",
    });
  }
};

export const getHealthcareHospital = async (req: Request, res: Response) => {
  try {
    const result = await saasApi.getHospital(String(req.params.hospitalId));
    res.status(200).json(result);
  } catch (error: any) {
    res.status(error?.status || 503).json({
      isSuccess: false,
      message: error?.message || "Hospital unavailable",
    });
  }
};

export const listHealthcareDoctors = async (req: Request, res: Response) => {
  try {
    const result = await saasApi.listDoctors(String(req.params.hospitalId), {
      search: typeof req.query.search === "string" ? req.query.search : undefined,
      specialization:
        typeof req.query.specialization === "string"
          ? req.query.specialization
          : undefined,
      page: typeof req.query.page === "string" ? req.query.page : undefined,
      limit: typeof req.query.limit === "string" ? req.query.limit : undefined,
    });
    res.status(200).json(result);
  } catch (error: any) {
    res.status(error?.status || 503).json({
      isSuccess: false,
      message: error?.message || "Doctors unavailable",
    });
  }
};

export const getHealthcareDoctor = async (req: Request, res: Response) => {
  try {
    const result = await saasApi.getDoctor(String(req.params.doctorId));
    res.status(200).json(result);
  } catch (error: any) {
    res.status(error?.status || 503).json({
      isSuccess: false,
      message: error?.message || "Doctor unavailable",
    });
  }
};

export const getHealthcareAvailability = async (req: Request, res: Response) => {
  try {
    const date = typeof req.query.date === "string" ? req.query.date : undefined;
    const result = await saasApi.getAvailability(
      String(req.params.doctorId),
      date
    );
    res.status(200).json(result);
  } catch (error: any) {
    res.status(error?.status || 503).json({
      isSuccess: false,
      message: error?.message || "Availability unavailable",
    });
  }
};

/**
 * POST /healthcare/appointments
 * Creates local PENDING mirror only after SaaS accepts the request.
 */
export const createHealthcareAppointment = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ isSuccess: false, message: "Sign in required" });
      return;
    }

    const {
      tenantId,
      hospitalId,
      doctorId,
      facilityId,
      department,
      scheduledAt,
      duration,
      reason,
      notes,
      type,
      consentId,
      consentGranted,
      consultationFee,
      currency,
      doctorName,
      facilityName,
      specialty,
      idempotencyKey: clientKey,
    } = req.body ?? {};

    const saasTenantId = String(tenantId || hospitalId || "");
    const saasDoctorId = String(doctorId || "");
    const when = new Date(scheduledAt);

    if (!saasTenantId || !saasDoctorId || Number.isNaN(when.getTime())) {
      res.status(400).json({
        isSuccess: false,
        message: "hospital, doctor and scheduledAt are required",
      });
      return;
    }

    if (!consentGranted && !consentId) {
      res.status(400).json({
        isSuccess: false,
        message:
          "You must consent to share booking information with the hospital before requesting an appointment",
      });
      return;
    }

    const patient = await prisma.user.findUnique({
      where: { userid: userId },
      select: {
        userid: true,
        fullName: true,
        email: true,
        phone: true,
        gender: true,
        dateOfBirth: true,
        profile: { select: { healthId: true } },
      },
    });
    if (!patient?.email) {
      res.status(400).json({
        isSuccess: false,
        message: "Your profile email is required to book with a hospital",
      });
      return;
    }

    // Ensure / create hospital booking consent
    let consentRecordId = typeof consentId === "string" ? consentId : null;
    if (consentGranted) {
      const consent = await prisma.consent.create({
        data: {
          userId,
          grantedToTenantId: saasTenantId,
          grantedToTenantName: facilityName ? String(facilityName) : null,
          scope: "APPOINTMENTS",
          status: ConsentStatus.ACTIVE,
          purpose: "Share booking and contact details for hospital appointment",
          notes: "Granted during Healthtech appointment request",
        },
      });
      consentRecordId = consent.consentid;
    } else if (consentRecordId) {
      const existing = await prisma.consent.findFirst({
        where: {
          consentid: consentRecordId,
          userId,
          status: ConsentStatus.ACTIVE,
        },
      });
      if (!existing) {
        res.status(400).json({
          isSuccess: false,
          message: "Valid consent is required",
        });
        return;
      }
    }

    const idempotencyKey =
      (typeof clientKey === "string" && clientKey.trim()) ||
      `ht-${userId}-${saasDoctorId}-${when.toISOString()}`;

    // Idempotent local short-circuit
    const existingLocal = await prisma.appointment.findFirst({
      where: {
        OR: [
          { idempotencyKey },
          {
            userId,
            saasDoctorId,
            scheduledAt: when,
            status: {
              in: [
                AppointmentStatus.PENDING,
                AppointmentStatus.ACCEPTED,
                AppointmentStatus.CONFIRMED,
                AppointmentStatus.RESCHEDULE_REQUESTED,
              ],
            },
          },
        ],
      },
    });
    if (existingLocal?.saasAppointmentId) {
      res.status(200).json({
        isSuccess: true,
        message: "Existing appointment request",
        result: existingLocal,
        created: false,
      });
      return;
    }

    const externalAppointmentId = makeCode("HT");

    // Create local draft first with PENDING — will delete if SaaS fails
    const local = await prisma.appointment.create({
      data: {
        userId,
        appointmentCode: makeCode("APT"),
        doctorId: saasDoctorId,
        doctorName: doctorName ? String(doctorName) : "Doctor",
        facilityId: facilityId ? String(facilityId) : saasTenantId,
        facilityName: facilityName ? String(facilityName) : null,
        specialty: specialty ? String(specialty) : null,
        department: department ? String(department) : specialty || null,
        saasTenantId,
        saasDoctorId,
        idempotencyKey,
        scheduledAt: when,
        duration: Number(duration) > 0 ? Number(duration) : 30,
        reason: reason ? String(reason) : null,
        notes: notes ? String(notes) : null,
        status: AppointmentStatus.PENDING,
        paymentStatus: PaymentStatusMirror.UNPAID,
        consultationFee:
          consultationFee !== undefined && consultationFee !== null
            ? Number(consultationFee)
            : null,
        currency: currency ? String(currency) : "USD",
        consentId: consentRecordId,
        source: "HEALTHTECH",
      },
    });

    try {
      const saas = await saasApi.createAppointment(
        {
          tenantId: saasTenantId,
          doctorId: saasDoctorId,
          facilityId: facilityId || null,
          department: department || specialty || null,
          scheduledAt: when.toISOString(),
          duration: Number(duration) > 0 ? Number(duration) : 30,
          type: type || "IN_PERSON",
          reason: reason || null,
          notes: notes || null,
          healthtechUserId: userId,
          externalAppointmentId: local.appointmentid,
          idempotencyKey,
          patient: {
            email: patient.email,
            name: patient.fullName || patient.email,
            phone: patient.phone,
            healthId: patient.profile?.healthId,
            dateOfBirth: patient.dateOfBirth,
            gender: patient.gender === "OTHER" ? null : patient.gender,
          },
        },
        idempotencyKey
      );

      const saasAppt = saas.result || saas.data;
      if (!saasAppt?.appointmentId) {
        throw Object.assign(
          new Error("Hospital system did not confirm the booking"),
          { status: 503 }
        );
      }

      const updated = await syncLocalFromSaas(local.appointmentid, saasAppt);

      await recordActivity(
        userId,
        "APPOINTMENT_REQUESTED",
        "Appointment request sent",
        `Your request with ${updated.doctorName || "the doctor"} was sent to ${
          updated.facilityName || "the hospital"
        }.`,
        updated.appointmentid,
        { saasAppointmentId: saasAppt.appointmentId }
      );

      res.status(201).json({
        isSuccess: true,
        message:
          "Appointment request submitted. The hospital will respond shortly.",
        result: updated,
        created: Boolean(saas.created !== false),
      });
    } catch (error: any) {
      // Do not leave a fake confirmed booking — remove unconfirmed local draft
      await prisma.appointment
        .delete({ where: { appointmentid: local.appointmentid } })
        .catch(() => undefined);

      res.status(error?.status || 503).json({
        isSuccess: false,
        message:
          error?.message ||
          "We couldn't complete your appointment request right now. Your request was not confirmed. Please try again.",
      });
    }
  } catch (error: any) {
    console.error("createHealthcareAppointment", error);
    res.status(500).json({
      isSuccess: false,
      message: "Failed to create appointment request",
    });
  }
};

export const listHealthcareAppointments = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ isSuccess: false, message: "Sign in required" });
      return;
    }

    // Prefer local mirrors; optionally refresh from SaaS
    const local = await prisma.appointment.findMany({
      where: { userId, source: "HEALTHTECH" },
      orderBy: { scheduledAt: "desc" },
      take: 100,
      include: { doctorReview: true },
    });

    try {
      const remote = await saasApi.listAppointments(userId);
      const rows = (remote.result || remote.data || []) as any[];
      for (const saasAppt of rows) {
        const match = local.find(
          (l) =>
            l.saasAppointmentId === saasAppt.appointmentId ||
            l.appointmentid === saasAppt.externalAppointmentId
        );
        if (match) {
          await syncLocalFromSaas(match.appointmentid, saasAppt);
        }
      }
    } catch {
      // offline SaaS — return local mirrors
    }

    const refreshed = await prisma.appointment.findMany({
      where: { userId, source: "HEALTHTECH" },
      orderBy: { scheduledAt: "desc" },
      take: 100,
      include: { doctorReview: true },
    });

    res.status(200).json({ isSuccess: true, result: refreshed, data: refreshed });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      isSuccess: false,
      message: "Failed to list appointments",
    });
  }
};

export const getHealthcareAppointment = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ isSuccess: false, message: "Sign in required" });
      return;
    }
    const id = String(req.params.id);
    const local = await prisma.appointment.findFirst({
      where: {
        userId,
        OR: [{ appointmentid: id }, { saasAppointmentId: id }],
      },
      include: { doctorReview: true },
    });
    if (!local) {
      res.status(404).json({ isSuccess: false, message: "Appointment not found" });
      return;
    }

    if (local.saasAppointmentId) {
      try {
        const remote = await saasApi.getAppointment(local.saasAppointmentId);
        const saasAppt = remote.result || remote.data;
        if (saasAppt) {
          const updated = await syncLocalFromSaas(local.appointmentid, saasAppt);
          res.status(200).json({
            isSuccess: true,
            result: { ...updated, saas: saasAppt },
            data: { ...updated, saas: saasAppt },
          });
          return;
        }
      } catch {
        /* use local */
      }
    }

    res.status(200).json({ isSuccess: true, result: local, data: local });
  } catch (error) {
    res.status(500).json({ isSuccess: false, message: "Failed to load appointment" });
  }
};

export const cancelHealthcareAppointment = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ isSuccess: false, message: "Sign in required" });
      return;
    }
    const local = await prisma.appointment.findFirst({
      where: { appointmentid: String(req.params.id), userId },
    });
    if (!local?.saasAppointmentId) {
      res.status(404).json({ isSuccess: false, message: "Appointment not found" });
      return;
    }

    const saas = await saasApi.cancelAppointment(local.saasAppointmentId, {
      healthtechUserId: userId,
      reason: req.body?.reason || null,
    });
    const saasAppt = saas.result || saas.data;
    const updated = await syncLocalFromSaas(local.appointmentid, saasAppt);

    await recordActivity(
      userId,
      "APPOINTMENT_CANCELLED",
      "Appointment cancelled",
      "You cancelled this appointment request.",
      local.appointmentid
    );

    res.status(200).json({
      isSuccess: true,
      message: "Appointment cancelled",
      result: updated,
    });
  } catch (error: any) {
    res.status(error?.status || 500).json({
      isSuccess: false,
      message: error?.message || "Failed to cancel appointment",
    });
  }
};

export const respondHealthcareReschedule = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ isSuccess: false, message: "Sign in required" });
      return;
    }
    const local = await prisma.appointment.findFirst({
      where: { appointmentid: String(req.params.id), userId },
    });
    if (!local?.saasAppointmentId) {
      res.status(404).json({ isSuccess: false, message: "Appointment not found" });
      return;
    }

    const accept = Boolean(req.body?.accept);
    const saas = await saasApi.respondReschedule(local.saasAppointmentId, {
      healthtechUserId: userId,
      accept,
    });
    const saasAppt = saas.result || saas.data;
    const updated = await syncLocalFromSaas(local.appointmentid, saasAppt);

    await recordActivity(
      userId,
      accept ? "RESCHEDULE_ACCEPTED" : "RESCHEDULE_DECLINED",
      accept ? "New appointment time accepted" : "Proposed time declined",
      accept
        ? "Your appointment is confirmed for the new time."
        : "You declined the hospital's proposed time.",
      local.appointmentid
    );

    res.status(200).json({
      isSuccess: true,
      message: accept ? "New time accepted" : "Proposal declined",
      result: updated,
    });
  } catch (error: any) {
    res.status(error?.status || 500).json({
      isSuccess: false,
      message: error?.message || "Failed to respond",
    });
  }
};

export const submitHealthcareReview = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ isSuccess: false, message: "Sign in required" });
      return;
    }
    const local = await prisma.appointment.findFirst({
      where: { appointmentid: String(req.params.id), userId },
      include: { doctorReview: true },
    });
    if (!local?.saasAppointmentId) {
      res.status(404).json({ isSuccess: false, message: "Appointment not found" });
      return;
    }
    if (local.status !== AppointmentStatus.COMPLETED) {
      res.status(400).json({
        isSuccess: false,
        message: "You can only review after a completed visit",
      });
      return;
    }
    if (local.doctorReview) {
      res.status(409).json({
        isSuccess: false,
        message: "You already reviewed this visit",
      });
      return;
    }

    const rating = Number(req.body?.rating);
    if (rating < 1 || rating > 5) {
      res.status(400).json({
        isSuccess: false,
        message: "Rating must be between 1 and 5",
      });
      return;
    }

    const saas = await saasApi.submitReview(local.saasAppointmentId, {
      healthtechUserId: userId,
      rating,
      comment: req.body?.comment || null,
      professionalism: req.body?.professionalism ?? null,
      communication: req.body?.communication ?? null,
      waitingTime: req.body?.waitingTime ?? null,
      careQuality: req.body?.careQuality ?? null,
      overallExperience: req.body?.overallExperience ?? null,
    });

    const review = await prisma.doctorReview.create({
      data: {
        appointmentId: local.appointmentid,
        userId,
        saasDoctorId: local.saasDoctorId || local.doctorId || "",
        saasTenantId: local.saasTenantId,
        saasReviewId: (saas.result || saas.data)?.reviewId || null,
        rating,
        comment: req.body?.comment || null,
        professionalism: req.body?.professionalism ?? null,
        communication: req.body?.communication ?? null,
        waitingTime: req.body?.waitingTime ?? null,
        careQuality: req.body?.careQuality ?? null,
        overallExperience: req.body?.overallExperience ?? null,
      },
    });

    await recordActivity(
      userId,
      "REVIEW_SUBMITTED",
      "Doctor review submitted",
      `You rated ${local.doctorName || "the doctor"} ${rating}/5.`,
      local.appointmentid
    );

    res.status(201).json({
      isSuccess: true,
      message: "Review submitted",
      result: review,
    });
  } catch (error: any) {
    res.status(error?.status || 500).json({
      isSuccess: false,
      message: error?.message || "Failed to submit review",
    });
  }
};

export const listHealthcareActivity = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ isSuccess: false, message: "Sign in required" });
      return;
    }
    const events = await prisma.healthcareActivityEvent.findMany({
      where: { userId },
      orderBy: { occurredAt: "desc" },
      take: 100,
    });
    res.status(200).json({ isSuccess: true, result: events, data: events });
  } catch {
    res.status(500).json({ isSuccess: false, message: "Failed to load activity" });
  }
};

export const listMyOpdTickets = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ isSuccess: false, message: "Sign in required" });
      return;
    }
    const tickets = await prisma.appointment.findMany({
      where: {
        userId,
        saasTicketNumber: { not: null },
      },
      orderBy: { scheduledAt: "desc" },
      take: 50,
      select: {
        appointmentid: true,
        appointmentCode: true,
        saasTicketId: true,
        saasTicketNumber: true,
        saasAppointmentId: true,
        doctorName: true,
        facilityName: true,
        department: true,
        specialty: true,
        scheduledAt: true,
        status: true,
        paymentStatus: true,
      },
    });
    res.status(200).json({ isSuccess: true, result: tickets, data: tickets });
  } catch {
    res.status(500).json({ isSuccess: false, message: "Failed to load tickets" });
  }
};

export const listConsents = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ isSuccess: false, message: "Sign in required" });
      return;
    }
    const consents = await prisma.consent.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    res.status(200).json({ isSuccess: true, result: consents, data: consents });
  } catch {
    res.status(500).json({ isSuccess: false, message: "Failed to load consents" });
  }
};

export const revokeConsent = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ isSuccess: false, message: "Sign in required" });
      return;
    }
    const consent = await prisma.consent.findFirst({
      where: { consentid: String(req.params.id), userId },
    });
    if (!consent) {
      res.status(404).json({ isSuccess: false, message: "Consent not found" });
      return;
    }
    const updated = await prisma.consent.update({
      where: { consentid: consent.consentid },
      data: {
        status: ConsentStatus.REVOKED,
        revokedAt: new Date(),
        revokedReason: req.body?.reason || "Revoked by patient",
      },
    });
    res.status(200).json({
      isSuccess: true,
      message:
        "Consent revoked. Future sharing that depends on this permission is blocked. Historical hospital records already disclosed are not recalled.",
      result: updated,
    });
  } catch {
    res.status(500).json({ isSuccess: false, message: "Failed to revoke consent" });
  }
};

/**
 * POST /healthcare/webhooks/saas
 * Inbound events from SaaS (OPD issued, accepted, etc.)
 */
export const saasWebhook = async (req: Request, res: Response) => {
  try {
    const secret = process.env.SAAS_WEBHOOK_SECRET || "";
    const header = req.header("x-daryeel-webhook-secret") || "";
    if (!secret || header !== secret) {
      res.status(401).json({ isSuccess: false, message: "Unauthorized webhook" });
      return;
    }

    const type = String(req.body?.type || "");
    const externalAppointmentId = String(
      req.body?.externalAppointmentId || req.body?.payload?.externalAppointmentId || ""
    );
    const saasAppointmentId = String(
      req.body?.appointmentId || req.body?.payload?.appointmentId || ""
    );
    const healthtechUserId = String(
      req.body?.healthtechUserId || req.body?.payload?.healthtechUserId || ""
    );

    const local = await prisma.appointment.findFirst({
      where: {
        OR: [
          ...(externalAppointmentId
            ? [{ appointmentid: externalAppointmentId }]
            : []),
          ...(saasAppointmentId
            ? [{ saasAppointmentId }]
            : []),
        ],
      },
    });

    if (!local) {
      res.status(202).json({ isSuccess: true, message: "No local appointment" });
      return;
    }

    if (local.saasAppointmentId || saasAppointmentId) {
      try {
        const remote = await saasApi.getAppointment(
          local.saasAppointmentId || saasAppointmentId
        );
        const saasAppt = remote.result || remote.data;
        if (saasAppt) await syncLocalFromSaas(local.appointmentid, saasAppt);
      } catch {
        /* ignore sync failure */
      }
    }

    const titles: Record<string, string> = {
      APPOINTMENT_ACCEPTED: "Appointment accepted",
      APPOINTMENT_REJECTED: "Appointment rejected",
      RESCHEDULE_REQUESTED: "New time suggested",
      OPD_TICKET_GENERATED: "OPD ticket issued",
      PATIENT_CHECKED_IN: "Checked in at hospital",
      VISIT_COMPLETED: "Visit completed",
      PAYMENT_STATUS_CHANGED: "Payment status updated",
    };

    await recordActivity(
      healthtechUserId || local.userId,
      type || "SAAS_EVENT",
      titles[type] || "Appointment update",
      req.body?.message || titles[type] || "Your healthcare booking was updated.",
      local.appointmentid,
      req.body
    );

    res.status(200).json({ isSuccess: true });
  } catch (error) {
    console.error("saasWebhook", error);
    res.status(500).json({ isSuccess: false, message: "Webhook failed" });
  }
};
