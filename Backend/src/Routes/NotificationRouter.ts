import { NotificationChannel, NotificationType } from "@prisma/client";
import { Request, Response, Router } from "express";
import { decodeToken } from "../helpers/middleware/VerifyToken";
import { isAdminRole } from "../helpers/middleware/rbac";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../utils/asyncHandler";
import { createOwnedRouter } from "../utils/createOwnedRouter";
import { handleRouteError } from "../utils/errors";
import { requireUser } from "../utils/ownership";
import { ok } from "../utils/response";
import {
  optionalString,
  parseEnum,
  requireString,
} from "../utils/validation";

const base = createOwnedRouter(prisma.notification, {
  sanitizeCreate: (body) => ({
    title: requireString(body.title, "title"),
    body: requireString(body.body, "body"),
    type: parseEnum(
      body.type,
      Object.values(NotificationType),
      "type",
      true
    )!,
    channel:
      parseEnum(
        body.channel,
        Object.values(NotificationChannel),
        "channel"
      ) || NotificationChannel.IN_APP,
    data: body.data ?? undefined,
  }),
  sanitizeUpdate: (body) => {
    const data: Record<string, unknown> = {};
    if (body.title !== undefined) data.title = requireString(body.title, "title");
    if (body.body !== undefined) data.body = requireString(body.body, "body");
    if (body.type !== undefined)
      data.type = parseEnum(body.type, Object.values(NotificationType), "type", true);
    if (body.channel !== undefined)
      data.channel = parseEnum(
        body.channel,
        Object.values(NotificationChannel),
        "channel"
      );
    if (body.isRead !== undefined) {
      data.isRead = Boolean(body.isRead);
      data.readAt = body.isRead ? new Date() : null;
    }
    if (body.data !== undefined) data.data = body.data;
    return data;
  },
});

const router = Router();
router.use(decodeToken);

router.patch(
  "/:id/read",
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const user = requireUser(req);
      const row = await prisma.notification.findFirst({
        where: { id: req.params.id },
      });
      if (!row) {
        res.status(404).json({ isSuccess: false, message: "Not found" });
        return;
      }
      if (!isAdminRole(user.role) && row.userId !== user.userId) {
        res.status(403).json({ isSuccess: false, message: "Forbidden" });
        return;
      }
      const updated = await prisma.notification.update({
        where: { id: row.id },
        data: { isRead: true, readAt: new Date() },
      });
      ok(res, updated, "Marked as read");
    } catch (error) {
      handleRouteError(error, res);
    }
  })
);

router.post(
  "/read-all",
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const user = requireUser(req);
      const result = await prisma.notification.updateMany({
        where: { userId: user.userId, isRead: false },
        data: { isRead: true, readAt: new Date() },
      });
      ok(res, result, "All notifications marked as read");
    } catch (error) {
      handleRouteError(error, res);
    }
  })
);

router.use("/", base);

export default router;
