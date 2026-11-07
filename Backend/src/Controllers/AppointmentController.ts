import { Request, Response } from "express";
import {
  createAppointment,
  deleteAppointment,
  getAppointment,
  listAppointments,
  updateAppointment,
} from "../services/appointment.service";
import { handleRouteError } from "../utils/errors";
import { requireUser } from "../utils/ownership";
import { created, ok } from "../utils/response";

export const list = async (req: Request, res: Response) => {
  try {
    const user = requireUser(req);
    ok(res, await listAppointments(user, req.query as Record<string, unknown>));
  } catch (error) {
    handleRouteError(error, res);
  }
};

export const getOne = async (req: Request, res: Response) => {
  try {
    const user = requireUser(req);
    ok(res, await getAppointment(req.params.id, user));
  } catch (error) {
    handleRouteError(error, res);
  }
};

export const create = async (req: Request, res: Response) => {
  try {
    const user = requireUser(req);
    created(res, await createAppointment(user, req.body || {}));
  } catch (error) {
    handleRouteError(error, res);
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const user = requireUser(req);
    ok(res, await updateAppointment(req.params.id, user, req.body || {}), "Updated");
  } catch (error) {
    handleRouteError(error, res);
  }
};

export const remove = async (req: Request, res: Response) => {
  try {
    const user = requireUser(req);
    ok(res, await deleteAppointment(req.params.id, user), "Deleted");
  } catch (error) {
    handleRouteError(error, res);
  }
};
