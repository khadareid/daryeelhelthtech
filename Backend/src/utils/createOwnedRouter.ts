import { Router, Request, Response } from "express";
import { decodeToken } from "../helpers/middleware/VerifyToken";
import { isAdminRole } from "../helpers/middleware/rbac";
import {
  createOwned,
  deleteOwned,
  getOwned,
  listOwned,
} from "../services/ownedCrud.service";
import { asyncHandler } from "./asyncHandler";
import { handleRouteError } from "./errors";
import {
  requireUser,
  resolveTargetUserId,
} from "./ownership";
import { created, ok } from "./response";

type Delegate = {
  findMany: (args: any) => Promise<any[]>;
  findFirst: (args: any) => Promise<any | null>;
  create: (args: any) => Promise<any>;
  update: (args: any) => Promise<any>;
  delete: (args: any) => Promise<any>;
  count: (args: any) => Promise<number>;
};

type Options = {
  sanitizeCreate?: (body: Record<string, unknown>) => Record<string, unknown>;
  sanitizeUpdate?: (body: Record<string, unknown>) => Record<string, unknown>;
  include?: Record<string, unknown>;
  listExtraWhere?: (
    query: Record<string, unknown>
  ) => Record<string, unknown>;
};

export const createOwnedRouter = (delegate: Delegate, options: Options = {}) => {
  const router = Router();
  router.use(decodeToken);

  router.get(
    "/",
    asyncHandler(async (req: Request, res: Response) => {
      try {
        const user = requireUser(req);
        const targetUserId = isAdminRole(user.role)
          ? (typeof req.query.userId === "string" ? req.query.userId : undefined) ||
            undefined
          : user.userId;

        // Non-admins always scoped to self; admins without userId see all
        const scopeUserId = isAdminRole(user.role)
          ? (typeof req.query.userId === "string" ? req.query.userId : undefined)
          : user.userId;

        const result = await listOwned(
          delegate,
          scopeUserId,
          req.query as Record<string, unknown>,
          options.listExtraWhere?.(req.query as Record<string, unknown>) ?? {}
        );
        // silence unused
        void targetUserId;
        ok(res, result);
      } catch (error) {
        handleRouteError(error, res);
      }
    })
  );

  router.get(
    "/:id",
    asyncHandler(async (req: Request, res: Response) => {
      try {
        const user = requireUser(req);
        const row = await getOwned(delegate, req.params.id, {
          userId: user.userId,
          isAdmin: isAdminRole(user.role),
        });
        ok(res, row);
      } catch (error) {
        handleRouteError(error, res);
      }
    })
  );

  router.post(
    "/",
    asyncHandler(async (req: Request, res: Response) => {
      try {
        const userId = resolveTargetUserId(
          req,
          typeof req.body?.userId === "string" ? req.body.userId : undefined
        );
        const data = options.sanitizeCreate
          ? options.sanitizeCreate(req.body || {})
          : { ...(req.body || {}) };
        delete (data as any).userId;
        delete (data as any).id;
        const row = await createOwned(delegate, userId, data);
        created(res, row);
      } catch (error) {
        handleRouteError(error, res);
      }
    })
  );

  router.put(
    "/:id",
    asyncHandler(async (req: Request, res: Response) => {
      try {
        const user = requireUser(req);
        const data = options.sanitizeUpdate
          ? options.sanitizeUpdate(req.body || {})
          : { ...(req.body || {}) };
        delete (data as any).userId;
        delete (data as any).id;
        const row = await getOwned(delegate, req.params.id, {
          userId: user.userId,
          isAdmin: isAdminRole(user.role),
        });
        void row;
        const updated = await delegate.update({
          where: { id: req.params.id },
          data,
        });
        ok(res, updated, "Updated");
      } catch (error) {
        handleRouteError(error, res);
      }
    })
  );

  router.patch(
    "/:id",
    asyncHandler(async (req: Request, res: Response) => {
      try {
        const user = requireUser(req);
        const data = options.sanitizeUpdate
          ? options.sanitizeUpdate(req.body || {})
          : { ...(req.body || {}) };
        delete (data as any).userId;
        delete (data as any).id;
        await getOwned(delegate, req.params.id, {
          userId: user.userId,
          isAdmin: isAdminRole(user.role),
        });
        const updated = await delegate.update({
          where: { id: req.params.id },
          data,
        });
        ok(res, updated, "Updated");
      } catch (error) {
        handleRouteError(error, res);
      }
    })
  );

  router.delete(
    "/:id",
    asyncHandler(async (req: Request, res: Response) => {
      try {
        const user = requireUser(req);
        const deleted = await deleteOwned(delegate, req.params.id, {
          userId: user.userId,
          isAdmin: isAdminRole(user.role),
        });
        ok(res, deleted, "Deleted");
      } catch (error) {
        handleRouteError(error, res);
      }
    })
  );

  return router;
};
