import { NextFunction, Request, Response, Router } from "express";
import { decodeToken } from "../helpers/middleware/VerifyToken";
import {
  superAdminOnly,
  superAdminOrAdmin,
} from "../helpers/middleware/rbac";
import {
  adminInitiatePasswordReset,
  getAdminStats,
  getAdminUser,
  getMyFeatures,
  listAdminAppointments,
  listAdminAuditLogs,
  listAdminUsers,
  listFeatureFlags,
  updateAdminUser,
  updateFeatureFlag,
} from "../Controllers/AdminController";
import {
  listApplications,
  reviewApplication,
} from "../Controllers/ProfessionalApplicationController";
import {
  listNewsReports,
  moderateNews,
  reviewNewsReport,
} from "../Controllers/NewsController";
import {
  createPlan,
  createSubscription,
  deactivatePlan,
  getCms,
  getPublicCms,
  listCms,
  listPlans,
  listPublicPlans,
  listSubscriptions,
  updatePlan,
  updateSubscription,
  upsertCms,
} from "../Controllers/PlatformAdminController";

const router = Router();

const handle =
  (fn: (req: Request, res: Response) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res)).catch(next);
  };

/** Public (no auth) — pricing + homepage CMS for website/app */
router.get("/public/plans", handle(listPublicPlans));
router.get("/public/cms/:key", handle(getPublicCms));

router.get("/features/me", decodeToken, handle(getMyFeatures));

/** SUPER_ADMIN + ADMIN — users, features, apps, moderation, audit */
router.use(decodeToken, superAdminOrAdmin);

router.get("/stats", handle(getAdminStats));
router.get("/users", handle(listAdminUsers));
router.get("/users/:id", handle(getAdminUser));
router.patch("/users/:id", handle(updateAdminUser));
router.post("/users/:id/password-reset", handle(adminInitiatePasswordReset));

router.get("/features", handle(listFeatureFlags));
router.patch("/features/:key", handle(updateFeatureFlag));

router.get("/professional-applications", handle(listApplications));
router.patch("/professional-applications/:id", handle(reviewApplication));

router.get("/news/reports", handle(listNewsReports));
router.patch("/news/reports/:id", handle(reviewNewsReport));
router.patch("/news/:id/moderation", handle(moderateNews));

router.get("/audit-logs", handle(listAdminAuditLogs));
router.get("/appointments", handle(listAdminAppointments));

/** SUPER_ADMIN only — plans, subscriptions, homepage CMS */
router.get("/plans", superAdminOnly, handle(listPlans));
router.post("/plans", superAdminOnly, handle(createPlan));
router.patch("/plans/:id", superAdminOnly, handle(updatePlan));
router.delete("/plans/:id", superAdminOnly, handle(deactivatePlan));

router.get("/subscriptions", superAdminOnly, handle(listSubscriptions));
router.post("/subscriptions", superAdminOnly, handle(createSubscription));
router.patch("/subscriptions/:id", superAdminOnly, handle(updateSubscription));

router.get("/cms", superAdminOnly, handle(listCms));
router.get("/cms/:key", superAdminOnly, handle(getCms));
router.put("/cms/:key", superAdminOnly, handle(upsertCms));

export default router;
