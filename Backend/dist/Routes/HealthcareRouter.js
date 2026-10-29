"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const VerifyToken_1 = require("../helpers/middleware/VerifyToken");
const HealthcareBookingController_1 = require("../Controllers/HealthcareBookingController");
const router = (0, express_1.Router)();
// SaaS → Healthtech webhook (shared secret, no patient JWT)
router.post("/webhooks/saas", HealthcareBookingController_1.saasWebhook);
// Discovery via Healthtech → SaaS proxy (server holds integration key)
router.get("/hospitals", HealthcareBookingController_1.listHealthcareHospitals);
router.get("/hospitals/:hospitalId", HealthcareBookingController_1.getHealthcareHospital);
router.get("/hospitals/:hospitalId/doctors", HealthcareBookingController_1.listHealthcareDoctors);
router.get("/doctors/:doctorId", HealthcareBookingController_1.getHealthcareDoctor);
router.get("/doctors/:doctorId/availability", HealthcareBookingController_1.getHealthcareAvailability);
router.post("/appointments", VerifyToken_1.decodeToken, HealthcareBookingController_1.createHealthcareAppointment);
router.get("/appointments", VerifyToken_1.decodeToken, HealthcareBookingController_1.listHealthcareAppointments);
router.get("/appointments/:id", VerifyToken_1.decodeToken, HealthcareBookingController_1.getHealthcareAppointment);
router.post("/appointments/:id/cancel", VerifyToken_1.decodeToken, HealthcareBookingController_1.cancelHealthcareAppointment);
router.post("/appointments/:id/reschedule/respond", VerifyToken_1.decodeToken, HealthcareBookingController_1.respondHealthcareReschedule);
router.post("/appointments/:id/reviews", VerifyToken_1.decodeToken, HealthcareBookingController_1.submitHealthcareReview);
router.get("/opd-tickets", VerifyToken_1.decodeToken, HealthcareBookingController_1.listMyOpdTickets);
router.get("/activity", VerifyToken_1.decodeToken, HealthcareBookingController_1.listHealthcareActivity);
router.get("/consents", VerifyToken_1.decodeToken, HealthcareBookingController_1.listConsents);
router.post("/consents/:id/revoke", VerifyToken_1.decodeToken, HealthcareBookingController_1.revokeConsent);
exports.default = router;
