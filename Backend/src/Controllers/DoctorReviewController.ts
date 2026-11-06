import { Request, Response } from "express";
import {
  createDoctorReview,
  deleteDoctorReview,
  listDoctorReviews,
  updateDoctorReview,
} from "../services/doctorReview.service";
import { handleRouteError } from "../utils/errors";
import { requireUser } from "../utils/ownership";
import { created, ok } from "../utils/response";

export const list = async (req: Request, res: Response) => {
  try {
    ok(res, await listDoctorReviews(req.query as Record<string, unknown>));
  } catch (error) {
    handleRouteError(error, res);
  }
};

export const create = async (req: Request, res: Response) => {
  try {
    const user = requireUser(req);
    created(res, await createDoctorReview(user, req.body || {}));
  } catch (error) {
    handleRouteError(error, res);
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const user = requireUser(req);
    ok(
      res,
      await updateDoctorReview(req.params.id, user, req.body || {}),
      "Updated"
    );
  } catch (error) {
    handleRouteError(error, res);
  }
};

export const remove = async (req: Request, res: Response) => {
  try {
    const user = requireUser(req);
    ok(res, await deleteDoctorReview(req.params.id, user), "Deleted");
  } catch (error) {
    handleRouteError(error, res);
  }
};
