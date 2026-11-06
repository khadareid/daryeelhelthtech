import { Request, Response } from "express";
import {
  getEmergencyCard,
  upsertEmergencyCard,
} from "../services/emergencyCard.service";
import { handleRouteError } from "../utils/errors";
import { requireUser, resolveTargetUserId } from "../utils/ownership";
import { ok } from "../utils/response";

export const getMine = async (req: Request, res: Response) => {
  try {
    const user = requireUser(req);
    const userId = resolveTargetUserId(
      req,
      typeof req.query.userId === "string" ? req.query.userId : undefined
    );
    void user;
    ok(res, await getEmergencyCard(userId));
  } catch (error) {
    handleRouteError(error, res);
  }
};

export const upsertMine = async (req: Request, res: Response) => {
  try {
    const userId = resolveTargetUserId(
      req,
      typeof req.body?.userId === "string" ? req.body.userId : undefined
    );
    ok(
      res,
      await upsertEmergencyCard(userId, req.body || {}),
      "Emergency card saved"
    );
  } catch (error) {
    handleRouteError(error, res);
  }
};
