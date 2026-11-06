import { AuditAction } from "@prisma/client";
import { NextFunction, Request, Response } from "express";
import { createAuditLog, getClientMeta } from "../../services/audit.service";
import { CustomUserRequest } from "./VerifyToken";

const MUTATION_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

const actionFromMethod = (method: string): AuditAction => {
  switch (method) {
    case "POST":
      return AuditAction.CREATE;
    case "PUT":
    case "PATCH":
      return AuditAction.UPDATE;
    case "DELETE":
      return AuditAction.DELETE;
    default:
      return AuditAction.VIEW;
  }
};

const entityFromPath = (path: string) => {
  const cleanPath = path.split("?")[0];
  const segments = cleanPath.split("/").filter(Boolean);
  const v1Index = segments.indexOf("v1");
  if (v1Index !== -1 && segments[v1Index + 1]) {
    return segments[v1Index + 1];
  }
  return segments[0] || "UNKNOWN";
};

export const auditMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!MUTATION_METHODS.has(req.method)) {
    next();
    return;
  }

  const originalJson = res.json.bind(res);

  res.json = ((body: unknown) => {
    const user = (req as CustomUserRequest).user;

    if (res.statusCode < 400 && user) {
      const meta = getClientMeta(req);
      const entity = entityFromPath(req.originalUrl || req.path);
      const entityId =
        typeof req.params?.id === "string" ? req.params.id : undefined;

      void createAuditLog({
        action: actionFromMethod(req.method),
        entity,
        entityId,
        description: `${req.method} ${req.originalUrl}`,
        userId: user.userId,
        newValue: {
          path: req.originalUrl,
          method: req.method,
          body: req.body,
        },
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      });
    }

    return originalJson(body);
  }) as typeof res.json;

  next();
};
