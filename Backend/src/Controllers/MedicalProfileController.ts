import { Request, Response } from "express";
import {
  getMedicalProfile,
  upsertMedicalProfile,
} from "../services/medicalProfile.service";
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
    // non-admin resolveTargetUserId ignores query — good
    void user;
    ok(res, await getMedicalProfile(userId));
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
      await upsertMedicalProfile(userId, req.body || {}),
      "Medical profile saved"
    );
  } catch (error) {
    handleRouteError(error, res);
  }
};
