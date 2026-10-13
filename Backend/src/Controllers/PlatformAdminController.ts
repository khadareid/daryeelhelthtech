import { Request, Response } from "express";
import {
  PlanInterval,
  PlatformSubscriptionStatus,
  Role,
} from "@prisma/client";
import { prisma } from "../lib/prisma";
import { createAuditLog, getClientMeta } from "../services/audit.service";

function actor(req: Request) {
  const user = (req as any).user;
  return {
    userId: (user?.userId || user?.userid || user?.id || null) as string | null,
    role: (user?.role || null) as Role | null,
  };
}

function featuresArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map(String).map((s) => s.trim()).filter(Boolean);
}

/** GET /admin/public/plans */
export const listPublicPlans = async (_req: Request, res: Response) => {
  try {
    const plans = await prisma.platformPlan.findMany({
      where: { isActive: true, isPublic: true },
      orderBy: [{ sortOrder: "asc" }, { price: "asc" }],
    });
    res.status(200).json({ isSuccess: true, result: plans });
  } catch (error) {
    console.error("listPublicPlans error:", error);
    res.status(500).json({ isSuccess: false, message: "Failed to load plans" });
  }
};

/** GET /admin/public/cms/:key */
export const getPublicCms = async (req: Request, res: Response) => {
  try {
    const key = String(req.params.key || "").trim();
    const row = await prisma.cmsContent.findFirst({
      where: { key, published: true },
    });
    if (!row) {
      res.status(404).json({ isSuccess: false, message: "Content not found" });
      return;
    }
    res.status(200).json({ isSuccess: true, result: row });
  } catch (error) {
    console.error("getPublicCms error:", error);
    res.status(500).json({ isSuccess: false, message: "Failed to load content" });
  }
};

/** GET /admin/plans */
export const listPlans = async (_req: Request, res: Response) => {
  try {
    const plans = await prisma.platformPlan.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      include: { _count: { select: { subscriptions: true } } },
    });
    res.status(200).json({ isSuccess: true, result: plans });
  } catch (error) {
    console.error("listPlans error:", error);
    res.status(500).json({ isSuccess: false, message: "Failed to list plans" });
  }
};

/** POST /admin/plans */
export const createPlan = async (req: Request, res: Response) => {
  try {
    const { userId } = actor(req);
    const body = req.body ?? {};
    const code = String(body.code || "").trim().toUpperCase();
    const name = String(body.name || "").trim();
    if (!code || !name) {
      res.status(400).json({ isSuccess: false, message: "code and name required" });
      return;
    }

    const plan = await prisma.platformPlan.create({
      data: {
        code,
        name,
        description: body.description ? String(body.description) : null,
        price: Number(body.price ?? 0),
        currency: String(body.currency || "USD"),
        interval: Object.values(PlanInterval).includes(body.interval)
          ? body.interval
          : PlanInterval.MONTHLY,
        features: featuresArray(body.features),
        isActive: body.isActive !== false,
        isPublic: body.isPublic !== false,
        sortOrder: Number(body.sortOrder ?? 0),
        trialDays: Number(body.trialDays ?? 0),
        maxUsers: body.maxUsers != null ? Number(body.maxUsers) : null,
        maxBranches: body.maxBranches != null ? Number(body.maxBranches) : null,
      },
    });

    await createAuditLog({
      userId: userId || undefined,
      action: "PLATFORM_PLAN_CREATE",
      entity: "PlatformPlan",
      entityId: plan.planid,
      metadata: { code, name },
      ...getClientMeta(req),
    });

    res.status(201).json({ isSuccess: true, result: plan });
  } catch (error: any) {
    console.error("createPlan error:", error);
    if (error?.code === "P2002") {
      res.status(409).json({ isSuccess: false, message: "Plan code already exists" });
      return;
    }
    res.status(500).json({ isSuccess: false, message: "Failed to create plan" });
  }
};

/** PATCH /admin/plans/:id */
export const updatePlan = async (req: Request, res: Response) => {
  try {
    const { userId } = actor(req);
    const id = String(req.params.id);
    const body = req.body ?? {};
    const data: any = {};

    if (typeof body.name === "string") data.name = body.name.trim();
    if (typeof body.description === "string") data.description = body.description.trim() || null;
    if (body.price != null) data.price = Number(body.price);
    if (typeof body.currency === "string") data.currency = body.currency;
    if (Object.values(PlanInterval).includes(body.interval)) data.interval = body.interval;
    if (body.features != null) data.features = featuresArray(body.features);
    if (typeof body.isActive === "boolean") data.isActive = body.isActive;
    if (typeof body.isPublic === "boolean") data.isPublic = body.isPublic;
    if (body.sortOrder != null) data.sortOrder = Number(body.sortOrder);
    if (body.trialDays != null) data.trialDays = Number(body.trialDays);
    if (body.maxUsers !== undefined) {
      data.maxUsers = body.maxUsers == null ? null : Number(body.maxUsers);
    }
    if (body.maxBranches !== undefined) {
      data.maxBranches = body.maxBranches == null ? null : Number(body.maxBranches);
    }

    const plan = await prisma.platformPlan.update({
      where: { planid: id },
      data,
    });

    await createAuditLog({
      userId: userId || undefined,
      action: "PLATFORM_PLAN_UPDATE",
      entity: "PlatformPlan",
      entityId: id,
      metadata: data,
      ...getClientMeta(req),
    });

    res.status(200).json({ isSuccess: true, result: plan });
  } catch (error) {
    console.error("updatePlan error:", error);
    res.status(500).json({ isSuccess: false, message: "Failed to update plan" });
  }
};

/** DELETE /admin/plans/:id — soft deactivate */
export const deactivatePlan = async (req: Request, res: Response) => {
  try {
    const { userId } = actor(req);
    const id = String(req.params.id);
    const plan = await prisma.platformPlan.update({
      where: { planid: id },
      data: { isActive: false, isPublic: false },
    });
    await createAuditLog({
      userId: userId || undefined,
      action: "PLATFORM_PLAN_DEACTIVATE",
      entity: "PlatformPlan",
      entityId: id,
      ...getClientMeta(req),
    });
    res.status(200).json({ isSuccess: true, result: plan });
  } catch (error) {
    console.error("deactivatePlan error:", error);
    res.status(500).json({ isSuccess: false, message: "Failed to deactivate plan" });
  }
};

/** GET /admin/subscriptions */
export const listSubscriptions = async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 25));
    const status = String(req.query.status || "").trim();
    const search = String(req.query.search || "").trim();

    const where: any = {};
    if (status && Object.values(PlatformSubscriptionStatus).includes(status as any)) {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { organizationName: { contains: search, mode: "insensitive" } },
        { contactEmail: { contains: search, mode: "insensitive" } },
        { contactPhone: { contains: search, mode: "insensitive" } },
      ];
    }

    const [total, rows] = await Promise.all([
      prisma.platformSubscription.count({ where }),
      prisma.platformSubscription.findMany({
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
  } catch (error) {
    console.error("listSubscriptions error:", error);
    res.status(500).json({ isSuccess: false, message: "Failed to list subscriptions" });
  }
};

/** POST /admin/subscriptions */
export const createSubscription = async (req: Request, res: Response) => {
  try {
    const { userId } = actor(req);
    const body = req.body ?? {};
    const planId = String(body.planId || "").trim();
    const organizationName = String(body.organizationName || "").trim();
    if (!planId || !organizationName) {
      res.status(400).json({
        isSuccess: false,
        message: "planId and organizationName required",
      });
      return;
    }

    const plan = await prisma.platformPlan.findUnique({ where: { planid: planId } });
    if (!plan) {
      res.status(404).json({ isSuccess: false, message: "Plan not found" });
      return;
    }

    const startsAt = body.startsAt ? new Date(body.startsAt) : new Date();
    let endsAt: Date | null = body.endsAt ? new Date(body.endsAt) : null;
    if (!endsAt && plan.interval === PlanInterval.MONTHLY) {
      endsAt = new Date(startsAt);
      endsAt.setMonth(endsAt.getMonth() + 1);
    } else if (!endsAt && plan.interval === PlanInterval.YEARLY) {
      endsAt = new Date(startsAt);
      endsAt.setFullYear(endsAt.getFullYear() + 1);
    }

    const status =
      Object.values(PlatformSubscriptionStatus).includes(body.status)
        ? body.status
        : plan.trialDays > 0
          ? PlatformSubscriptionStatus.TRIALING
          : PlatformSubscriptionStatus.ACTIVE;

    const sub = await prisma.platformSubscription.create({
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

    await createAuditLog({
      userId: userId || undefined,
      action: "PLATFORM_SUBSCRIPTION_CREATE",
      entity: "PlatformSubscription",
      entityId: sub.subscriptionid,
      metadata: { planId, organizationName, status },
      ...getClientMeta(req),
    });

    res.status(201).json({ isSuccess: true, result: sub });
  } catch (error) {
    console.error("createSubscription error:", error);
    res.status(500).json({ isSuccess: false, message: "Failed to create subscription" });
  }
};

/** PATCH /admin/subscriptions/:id */
export const updateSubscription = async (req: Request, res: Response) => {
  try {
    const { userId } = actor(req);
    const id = String(req.params.id);
    const body = req.body ?? {};
    const data: any = {};

    if (typeof body.organizationName === "string") {
      data.organizationName = body.organizationName.trim();
    }
    if (typeof body.contactEmail === "string") {
      data.contactEmail = body.contactEmail.trim() || null;
    }
    if (typeof body.contactPhone === "string") {
      data.contactPhone = body.contactPhone.trim() || null;
    }
    if (typeof body.notes === "string") data.notes = body.notes.trim() || null;
    if (body.planId) data.planId = String(body.planId);
    if (body.subscriberUserId !== undefined) {
      data.subscriberUserId = body.subscriberUserId
        ? String(body.subscriberUserId)
        : null;
    }
    if (
      body.status &&
      Object.values(PlatformSubscriptionStatus).includes(body.status)
    ) {
      data.status = body.status;
      if (body.status === PlatformSubscriptionStatus.CANCELLED) {
        data.cancelledAt = new Date();
      }
    }
    if (body.startsAt) data.startsAt = new Date(body.startsAt);
    if (body.endsAt !== undefined) {
      data.endsAt = body.endsAt ? new Date(body.endsAt) : null;
    }

    const sub = await prisma.platformSubscription.update({
      where: { subscriptionid: id },
      data,
      include: { plan: true },
    });

    await createAuditLog({
      userId: userId || undefined,
      action: "PLATFORM_SUBSCRIPTION_UPDATE",
      entity: "PlatformSubscription",
      entityId: id,
      metadata: data,
      ...getClientMeta(req),
    });

    res.status(200).json({ isSuccess: true, result: sub });
  } catch (error) {
    console.error("updateSubscription error:", error);
    res.status(500).json({ isSuccess: false, message: "Failed to update subscription" });
  }
};

/** GET /admin/cms */
export const listCms = async (_req: Request, res: Response) => {
  try {
    const rows = await prisma.cmsContent.findMany({
      orderBy: { key: "asc" },
      include: {
        updatedBy: {
          select: { userid: true, fullName: true, email: true },
        },
      },
    });
    res.status(200).json({ isSuccess: true, result: rows });
  } catch (error) {
    console.error("listCms error:", error);
    res.status(500).json({ isSuccess: false, message: "Failed to list CMS" });
  }
};

/** GET /admin/cms/:key */
export const getCms = async (req: Request, res: Response) => {
  try {
    const key = String(req.params.key);
    const row = await prisma.cmsContent.findUnique({
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
  } catch (error) {
    console.error("getCms error:", error);
    res.status(500).json({ isSuccess: false, message: "Failed to load CMS" });
  }
};

/** PUT /admin/cms/:key — upsert homepage / page CMS */
export const upsertCms = async (req: Request, res: Response) => {
  try {
    const { userId } = actor(req);
    const key = String(req.params.key).trim();
    const body = req.body ?? {};
    if (!key) {
      res.status(400).json({ isSuccess: false, message: "key required" });
      return;
    }
    if (body.data == null || typeof body.data !== "object") {
      res.status(400).json({ isSuccess: false, message: "data object required" });
      return;
    }

    const row = await prisma.cmsContent.upsert({
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
        published:
          typeof body.published === "boolean" ? body.published : undefined,
        updatedById: userId,
      },
    });

    await createAuditLog({
      userId: userId || undefined,
      action: "CMS_UPSERT",
      entity: "CmsContent",
      entityId: row.cmscontentid,
      metadata: { key, published: row.published },
      ...getClientMeta(req),
    });

    res.status(200).json({ isSuccess: true, result: row });
  } catch (error) {
    console.error("upsertCms error:", error);
    res.status(500).json({ isSuccess: false, message: "Failed to save CMS" });
  }
};
