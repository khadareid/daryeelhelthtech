import { NextFunction, Request, Response } from "express";
import { isFeatureAllowed } from "../../services/featureFlag.service";

export const requireFeature =
  (key: string, action = "read") =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const allowed = await isFeatureAllowed({
        key,
        userId: user?.userId || user?.userid,
        role: user?.role,
        action,
      });
      if (!allowed) {
        res.status(403).json({
          isSuccess: false,
          message: `Feature "${key}" is not available`,
        });
        return;
      }
      next();
    } catch (error) {
      next(error);
    }
  };
