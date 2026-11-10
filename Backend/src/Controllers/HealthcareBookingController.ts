import type { Request, Response } from "express";
import { ConsentStatus } from "@prisma/client";
import { prisma } from "../lib/prisma";
import {
  applySaasWebhook,
  cancelHealthcareBooking,
  createHealthcareBooking,
  getHealthcareBooking,
  listHealthcareBookings,
  recordHealthcareActivity,
  requestHealthcareReschedule,
  respondHealthcareReschedule as respondHealthcareRescheduleService,
} from "../services/healthcare/healthcareBooking.service";
import { SaasIntegrationService } from "../services/healthcare/saasIntegration.service";
import {
  HealthcareError,
  HealthcareErrorCodes,
  sendHealthcareError,
  sendHealthcareSuccess,
} from "../services/healthcare/healthcareErrors";

function getUserId(req: Request) {
  const user: any = (req as any).user;
  return user?.userId || user?.userid || user?.id || null;
}

/** GET /healthcare/hospitals */
export const listHealthcareHospitals = async (
  req: Request,
  res: Response
) => {
  try {
    const result = await SaasIntegrationService.searchHospitals({
      search: typeof req.query.search === "string" ? req.query.search : undefined,
      city: typeof req.query.city === "string" ? req.query.city : undefined,
      department:
        typeof req.query.department === "string" ? req.query.department : undefined,
      availableToday:
        typeof req.query.availableToday === "string"
          ? req.query.availableToday
          : undefined,
      availableThisWeek:
        typeof req.query.availableThisWeek === "string"
          ? req.query.availableThisWeek
          : undefined,
      page: typeof req.query.page === "string" ? req.query.page : undefined,
      limit: typeof req.query.limit === "string" ? req.query.limit : undefined,
    });
    return sendHealthcareSuccess(
      res,
      result.data ?? result.result ?? [],
      "Hospitals loaded",
      200,
      { pagination: result.pagination }
    );
  } catch (error) {
    return sendHealthcareError(res, error, "We couldn't load hospitals right now.");
  }
};

/** GET /healthcare/hospitals/:hospitalId */
export const getHealthcareHospital = async (
  req: Request,
  res: Response
) => {
  try {
    const result = await SaasIntegrationService.getHospital(
      String(req.params.hospitalId)
    );
    return sendHealthcareSuccess(
      res,
      result.data ?? result.result,
      "Hospital loaded"
    );
  } catch (error: any) {
    if (error?.status === 404) {
      return sendHealthcareError(
        res,
        new HealthcareError(
          "Hospital not found",
          404,
          HealthcareErrorCodes.HOSPITAL_NOT_FOUND
        ),
        "Hospital not found"
      );
    }
    return sendHealthcareError(res, error, "Hospital unavailable");
  }
};

/** GET /healthcare/hospitals/:hospitalId/departments */
export const listHealthcareDepartments = async (
  req: Request,
  res: Response
) => {
  try {
    const result = await SaasIntegrationService.listDepartments(
      String(req.params.hospitalId)
    );
    return sendHealthcareSuccess(
      res,
      result.data ?? result.result ?? [],
      "Departments loaded"
    );
  } catch (error) {
    return sendHealthcareError(res, error, "Departments unavailable");
  }
};

/** GET /healthcare/hospitals/:hospitalId/doctors */
export const listHealthcareHospitalDoctors = async (
  req: Request,
  res: Response
) => {
  try {
    const result = await SaasIntegrationService.listHospitalDoctors(
      String(req.params.hospitalId),
      {
        search:
          typeof req.query.search === "string" ? req.query.search : undefined,
        specialization:
          typeof req.query.specialization === "string"
            ? req.query.specialization
            : typeof req.query.specialty === "string"
              ? req.query.specialty
              : undefined,
        department:
          typeof req.query.department === "string"
            ? req.query.department
            : undefined,
        page: typeof req.query.page === "string" ? req.query.page : undefined,
        limit: typeof req.query.limit === "string" ? req.query.limit : undefined,
      }
    );
    return sendHealthcareSuccess(
      res,
      result.data ?? result.result ?? [],
      "Doctors loaded",
      200,
      { pagination: result.pagination }
    );
  } catch (error) {
    return sendHealthcareError(res, error, "Doctors unavailable");
  }
};

/** GET /healthcare/doctors â€” cross-hospital search */
export const listHealthcareDoctors = async (
  req: Request,
  res: Response
) => {
  try {
    const hospitalId =
      typeof req.query.hospitalId === "string" ? req.query.hospitalId : undefined;
    const query = {
      search:
        typeof req.query.search === "string" ? req.query.search : undefined,
      specialization:
        typeof req.query.specialization === "string"
          ? req.query.specialization
          : typeof req.query.specialty === "string"
            ? req.query.specialty
            : undefined,
      department:
        typeof req.query.department === "string" ? req.query.department : undefined,
      city: typeof req.query.city === "string" ? req.query.city : undefined,
      hospitalId,
      page: typeof req.query.page === "string" ? req.query.page : undefined,
      limit: typeof req.query.limit === "string" ? req.query.limit : undefined,
    };

    const result = hospitalId
      ? await SaasIntegrationService.listHospitalDoctors(hospitalId, query)
      : await SaasIntegrationService.searchDoctors(query);

    return sendHealthcareSuccess(
      res,
      result.data ?? result.result ?? [],
      "Doctors loaded",
      200,
      { pagination: result.pagination }
    );
  } catch (error) {
    return sendHealthcareError(res, error, "Doctors unavailable");
  }
};

export const getHealthcareDoctor = async (
  req: Request,
  res: Response
) => {
  try {
    const result = await SaasIntegrationService.getDoctor(
      String(req.params.doctorId)
    );
    return sendHealthcareSuccess(
      res,
      result.data ?? result.result,
      "Doctor loaded"
    );
  } catch (error: any) {
    if (error?.status === 404) {
      return sendHealthcareError(
        res,
        new HealthcareError(
          "Doctor not found",
          404,
          HealthcareErrorCodes.DOCTOR_NOT_FOUND
        ),
        "Doctor not found"
      );
    }
    return sendHealthcareError(res, error, "Doctor unavailable");
  }
};

export const getHealthcareAvailability = async (
  req: Request,
  res: Response
) => {
  try {
    const date =
      typeof req.query.date === "string" ? req.query.date : undefined;
    const result = await SaasIntegrationService.getDoctorAvailability(
      String(req.params.doctorId),
      date
    );
    return sendHealthcareSuccess(
      res,
      result.data ?? result.result,
      "Availability loaded"
    );
  } catch (error) {
    return sendHealthcareError(res, error, "Availability unavailable");
  }
};

export const createHealthcareAppointment = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return sendHealthcareError(
        res,
        new HealthcareError(
          "Sign in required",
          401,
          HealthcareErrorCodes.UNAUTHORIZED
        ),
        "Sign in required"
      );
    }

    const body = req.body ?? {};
    const { appointment, created } = await createHealthcareBooking({
      userId,
      tenantId: body.tenantId,
      hospitalId: body.hospitalId,
      doctorId: body.doctorId,
      facilityId: body.facilityId,
      departmentId: body.departmentId,
      department: body.department,
      scheduledAt: body.scheduledAt,
      duration: body.duration,
      reason: body.reason,
      notes: body.notes,
      type: body.type,
      consentId: body.consentId,
      consentGranted: body.consentGranted,
      consultationFee: body.consultationFee,
      currency: body.currency,
      doctorName: body.doctorName,
      facilityName: body.facilityName,
      specialty: body.specialty,
      idempotencyKey: body.idempotencyKey,
      externalRequestId: body.externalRequestId,
    });

    return sendHealthcareSuccess(
      res,
      appointment,
      created
        ? "Appointment requested successfully"
        : "Existing appointment request",
      created ? 201 : 200,
      { created }
    );
  } catch (error) {
    return sendHealthcareError(
      res,
      error,
      "Failed to create appointment request"
    );
  }
};

export const listHealthcareAppointments = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return sendHealthcareError(
        res,
        new HealthcareError(
          "Sign in required",
          401,
          HealthcareErrorCodes.UNAUTHORIZED
        ),
        "Sign in required"
      );
    }
    const rows = await listHealthcareBookings(userId);
    const status =
      typeof req.query.status === "string"
        ? req.query.status.toUpperCase()
        : undefined;
    const filtered = status
      ? rows.filter((r) => r.status === status)
      : rows;
    return sendHealthcareSuccess(res, filtered, "Appointments loaded");
  } catch (error) {
    return sendHealthcareError(res, error, "Failed to list appointments");
  }
};

export const getHealthcareAppointment = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return sendHealthcareError(
        res,
        new HealthcareError(
          "Sign in required",
          401,
          HealthcareErrorCodes.UNAUTHORIZED
        ),
        "Sign in required"
      );
    }
    const row = await getHealthcareBooking(userId, String(req.params.id));
    return sendHealthcareSuccess(res, row, "Appointment loaded");
  } catch (error) {
    return sendHealthcareError(res, error, "Failed to load appointment");
  }
};

export const cancelHealthcareAppointment = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return sendHealthcareError(
        res,
        new HealthcareError(
          "Sign in required",
          401,
          HealthcareErrorCodes.UNAUTHORIZED
        ),
        "Sign in required"
      );
    }
    const updated = await cancelHealthcareBooking(
      userId,
      String(req.params.id),
      req.body?.reason
    );
    return sendHealthcareSuccess(res, updated, "Appointment cancelled");
  } catch (error) {
    return sendHealthcareError(res, error, "Failed to cancel appointment");
  }
};

export const requestHealthcareAppointmentReschedule = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return sendHealthcareError(
        res,
        new HealthcareError(
          "Sign in required",
          401,
          HealthcareErrorCodes.UNAUTHORIZED
        ),
        "Sign in required"
      );
    }
    const proposed =
      req.body?.proposedScheduledAt || req.body?.scheduledAt;
    if (!proposed) {
      return sendHealthcareError(
        res,
        new HealthcareError(
          "proposedScheduledAt is required",
          400,
          HealthcareErrorCodes.VALIDATION_ERROR
        ),
        "proposedScheduledAt is required"
      );
    }
    const updated = await requestHealthcareReschedule(
      userId,
      String(req.params.id),
      String(proposed),
      req.body?.message
    );
    return sendHealthcareSuccess(res, updated, "Reschedule requested");
  } catch (error) {
    return sendHealthcareError(res, error, "Failed to request reschedule");
  }
};

export const respondHealthcareReschedule = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return sendHealthcareError(
        res,
        new HealthcareError(
          "Sign in required",
          401,
          HealthcareErrorCodes.UNAUTHORIZED
        ),
        "Sign in required"
      );
    }
    const updated = await respondHealthcareRescheduleService(
      userId,
      String(req.params.id),
      Boolean(req.body?.accept)
    );
    return sendHealthcareSuccess(
      res,
      updated,
      req.body?.accept ? "New time accepted" : "Proposal declined"
    );
  } catch (error) {
    return sendHealthcareError(res, error, "Failed to respond");
  }
};

export const listMyOpdTickets = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return sendHealthcareError(
        res,
        new HealthcareError(
          "Sign in required",
          401,
          HealthcareErrorCodes.UNAUTHORIZED
        ),
        "Sign in required"
      );
    }
    const rows = await listHealthcareBookings(userId);
    const tickets = rows
      .filter((r) => r.externalTicketNumber || r.externalTicketId)
      .map((r) => ({
        ticketId: r.externalTicketId,
        ticketNumber: r.externalTicketNumber,
        appointmentId: r.id,
        externalAppointmentId: r.externalAppointmentId,
        hospital: r.facilityName,
        doctor: r.doctorName,
        department: r.department,
        scheduledAt: r.scheduledAt,
        status: r.status,
      }));
    return sendHealthcareSuccess(res, tickets, "OPD tickets loaded");
  } catch (error) {
    return sendHealthcareError(res, error, "Failed to load OPD tickets");
  }
};

export const listHealthcareActivity = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return sendHealthcareError(
        res,
        new HealthcareError(
          "Sign in required",
          401,
          HealthcareErrorCodes.UNAUTHORIZED
        ),
        "Sign in required"
      );
    }
    const events = await prisma.healthcareActivityEvent.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return sendHealthcareSuccess(res, events, "Activity loaded");
  } catch (error) {
    return sendHealthcareError(res, error, "Failed to load activity");
  }
};

export const listConsents = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return sendHealthcareError(
        res,
        new HealthcareError(
          "Sign in required",
          401,
          HealthcareErrorCodes.UNAUTHORIZED
        ),
        "Sign in required"
      );
    }
    const consents = await prisma.consent.findMany({
      where: { userId, appointments: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return sendHealthcareSuccess(res, consents, "Consents loaded");
  } catch (error) {
    return sendHealthcareError(res, error, "Failed to load consents");
  }
};

export const revokeConsent = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return sendHealthcareError(
        res,
        new HealthcareError(
          "Sign in required",
          401,
          HealthcareErrorCodes.UNAUTHORIZED
        ),
        "Sign in required"
      );
    }
    const consent = await prisma.consent.findFirst({
      where: { id: String(req.params.id), userId },
    });
    if (!consent) {
      return sendHealthcareError(
        res,
        new HealthcareError("Consent not found", 404),
        "Consent not found"
      );
    }
    const updated = await prisma.consent.update({
      where: { id: consent.id },
      data: {
        status: ConsentStatus.REVOKED,
        revokedAt: new Date(),
        revokedReason: req.body?.reason || "Revoked by patient",
      },
    });
    await recordHealthcareActivity(
      userId,
      "CONSENT_REVOKED",
      "Hospital consent revoked",
      "Future bookings with this hospital will require new consent.",
      null,
      { consentId: consent.id, hospitalId: consent.hospitalId }
    );
    return sendHealthcareSuccess(res, updated, "Consent revoked");
  } catch (error) {
    return sendHealthcareError(res, error, "Failed to revoke consent");
  }
};

/** POST /healthcare/webhooks/saas */
export const saasWebhook = async (req: Request, res: Response) => {
  try {
    const secret = process.env.SAAS_WEBHOOK_SECRET || "";
    const provided =
      (req.headers["x-daryeel-webhook-secret"] as string) ||
      (req.headers["x-webhook-secret"] as string) ||
      "";
    if (!secret || provided !== secret) {
      return sendHealthcareError(
        res,
        new HealthcareError(
          "Invalid webhook secret",
          401,
          HealthcareErrorCodes.INVALID_INTEGRATION_KEY
        ),
        "Unauthorized"
      );
    }

    const updated = await applySaasWebhook(req.body || {});
    return sendHealthcareSuccess(
      res,
      updated || { received: true },
      "Webhook processed"
    );
  } catch (error) {
    return sendHealthcareError(res, error, "Webhook failed");
  }
};
