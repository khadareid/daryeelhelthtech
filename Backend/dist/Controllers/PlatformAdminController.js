"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upsertCms = exports.getCms = exports.listCms = exports.updateSubscription = exports.createSubscription = exports.listSubscriptions = exports.deactivatePlan = exports.updatePlan = exports.createPlan = exports.listPlans = exports.getPublicCms = exports.listPublicPlans = void 0;
const client_1 = require("@prisma/client");
const prisma_1 = require("../lib/prisma");
const audit_service_1 = require("../services/audit.service");
function actor(req) {
    const user = req.user;
    return {
        userId: ((user === null || user === void 0 ? void 0 : user.userId) || (user === null || user === void 0 ? void 0 : user.userid) || (user === null || user === void 0 ? void 0 : user.id) || null),
        role: ((user === null || user === void 0 ? void 0 : user.role) || null),
    };
}
function featuresArray(value) {
    if (!Array.isArray(value))
        return [];
    return value.map(String).map((s) => s.trim()).filter(Boolean);
}
/** GET /admin/public/plans */
const listPublicPlans = (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const plans = yield prisma_1.prisma.platformPlan.findMany({
            where: { isActive: true, isPublic: true },
            orderBy: [{ sortOrder: "asc" }, { price: "asc" }],
        });
        res.status(200).json({ isSuccess: true, result: plans });
    }
    catch (error) {
        console.error("listPublicPlans error:", error);
        res.status(500).json({ isSuccess: false, message: "Failed to load plans" });
    }
});
exports.listPublicPlans = listPublicPlans;
/** GET /admin/public/cms/:key */
const getPublicCms = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const key = String(req.params.key || "").trim();
        const row = yield prisma_1.prisma.cmsContent.findFirst({
            where: { key, published: true },
        });
        if (!row) {
            res.status(404).json({ isSuccess: false, message: "Content not found" });
            return;
        }
        res.status(200).json({ isSuccess: true, result: row });
    }
    catch (error) {
        console.error("getPublicCms error:", error);
        res.status(500).json({ isSuccess: false, message: "Failed to load content" });
    }
});
exports.getPublicCms = getPublicCms;
/** GET /admin/plans */
const listPlans = (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const plans = yield prisma_1.prisma.platformPlan.findMany({
            orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
            include: { _count: { select: { subscriptions: true } } },
        });
        res.status(200).json({ isSuccess: true, result: plans });
    }
    catch (error) {
        console.error("listPlans error:", error);
        res.status(500).json({ isSuccess: false, message: "Failed to list plans" });
    }
});
exports.listPlans = listPlans;
/** POST /admin/plans */
const createPlan = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    try {
        const { userId } = actor(req);
        const body = (_a = req.body) !== null && _a !== void 0 ? _a : {};
        const code = String(body.code || "").trim().toUpperCase();
        const name = String(body.name || "").trim();
        if (!code || !name) {
            res.status(400).json({ isSuccess: false, message: "code and name required" });
            return;
        }
        const plan = yield prisma_1.prisma.platformPlan.create({
            data: {
                code,
                name,
                description: body.description ? String(body.description) : null,
                price: Number((_b = body.price) !== null && _b !== void 0 ? _b : 0),
                currency: String(body.currency || "USD"),
                interval: Object.values(client_1.PlanInterval).includes(body.interval)
                    ? body.interval
                    : client_1.PlanInterval.MONTHLY,
                features: featuresArray(body.features),
                isActive: body.isActive !== false,
                isPublic: body.isPublic !== false,
                sortOrder: Number((_c = body.sortOrder) !== null && _c !== void 0 ? _c : 0),
                trialDays: Number((_d = body.trialDays) !== null && _d !== void 0 ? _d : 0),
                maxUsers: body.maxUsers != null ? Number(body.maxUsers) : null,
                maxBranches: body.maxBranches != null ? Number(body.maxBranches) : null,
            },
        });
        yield (0, audit_service_1.createAuditLog)(Object.assign({ userId: userId || undefined, action: "PLATFORM_PLAN_CREATE", entity: "PlatformPlan", entityId: plan.planid, metadata: { code, name } }, (0, audit_service_1.getClientMeta)(req)));
        res.status(201).json({ isSuccess: true, result: plan });
    }
    catch (error) {
        console.error("createPlan error:", error);
        if ((error === null || error === void 0 ? void 0 : error.code) === "P2002") {
            res.status(409).json({ isSuccess: false, message: "Plan code already exists" });
            return;
        }
        res.status(500).json({ isSuccess: false, message: "Failed to create plan" });
    }
});
exports.createPlan = createPlan;
/** PATCH /admin/plans/:id */
const updatePlan = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { userId } = actor(req);
        const id = String(req.params.id);
        const body = (_a = req.body) !== null && _a !== void 0 ? _a : {};
        const data = {};
        if (typeof body.name === "string")
            data.name = body.name.trim();
        if (typeof body.description === "string")
            data.description = body.description.trim() || null;
        if (body.price != null)
            data.price = Number(body.price);
        if (typeof body.currency === "string")
            data.currency = body.currency;
        if (Object.values(client_1.PlanInterval).includes(body.interval))
            data.interval = body.interval;
        if (body.features != null)
            data.features = featuresArray(body.features);
        if (typeof body.isActive === "boolean")
            data.isActive = body.isActive;
        if (typeof body.isPublic === "boolean")
            data.isPublic = body.isPublic;
        if (body.sortOrder != null)
            data.sortOrder = Number(body.sortOrder);
        if (body.trialDays != null)
            data.trialDays = Number(body.trialDays);
        if (body.maxUsers !== undefined) {
            data.maxUsers = body.maxUsers == null ? null : Number(body.maxUsers);
        }
        if (body.maxBranches !== undefined) {
            data.maxBranches = body.maxBranches == null ? null : Number(body.maxBranches);
        }
        const plan = yield prisma_1.prisma.platformPlan.update({
            where: { planid: id },
            data,
        });
        yield (0, audit_service_1.createAuditLog)(Object.assign({ userId: userId || undefined, action: "PLATFORM_PLAN_UPDATE", entity: "PlatformPlan", entityId: id, metadata: data }, (0, audit_service_1.getClientMeta)(req)));
        res.status(200).json({ isSuccess: true, result: plan });
    }
    catch (error) {
        console.error("updatePlan error:", error);
        res.status(500).json({ isSuccess: false, message: "Failed to update plan" });
    }
});
exports.updatePlan = updatePlan;
/** DELETE /admin/plans/:id — soft deactivate */
const deactivatePlan = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId } = actor(req);
        const id = String(req.params.id);
        const plan = yield prisma_1.prisma.platformPlan.update({
            where: { planid: id },
            data: { isActive: false, isPublic: false },
        });
        yield (0, audit_service_1.createAuditLog)(Object.assign({ userId: userId || undefined, action: "PLATFORM_PLAN_DEACTIVATE", entity: "PlatformPlan", entityId: id }, (0, audit_service_1.getClientMeta)(req)));
        res.status(200).json({ isSuccess: true, result: plan });
    }
    catch (error) {
        console.error("deactivatePlan error:", error);
        res.status(500).json({ isSuccess: false, message: "Failed to deactivate plan" });
    }
});
exports.deactivatePlan = deactivatePlan;
/** GET /admin/subscriptions */
const listSubscriptions = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 25));
        const status = String(req.query.status || "").trim();
        const search = String(req.query.search || "").trim();
        const where = {};
        if (status && Object.values(client_1.PlatformSubscriptionStatus).includes(status)) {
            where.status = status;
        }
        if (search) {
            where.OR = [
                { organizationName: { contains: search, mode: "insensitive" } },
                { contactEmail: { contains: search, mode: "insensitive" } },
                { contactPhone: { contains: search, mode: "insensitive" } },
            ];
        }
        const [total, rows] = yield Promise.all([
            prisma_1.prisma.platformSubscription.count({ where }),
            prisma_1.prisma.platformSubscription.findMany({
                where,
                orderBy: { createdAt: "desc" },
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    plan: true,
                    subscriberUser: {
                        select: { userid: true, fullName: true, email: true, role: true },
                    },
                },
            }),
        ]);
        res.status(200).json({
            isSuccess: true,
            data: rows,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.max(1, Math.ceil(total / limit)),
            },
        });
    }
    catch (error) {
        console.error("listSubscriptions error:", error);
        res.status(500).json({ isSuccess: false, message: "Failed to list subscriptions" });
    }
});
exports.listSubscriptions = listSubscriptions;
/** POST /admin/subscriptions */
const createSubscription = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { userId } = actor(req);
        const body = (_a = req.body) !== null && _a !== void 0 ? _a : {};
        const planId = String(body.planId || "").trim();
        const organizationName = String(body.organizationName || "").trim();
        if (!planId || !organizationName) {
            res.status(400).json({
                isSuccess: false,
                message: "planId and organizationName required",
            });
            return;
        }
        const plan = yield prisma_1.prisma.platformPlan.findUnique({ where: { planid: planId } });
        if (!plan) {
            res.status(404).json({ isSuccess: false, message: "Plan not found" });
            return;
        }
        const startsAt = body.startsAt ? new Date(body.startsAt) : new Date();
        let endsAt = body.endsAt ? new Date(body.endsAt) : null;
        if (!endsAt && plan.interval === client_1.PlanInterval.MONTHLY) {
            endsAt = new Date(startsAt);
            endsAt.setMonth(endsAt.getMonth() + 1);
        }
        else if (!endsAt && plan.interval === client_1.PlanInterval.YEARLY) {
            endsAt = new Date(startsAt);
            endsAt.setFullYear(endsAt.getFullYear() + 1);
        }
        const status = Object.values(client_1.PlatformSubscriptionStatus).includes(body.status)
            ? body.status
            : plan.trialDays > 0
                ? client_1.PlatformSubscriptionStatus.TRIALING
                : client_1.PlatformSubscriptionStatus.ACTIVE;
        const sub = yield prisma_1.prisma.platformSubscription.create({
            data: {
                planId,
                organizationName,
                contactEmail: body.contactEmail ? String(body.contactEmail) : null,
                contactPhone: body.contactPhone ? String(body.contactPhone) : null,
                subscriberUserId: body.subscriberUserId
                    ? String(body.subscriberUserId)
                    : null,
                status,
                startsAt,
                endsAt,
                notes: body.notes ? String(body.notes) : null,
            },
            include: { plan: true },
        });
        yield (0, audit_service_1.createAuditLog)(Object.assign({ userId: userId || undefined, action: "PLATFORM_SUBSCRIPTION_CREATE", entity: "PlatformSubscription", entityId: sub.subscriptionid, metadata: { planId, organizationName, status } }, (0, audit_service_1.getClientMeta)(req)));
        res.status(201).json({ isSuccess: true, result: sub });
    }
    catch (error) {
        console.error("createSubscription error:", error);
        res.status(500).json({ isSuccess: false, message: "Failed to create subscription" });
    }
});
exports.createSubscription = createSubscription;
/** PATCH /admin/subscriptions/:id */
const updateSubscription = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { userId } = actor(req);
        const id = String(req.params.id);
        const body = (_a = req.body) !== null && _a !== void 0 ? _a : {};
        const data = {};
        if (typeof body.organizationName === "string") {
            data.organizationName = body.organizationName.trim();
        }
        if (typeof body.contactEmail === "string") {
            data.contactEmail = body.contactEmail.trim() || null;
        }
        if (typeof body.contactPhone === "string") {
            data.contactPhone = body.contactPhone.trim() || null;
        }
        if (typeof body.notes === "string")
            data.notes = body.notes.trim() || null;
        if (body.planId)
            data.planId = String(body.planId);
        if (body.subscriberUserId !== undefined) {
            data.subscriberUserId = body.subscriberUserId
                ? String(body.subscriberUserId)
                : null;
        }
        if (body.status &&
            Object.values(client_1.PlatformSubscriptionStatus).includes(body.status)) {
            data.status = body.status;
            if (body.status === client_1.PlatformSubscriptionStatus.CANCELLED) {
                data.cancelledAt = new Date();
            }
        }
        if (body.startsAt)
            data.startsAt = new Date(body.startsAt);
        if (body.endsAt !== undefined) {
            data.endsAt = body.endsAt ? new Date(body.endsAt) : null;
        }
        const sub = yield prisma_1.prisma.platformSubscription.update({
            where: { subscriptionid: id },
            data,
            include: { plan: true },
        });
        yield (0, audit_service_1.createAuditLog)(Object.assign({ userId: userId || undefined, action: "PLATFORM_SUBSCRIPTION_UPDATE", entity: "PlatformSubscription", entityId: id, metadata: data }, (0, audit_service_1.getClientMeta)(req)));
        res.status(200).json({ isSuccess: true, result: sub });
    }
    catch (error) {
        console.error("updateSubscription error:", error);
        res.status(500).json({ isSuccess: false, message: "Failed to update subscription" });
    }
});
exports.updateSubscription = updateSubscription;
/** GET /admin/cms */
const listCms = (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const rows = yield prisma_1.prisma.cmsContent.findMany({
            orderBy: { key: "asc" },
            include: {
                updatedBy: {
                    select: { userid: true, fullName: true, email: true },
                },
            },
        });
        res.status(200).json({ isSuccess: true, result: rows });
    }
    catch (error) {
        console.error("listCms error:", error);
        res.status(500).json({ isSuccess: false, message: "Failed to list CMS" });
    }
});
exports.listCms = listCms;
/** GET /admin/cms/:key */
const getCms = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const key = String(req.params.key);
        const row = yield prisma_1.prisma.cmsContent.findUnique({
            where: { key },
            include: {
                updatedBy: {
                    select: { userid: true, fullName: true, email: true },
                },
            },
        });
        if (!row) {
            res.status(404).json({ isSuccess: false, message: "CMS key not found" });
            return;
        }
        res.status(200).json({ isSuccess: true, result: row });
    }
    catch (error) {
        console.error("getCms error:", error);
        res.status(500).json({ isSuccess: false, message: "Failed to load CMS" });
    }
});
exports.getCms = getCms;
/** PUT /admin/cms/:key — upsert homepage / page CMS */
const upsertCms = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { userId } = actor(req);
        const key = String(req.params.key).trim();
        const body = (_a = req.body) !== null && _a !== void 0 ? _a : {};
        if (!key) {
            res.status(400).json({ isSuccess: false, message: "key required" });
            return;
        }
        if (body.data == null || typeof body.data !== "object") {
            res.status(400).json({ isSuccess: false, message: "data object required" });
            return;
        }
        const row = yield prisma_1.prisma.cmsContent.upsert({
            where: { key },
            create: {
                key,
                title: body.title ? String(body.title) : key,
                data: body.data,
                published: body.published !== false,
                updatedById: userId,
            },
            update: {
                title: body.title != null ? String(body.title) : undefined,
                data: body.data,
                published: typeof body.published === "boolean" ? body.published : undefined,
                updatedById: userId,
            },
        });
        yield (0, audit_service_1.createAuditLog)(Object.assign({ userId: userId || undefined, action: "CMS_UPSERT", entity: "CmsContent", entityId: row.cmscontentid, metadata: { key, published: row.published } }, (0, audit_service_1.getClientMeta)(req)));
        res.status(200).json({ isSuccess: true, result: row });
    }
    catch (error) {
        console.error("upsertCms error:", error);
        res.status(500).json({ isSuccess: false, message: "Failed to save CMS" });
    }
});
exports.upsertCms = upsertCms;
