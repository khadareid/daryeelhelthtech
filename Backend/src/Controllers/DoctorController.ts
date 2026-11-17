import { Request, Response } from "express";
import {
  adminCreateDoctor,
  adminDeleteDoctor,
  adminListDoctors,
  adminUpdateDoctor,
  adminVerifyDoctor,
  getDoctorById,
  getMyDoctorProfile,
  listDoctors,
  listPendingDoctors,
  upsertMyDoctorProfile,
} from "../services/doctor.service";
import {
  copyMyScheduleDay,
  createMySchedule,
  createMyTimeOff,
  deleteMySchedule,
  deleteMyTimeOff,
  getDoctorDayAvailability,
  listMySchedules,
  listMyTimeOff,
  updateMySchedule,
} from "../services/doctorSchedule.service";
import { created } from "../utils/response";
import { handleRouteError } from "../utils/errors";
import { requireUser } from "../utils/ownership";
import { ok } from "../utils/response";

export const list = async (req: Request, res: Response) => {
  try {
    ok(res, await listDoctors(req.query as Record<string, unknown>));
  } catch (error) {
    handleRouteError(error, res);
  }
};

export const getOne = async (req: Request, res: Response) => {
  try {
    ok(res, await getDoctorById(req.params.id));
  } catch (error) {
    handleRouteError(error, res);
  }
};

export const getMe = async (req: Request, res: Response) => {
  try {
    const user = requireUser(req);
    ok(res, await getMyDoctorProfile(user.userId));
  } catch (error) {
    handleRouteError(error, res);
  }
};

export const upsertMe = async (req: Request, res: Response) => {
  try {
    const user = requireUser(req);
    ok(
      res,
      await upsertMyDoctorProfile(user.userId, req.body || {}),
      "Doctor profile saved"
    );
  } catch (error) {
    handleRouteError(error, res);
  }
};

export const listMyAvailability = async (req: Request, res: Response) => {
  try {
    const user = requireUser(req);
    ok(res, await listMySchedules(user.userId));
  } catch (error) {
    handleRouteError(error, res);
  }
};

export const createMyAvailability = async (req: Request, res: Response) => {
  try {
    const user = requireUser(req);
    created(res, await createMySchedule(user.userId, req.body || {}), "Shift saved");
  } catch (error) {
    handleRouteError(error, res);
  }
};

export const updateMyAvailability = async (req: Request, res: Response) => {
  try {
    const user = requireUser(req);
    ok(
      res,
      await updateMySchedule(user.userId, req.params.id, req.body || {}),
      "Shift updated"
    );
  } catch (error) {
    handleRouteError(error, res);
  }
};

export const deleteMyAvailability = async (req: Request, res: Response) => {
  try {
    const user = requireUser(req);
    ok(res, await deleteMySchedule(user.userId, req.params.id), "Shift removed");
  } catch (error) {
    handleRouteError(error, res);
  }
};

export const copyMyAvailability = async (req: Request, res: Response) => {
  try {
    const user = requireUser(req);
    created(
      res,
      await copyMyScheduleDay(user.userId, req.body || {}),
      "Schedule copied"
    );
  } catch (error) {
    handleRouteError(error, res);
  }
};

export const listMyOffDays = async (req: Request, res: Response) => {
  try {
    const user = requireUser(req);
    ok(res, await listMyTimeOff(user.userId));
  } catch (error) {
    handleRouteError(error, res);
  }
};

export const createMyOffDay = async (req: Request, res: Response) => {
  try {
    const user = requireUser(req);
    created(res, await createMyTimeOff(user.userId, req.body || {}), "Time off saved");
  } catch (error) {
    handleRouteError(error, res);
  }
};

export const deleteMyOffDay = async (req: Request, res: Response) => {
  try {
    const user = requireUser(req);
    ok(res, await deleteMyTimeOff(user.userId, req.params.id), "Time off removed");
  } catch (error) {
    handleRouteError(error, res);
  }
};

export const getPublicAvailability = async (req: Request, res: Response) => {
  try {
    const date =
      typeof req.query.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(req.query.date)
        ? req.query.date
        : new Date().toISOString().slice(0, 10);
    ok(res, await getDoctorDayAvailability(req.params.id, date));
  } catch (error) {
    handleRouteError(error, res);
  }
};

export const verify = async (req: Request, res: Response) => {
  try {
    ok(
      res,
      await adminVerifyDoctor(req.params.id, req.body || {}),
      "Doctor verification updated"
    );
  } catch (error) {
    handleRouteError(error, res);
  }
};

export const pending = async (req: Request, res: Response) => {
  try {
    ok(res, await listPendingDoctors(req.query as Record<string, unknown>));
  } catch (error) {
    handleRouteError(error, res);
  }
};

export const adminList = async (req: Request, res: Response) => {
  try {
    ok(res, await adminListDoctors(req.query as Record<string, unknown>));
  } catch (error) {
    handleRouteError(error, res);
  }
};

export const adminCreate = async (req: Request, res: Response) => {
  try {
    created(res, await adminCreateDoctor(req.body || {}), "Doctor created");
  } catch (error) {
    handleRouteError(error, res);
  }
};

export const adminGet = async (req: Request, res: Response) => {
  try {
    ok(res, await getDoctorById(req.params.id));
  } catch (error) {
    handleRouteError(error, res);
  }
};

export const adminUpdate = async (req: Request, res: Response) => {
  try {
    ok(
      res,
      await adminUpdateDoctor(req.params.id, req.body || {}),
      "Doctor updated"
    );
  } catch (error) {
    handleRouteError(error, res);
  }
};

export const adminDelete = async (req: Request, res: Response) => {
  try {
    ok(
      res,
      await adminDeleteDoctor(req.params.id),
      "Doctor deactivated"
    );
  } catch (error) {
    handleRouteError(error, res);
  }
};
