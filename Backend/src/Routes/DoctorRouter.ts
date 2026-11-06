import { Router } from "express";
import {
  getMe,
  getOne,
  list,
  pending,
  upsertMe,
  verify,
} from "../Controllers/DoctorController";
import { decodeToken } from "../helpers/middleware/VerifyToken";

export const publicDoctorRouter = Router();
publicDoctorRouter.get("/", list);
publicDoctorRouter.get("/:id", getOne);

export const doctorSelfRouter = Router();
doctorSelfRouter.use(decodeToken);
doctorSelfRouter.get("/me", getMe);
doctorSelfRouter.put("/me", upsertMe);
doctorSelfRouter.post("/me", upsertMe);

export const adminDoctorRouter = Router();
adminDoctorRouter.get("/pending", pending);
adminDoctorRouter.patch("/:id/verify", verify);
adminDoctorRouter.put("/:id/verify", verify);

export default publicDoctorRouter;
