"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const VerifyToken_1 = require("../helpers/middleware/VerifyToken");
const rbac_1 = require("../helpers/middleware/rbac");
const AdminController_1 = require("../Controllers/AdminController");
const ProfessionalApplicationController_1 = require("../Controllers/ProfessionalApplicationController");
const NewsController_1 = require("../Controllers/NewsController");
const PlatformAdminController_1 = require("../Controllers/PlatformAdminController");
const router = (0, express_1.Router)();
const handle = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res)).catch(next);
};
/** Public (no auth) — pricing + homepage CMS for website/app */
router.get("/public/plans", handle(PlatformAdminController_1.listPublicPlans));
router.get("/public/cms/:key", handle(PlatformAdminController_1.getPublicCms));
router.get("/features/me", VerifyToken_1.decodeToken, handle(AdminController_1.getMyFeatures));
/** SUPER_ADMIN + ADMIN — users, features, apps, moderation, audit */
router.use(VerifyToken_1.decodeToken, rbac_1.superAdminOrAdmin);
router.get("/stats", handle(AdminController_1.getAdminStats));
router.get("/users", handle(AdminController_1.listAdminUsers));
router.get("/users/:id", handle(AdminController_1.getAdminUser));
router.patch("/users/:id", handle(AdminController_1.updateAdminUser));
router.post("/users/:id/password-reset", handle(AdminController_1.adminInitiatePasswordReset));
router.get("/features", handle(AdminController_1.listFeatureFlags));
router.patch("/features/:key", handle(AdminController_1.updateFeatureFlag));
router.get("/professional-applications", handle(ProfessionalApplicationController_1.listApplications));
router.patch("/professional-applications/:id", handle(ProfessionalApplicationController_1.reviewApplication));
router.get("/news/reports", handle(NewsController_1.listNewsReports));
router.patch("/news/reports/:id", handle(NewsController_1.reviewNewsReport));
router.patch("/news/:id/moderation", handle(NewsController_1.moderateNews));
router.get("/audit-logs", handle(AdminController_1.listAdminAuditLogs));
router.get("/appointments", handle(AdminController_1.listAdminAppointments));
/** SUPER_ADMIN only — plans, subscriptions, homepage CMS */
router.get("/plans", rbac_1.superAdminOnly, handle(PlatformAdminController_1.listPlans));
router.post("/plans", rbac_1.superAdminOnly, handle(PlatformAdminController_1.createPlan));
router.patch("/plans/:id", rbac_1.superAdminOnly, handle(PlatformAdminController_1.updatePlan));
router.delete("/plans/:id", rbac_1.superAdminOnly, handle(PlatformAdminController_1.deactivatePlan));
router.get("/subscriptions", rbac_1.superAdminOnly, handle(PlatformAdminController_1.listSubscriptions));
router.post("/subscriptions", rbac_1.superAdminOnly, handle(PlatformAdminController_1.createSubscription));
router.patch("/subscriptions/:id", rbac_1.superAdminOnly, handle(PlatformAdminController_1.updateSubscription));
router.get("/cms", rbac_1.superAdminOnly, handle(PlatformAdminController_1.listCms));
router.get("/cms/:key", rbac_1.superAdminOnly, handle(PlatformAdminController_1.getCms));
router.put("/cms/:key", rbac_1.superAdminOnly, handle(PlatformAdminController_1.upsertCms));
exports.default = router;
