import { Request, Response } from "express";
import {
  createConsultation,
  getConsultation,
  listConsultations,
  updateConsultation,
} from "../services/consultation.service";
import { handleRouteError } from "../utils/errors";
import { requireUser } from "../utils/ownership";
import { created, ok } from "../utils/response";

export const list = async (req: Request, res: Response) => {
  try {
    const user = requireUser(req);
    ok(res, await listConsultations(user, req.query as Record<string, unknown>));
  } catch (error) {
    handleRouteError(error, res);
  }
};

export const getOne = async (req: Request, res: Response) => {
  try {
    const user = requireUser(req);
    ok(res, await getConsultation(req.params.id, user));
  } catch (error) {
    handleRouteError(error, res);
  }
};

export const create = async (req: Request, res: Response) => {
  try {
    const user = requireUser(req);
    created(res, await createConsultation(user, req.body || {}));
  } catch (error) {
    handleRouteError(error, res);
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const user = requireUser(req);
    ok(
      res,
      await updateConsultation(req.params.id, user, req.body || {}),
      "Updated"
    );
  } catch (error) {
    handleRouteError(error, res);
  }
};
