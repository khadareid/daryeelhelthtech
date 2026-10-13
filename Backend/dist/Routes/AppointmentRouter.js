"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const VerifyToken_1 = require("../helpers/middleware/VerifyToken");
const AppointmentController_1 = require("../Controllers/AppointmentController");
const router = (0, express_1.Router)();
const handle = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res)).catch(next);
};
router.use(VerifyToken_1.decodeToken);
router.post("/", handle(AppointmentController_1.createAppointment));
router.get("/", handle(AppointmentController_1.listMyAppointments));
router.patch("/:id/cancel", handle(AppointmentController_1.cancelAppointment));
exports.default = router;
