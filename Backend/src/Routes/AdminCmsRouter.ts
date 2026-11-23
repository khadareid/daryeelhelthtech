import { Router } from "express";
import {
  adminCreatePage,
  adminCreateTeamMember,
  adminDeletePage,
  adminDeleteTeamMember,
  adminEnsurePages,
  adminGetPage,
  adminGetTeamMember,
  adminListPages,
  adminListTeam,
  adminUpdateBranding,
  adminUpdatePage,
  adminUpdateTeamMember,
  publicSettings,
} from "../Controllers/CmsController";
import { decodeToken } from "../helpers/middleware/VerifyToken";
import { adminOnly } from "../helpers/middleware/rbac";

const router = Router();
router.use(decodeToken, adminOnly);

router.get("/settings", publicSettings);
router.patch("/settings/branding", adminUpdateBranding);
router.put("/settings/branding", adminUpdateBranding);

router.get("/pages", adminListPages);
router.post("/pages/ensure", adminEnsurePages);
router.post("/pages", adminCreatePage);
router.get("/pages/:id", adminGetPage);
router.patch("/pages/:id", adminUpdatePage);
router.put("/pages/:id", adminUpdatePage);
router.delete("/pages/:id", adminDeletePage);

router.get("/team", adminListTeam);
router.post("/team", adminCreateTeamMember);
router.get("/team/:id", adminGetTeamMember);
router.patch("/team/:id", adminUpdateTeamMember);
router.put("/team/:id", adminUpdateTeamMember);
router.delete("/team/:id", adminDeleteTeamMember);

export default router;
