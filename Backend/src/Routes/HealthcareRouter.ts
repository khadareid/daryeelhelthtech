import { Router } from "express";
import { decodeToken } from "../helpers/middleware/VerifyToken";
import {
  cancelHealthcareAppointment,
  createHealthcareAppointment,
  getHealthcareAppointment,
  getHealthcareAvailability,
  getHealthcareDoctor,
  getHealthcareHospital,
  listConsents,
  listHealthcareActivity,
  listHealthcareAppointments,
  listHealthcareDoctors,
  listHealthcareHospitals,
  listMyOpdTickets,
  respondHealthcareReschedule,
  revokeConsent,
  saasWebhook,
  submitHealthcareReview,
} from "../Controllers/HealthcareBookingController";

const router = Router();

// SaaS → Healthtech webhook (shared secret, no patient JWT)
router.post("/webhooks/saas", saasWebhook);

// Discovery via Healthtech → SaaS proxy (server holds integration key)
router.get("/hospitals", listHealthcareHospitals);
router.get("/hospitals/:hospitalId", getHealthcareHospital);
router.get("/hospitals/:hospitalId/doctors", listHealthcareDoctors);
router.get("/doctors/:doctorId", getHealthcareDoctor);
router.get("/doctors/:doctorId/availability", getHealthcareAvailability);

router.post("/appointments", decodeToken, createHealthcareAppointment);
router.get("/appointments", decodeToken, listHealthcareAppointments);
router.get("/appointments/:id", decodeToken, getHealthcareAppointment);
router.post("/appointments/:id/cancel", decodeToken, cancelHealthcareAppointment);
router.post(
  "/appointments/:id/reschedule/respond",
  decodeToken,
  respondHealthcareReschedule
);
router.post("/appointments/:id/reviews", decodeToken, submitHealthcareReview);

router.get("/opd-tickets", decodeToken, listMyOpdTickets);
router.get("/activity", decodeToken, listHealthcareActivity);
router.get("/consents", decodeToken, listConsents);
router.post("/consents/:id/revoke", decodeToken, revokeConsent);

export default router;
