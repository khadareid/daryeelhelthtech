"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const IntegrationAuth_1 = require("../helpers/middleware/IntegrationAuth");
const IntegrationPatientController_1 = require("../Controllers/IntegrationPatientController");
const router = (0, express_1.Router)();
router.use(IntegrationAuth_1.requireIntegrationKey);
/** SaaS Health ID verification — read-only, never creates patients */
router.get("/patients/by-health-id", IntegrationPatientController_1.lookupPatientByHealthId);
exports.default = router;
