import { Request, Response } from "express";
import {
  createPayment,
  getPayment,
  listPayments,
  updatePayment,
} from "../services/payment.service";
import { handleRouteError } from "../utils/errors";
import { requireUser } from "../utils/ownership";
import { created, ok } from "../utils/response";

export const list = async (req: Request, res: Response) => {
  try {
    const user = requireUser(req);
    ok(res, await listPayments(user, req.query as Record<string, unknown>));
  } catch (error) {
    handleRouteError(error, res);
  }
};

export const getOne = async (req: Request, res: Response) => {
  try {
    const user = requireUser(req);
    ok(res, await getPayment(req.params.id, user));
  } catch (error) {
    handleRouteError(error, res);
  }
};

export const create = async (req: Request, res: Response) => {
  try {
    const user = requireUser(req);
    created(res, await createPayment(user, req.body || {}));
  } catch (error) {
    handleRouteError(error, res);
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const user = requireUser(req);
    ok(res, await updatePayment(req.params.id, user, req.body || {}), "Updated");
  } catch (error) {
    handleRouteError(error, res);
  }
};
