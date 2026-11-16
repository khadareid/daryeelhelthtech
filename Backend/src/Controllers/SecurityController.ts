import { Request, Response } from "express";
import { getClientMeta } from "../services/audit.service";
import {
  getSecurityStatus,
  getSessions,
  listSecurityActivity,
  revokeOneSession,
  revokeOthers,
  updatePrimaryEmail,
  updateRecoveryEmail,
  updateSecurityPhone,
} from "../services/security.service";
import { handleRouteError } from "../utils/errors";
import { requireUser } from "../utils/ownership";
import { ok } from "../utils/response";

function refreshFromReq(req: Request) {
  return (
    (req.headers["x-refresh-token"] as string | undefined) ||
    (req.body?.refreshToken as string | undefined) ||
    (typeof req.query.refreshToken === "string"
      ? req.query.refreshToken
      : undefined) ||
    undefined
  );
}

export const securityStatus = async (req: Request, res: Response) => {
  try {
    const user = requireUser(req);
    ok(res, await getSecurityStatus(user.userId));
  } catch (error) {
    handleRouteError(error, res);
  }
};

export const securityActivity = async (req: Request, res: Response) => {
  try {
    const user = requireUser(req);
    const limit = Number(req.query.limit || 30);
    ok(res, await listSecurityActivity(user.userId, limit));
  } catch (error) {
    handleRouteError(error, res);
  }
};

export const securitySessions = async (req: Request, res: Response) => {
  try {
    const user = requireUser(req);
    ok(res, await getSessions(user.userId, refreshFromReq(req)));
  } catch (error) {
    handleRouteError(error, res);
  }
};

export const revokeSecuritySession = async (req: Request, res: Response) => {
  try {
    const user = requireUser(req);
    const meta = getClientMeta(req);
    ok(
      res,
      await revokeOneSession(
        user.userId,
        String(req.params.id),
        refreshFromReq(req),
        meta
      ),
      "Session revoked"
    );
  } catch (error) {
    handleRouteError(error, res);
  }
};

export const revokeOtherSecuritySessions = async (
  req: Request,
  res: Response
) => {
  try {
    const user = requireUser(req);
    const meta = getClientMeta(req);
    ok(
      res,
      await revokeOthers(user.userId, refreshFromReq(req), meta),
      "All other devices have been signed out."
    );
  } catch (error) {
    handleRouteError(error, res);
  }
};

export const patchSecurityPhone = async (req: Request, res: Response) => {
  try {
    const user = requireUser(req);
    const meta = getClientMeta(req);
    ok(
      res,
      await updateSecurityPhone(user.userId, req.body || {}, meta),
      "Phone updated"
    );
  } catch (error) {
    handleRouteError(error, res);
  }
};

export const patchSecurityEmail = async (req: Request, res: Response) => {
  try {
    const user = requireUser(req);
    const meta = getClientMeta(req);
    ok(
      res,
      await updatePrimaryEmail(user.userId, req.body || {}, meta),
      "Email updated"
    );
  } catch (error) {
    handleRouteError(error, res);
  }
};

export const patchRecoveryEmail = async (req: Request, res: Response) => {
  try {
    const user = requireUser(req);
    ok(
      res,
      await updateRecoveryEmail(user.userId, req.body || {}),
      "Recovery email updated"
    );
  } catch (error) {
    handleRouteError(error, res);
  }
};
