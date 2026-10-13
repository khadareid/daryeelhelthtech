import { NextFunction, Request, Response, Router } from "express";
import { decodeToken } from "../helpers/middleware/VerifyToken";
import {
  cancelAppointment,
  createAppointment,
  listMyAppointments,
} from "../Controllers/AppointmentController";

const router = Router();

const handle =
  (fn: (req: Request, res: Response) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res)).catch(next);
  };

router.use(decodeToken);

router.post("/", handle(createAppointment));
router.get("/", handle(listMyAppointments));
router.patch("/:id/cancel", handle(cancelAppointment));

export default router;
