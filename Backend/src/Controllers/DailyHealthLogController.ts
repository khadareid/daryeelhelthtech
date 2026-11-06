import { Request, Response } from "express";
import { isAdminRole } from "../helpers/middleware/rbac";
import {
  deleteDailyHealthLog,
  getDailyHealthLog,
  listDailyHealthLogs,
  upsertDailyHealthLog,
} from "../services/dailyHealthLog.service";
import { handleRouteError } from "../utils/errors";
import { requireUser, resolveTargetUserId } from "../utils/ownership";
import { created, ok } from "../utils/response";

export const list = async (req: Request, res: Response) => {
  try {
    const user = requireUser(req);
    const userId =
      isAdminRole(user.role) && typeof req.query.userId === "string"
        ? req.query.userId
        : user.userId;
    ok(res, await listDailyHealthLogs(userId, req.query as Record<string, unknown>));
  } catch (error) {
    handleRouteError(error, res);
  }
};

export const getOne = async (req: Request, res: Response) => {
  try {
    const user = requireUser(req);
    ok(res, await getDailyHealthLog(user.userId, req.params.id));
  } catch (error) {
    handleRouteError(error, res);
  }
};

export const upsert = async (req: Request, res: Response) => {
  try {
    const userId = resolveTargetUserId(
      req,
      typeof req.body?.userId === "string" ? req.body.userId : undefined
    );
    created(res, await upsertDailyHealthLog(userId, req.body || {}), "Saved");
  } catch (error) {
    handleRouteError(error, res);
  }
};

export const remove = async (req: Request, res: Response) => {
  try {
    const user = requireUser(req);
    ok(res, await deleteDailyHealthLog(user.userId, req.params.id), "Deleted");
  } catch (error) {
    handleRouteError(error, res);
  }
};
