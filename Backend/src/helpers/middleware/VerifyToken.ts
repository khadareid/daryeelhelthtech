import { NextFunction, Request, Response } from "express";
import { UserData, verifyAccessToken } from "../GenerateToken";

export interface CustomUserRequest extends Request {
  user?: UserData;
}

export const decodeToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      res.status(401).json({
        isSuccess: false,
        message: "Access Denied. No Token Provided.",
      });
      return;
    }

    const payload = verifyAccessToken(token);
    (req as CustomUserRequest).user = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    };
    next();
  } catch {
    res.status(403).json({ isSuccess: false, message: "Invalid Token" });
  }
};

export const optionalDecodeToken = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (token) {
      const payload = verifyAccessToken(token);
      (req as CustomUserRequest).user = {
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
      };
    }
  } catch {
    // ignore invalid optional tokens
  }
  next();
};
