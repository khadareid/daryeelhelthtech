import { NextFunction, Request, Response, Router } from "express";
import { decodeToken } from "../helpers/middleware/VerifyToken";
import {
  createDailyHealthLog,
  getTodayDailyHealthLog,
  getDailyHealthLogByDate,
  getDailyHealthHistory,
  updateDailyHealthLog,
  deleteDailyHealthLog,
} from "../Controllers/dailyHealthLog.controller";

const router = Router();

const handle =
  (fn: (req: Request, res: Response) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res)).catch(next);
  };

router.use(decodeToken);

router.post("/", handle(createDailyHealthLog));
router.get("/today", handle(getTodayDailyHealthLog));
router.get("/history", handle(getDailyHealthHistory));
router.get("/:date", handle(getDailyHealthLogByDate));
router.put("/:date", handle(updateDailyHealthLog));
router.delete("/:date", handle(deleteDailyHealthLog));

export default router;
