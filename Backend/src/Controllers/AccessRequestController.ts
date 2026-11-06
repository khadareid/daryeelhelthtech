import { Request, Response } from "express";
import {
  createAccessRequest,
  listAccessRequests,
  respondAccessRequest,
} from "../services/accessRequest.service";
import { handleRouteError } from "../utils/errors";
import { requireUser } from "../utils/ownership";
import { created, ok } from "../utils/response";

export const list = async (req: Request, res: Response) => {
  try {
    const user = requireUser(req);
    ok(res, await listAccessRequests(user, req.query as Record<string, unknown>));
  } catch (error) {
    handleRouteError(error, res);
  }
};

export const create = async (req: Request, res: Response) => {
  try {
    const user = requireUser(req);
    created(res, await createAccessRequest(user, req.body || {}));
  } catch (error) {
    handleRouteError(error, res);
  }
};

export const respond = async (req: Request, res: Response) => {
  try {
    const user = requireUser(req);
    ok(
      res,
      await respondAccessRequest(req.params.id, user, req.body || {}),
      "Updated"
    );
  } catch (error) {
    handleRouteError(error, res);
  }
};
