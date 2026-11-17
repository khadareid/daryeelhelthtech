import { Router } from "express";
import {
  copyMyAvailability,
  createMyAvailability,
  createMyOffDay,
  deleteMyAvailability,
  deleteMyOffDay,
  getMe,
  getOne,
  getPublicAvailability,
  list,
  listMyAvailability,
  listMyOffDays,
  pending,
  updateMyAvailability,
  upsertMe,
  verify,
} from "../Controllers/DoctorController";
import { decodeToken } from "../helpers/middleware/VerifyToken";

export const publicDoctorRouter = Router();
publicDoctorRouter.get("/", list);
publicDoctorRouter.get("/:id/availability", getPublicAvailability);
publicDoctorRouter.get("/:id", getOne);

export const doctorSelfRouter = Router();
doctorSelfRouter.use(decodeToken);
doctorSelfRouter.get("/me", getMe);
doctorSelfRouter.put("/me", upsertMe);
doctorSelfRouter.post("/me", upsertMe);
doctorSelfRouter.get("/me/availability", listMyAvailability);
doctorSelfRouter.post("/me/availability", createMyAvailability);
doctorSelfRouter.post("/me/availability/copy", copyMyAvailability);
doctorSelfRouter.patch("/me/availability/:id", updateMyAvailability);
doctorSelfRouter.delete("/me/availability/:id", deleteMyAvailability);
doctorSelfRouter.get("/me/time-off", listMyOffDays);
doctorSelfRouter.post("/me/time-off", createMyOffDay);
doctorSelfRouter.delete("/me/time-off/:id", deleteMyOffDay);

export const adminDoctorRouter = Router();
adminDoctorRouter.get("/pending", pending);
adminDoctorRouter.patch("/:id/verify", verify);
adminDoctorRouter.put("/:id/verify", verify);

export default publicDoctorRouter;
