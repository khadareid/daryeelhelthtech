import { Router } from "express";
import {
  patchRecoveryEmail,
  patchSecurityEmail,
  patchSecurityPhone,
  revokeOtherSecuritySessions,
  revokeSecuritySession,
  securityActivity,
  securitySessions,
  securityStatus,
} from "../Controllers/SecurityController";
import { decodeToken } from "../helpers/middleware/VerifyToken";

const router = Router();

router.use(decodeToken);
router.get("/status", securityStatus);
router.get("/activity", securityActivity);
router.get("/sessions", securitySessions);
router.delete("/sessions/:id", revokeSecuritySession);
router.post("/sessions/revoke-others", revokeOtherSecuritySessions);
router.patch("/phone", patchSecurityPhone);
router.patch("/email", patchSecurityEmail);
router.patch("/recovery-email", patchRecoveryEmail);

export default router;
