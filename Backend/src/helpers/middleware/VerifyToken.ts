import { NextFunction, Request } from "express";
import { UserData, verifyAccessToken } from "../GenerateToken";

export interface CustomUserRequest extends Request {
  user?: UserData;
}

export const decodeToken = (req: any, res: any, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res
        .status(401)
        .json({ isSuccess: false, message: "Access Denied. No Token Provided." });
    }

    const payload = verifyAccessToken(token);
    req.user = { userId: payload.userId, email: payload.email, role: payload.role };
    next();
  } catch (error) {
    return res.status(403).json({ isSuccess: false, message: "Invalid Token" });
  }
};