import { Request, Response } from "express";
import {
  adminCreate,
  adminDelete,
  adminGetUser,
  adminListUsers,
  adminResetUserPassword,
  adminUpdate,
} from "./UserController";
import {
  adminCreate as createDoctor,
  adminDelete as deleteDoctor,
  adminGet as getDoctor,
  adminList as listDoctorsAdmin,
  adminUpdate as updateDoctor,
  pending,
  verify,
} from "./DoctorController";
import { list as listAppointments } from "./AppointmentController";
import { getDashboardStats, listAuditLogs } from "../services/admin.service";
import { handleRouteError } from "../utils/errors";
import { ok } from "../utils/response";

export const dashboard = async (_req: Request, res: Response) => {
  try {
    ok(res, await getDashboardStats());
  } catch (error) {
    handleRouteError(error, res);
  }
};

export const auditLogs = async (req: Request, res: Response) => {
  try {
    ok(res, await listAuditLogs(req.query as Record<string, unknown>));
  } catch (error) {
    handleRouteError(error, res);
  }
};

export {
  adminListUsers as listUsers,
  adminGetUser as getUser,
  adminCreate as createUser,
  adminUpdate as updateUser,
  adminDelete as deleteUser,
  adminResetUserPassword as resetUserPassword,
  pending as pendingDoctors,
  verify as verifyDoctor,
  listDoctorsAdmin as listDoctors,
  createDoctor,
  getDoctor,
  updateDoctor,
  deleteDoctor,
  listAppointments as adminAppointments,
};
