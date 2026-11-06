import { Request, Response } from "express";
import { loginUser, registerUser } from "../services/auth.service";
import { getClientMeta } from "../services/audit.service";
import { handleRouteError } from "../utils/errors";

export const register = async (req: Request, res: Response) => {
  try {
    const result = await registerUser(req.body || {});
    res.status(201).json({
      isSuccess: true,
      message: "Registered successfully",
      result,
      ...result,
    });
  } catch (error) {
    handleRouteError(error, res, "Registration failed");
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const meta = getClientMeta(req);
    const result = await loginUser(req.body || {}, meta);
    res.status(200).json({
      isSuccess: true,
      message: "Login successful",
      result,
      ...result,
    });
  } catch (error) {
    handleRouteError(error, res, "Login failed");
  }
};
