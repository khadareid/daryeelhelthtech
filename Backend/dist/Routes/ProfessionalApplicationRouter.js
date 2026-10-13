"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const VerifyToken_1 = require("../helpers/middleware/VerifyToken");
const ProfessionalApplicationController_1 = require("../Controllers/ProfessionalApplicationController");
const router = (0, express_1.Router)();
const handle = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res)).catch(next);
};
router.use(VerifyToken_1.decodeToken);
router.post("/", handle(ProfessionalApplicationController_1.submitApplication));
router.get("/mine", handle(ProfessionalApplicationController_1.myApplications));
exports.default = router;
