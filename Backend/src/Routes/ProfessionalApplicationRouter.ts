import { NextFunction, Request, Response, Router } from "express";
import { decodeToken } from "../helpers/middleware/VerifyToken";
import {
  myApplications,
  submitApplication,
} from "../Controllers/ProfessionalApplicationController";

const router = Router();

const handle =
  (fn: (req: Request, res: Response) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res)).catch(next);
  };

router.use(decodeToken);
router.post("/", handle(submitApplication));
router.get("/mine", handle(myApplications));

export default router;
