import { Router } from "express";
import { requireIntegrationKey } from "../helpers/middleware/IntegrationAuth";
import { lookupPatientByHealthId } from "../Controllers/IntegrationPatientController";

const router = Router();

router.use(requireIntegrationKey);

/** SaaS Health ID verification — read-only, never creates patients */
router.get("/patients/by-health-id", lookupPatientByHealthId);

export default router;
