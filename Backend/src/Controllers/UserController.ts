import { Request, Response } from "express";
import { CustomUserRequest } from "../helpers/middleware/VerifyToken";
import {
  adminCreateUser,
  adminResetPassword,
  adminUpdateUser,
  changePassword,
  getMe,
  getUserById,
  listUsers,
  softDeleteUser,
  updateMe,
} from "../services/user.service";
import { handleRouteError } from "../utils/errors";
import { requireUser } from "../utils/ownership";
import { created, ok } from "../utils/response";

export const me = async (req: Request, res: Response) => {
  try {
    const user = requireUser(req);
    ok(res, await getMe(user.userId));
  } catch (error) {
    handleRouteError(error, res);
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const user = requireUser(req);
    ok(res, await updateMe(user.userId, req.body || {}), "Profile updated");
  } catch (error) {
    handleRouteError(error, res);
  }
};

export const changeMyPassword = async (req: Request, res: Response) => {
  try {
    const user = requireUser(req);
    ok(res, await changePassword(user.userId, req.body || {}), "Password changed");
  } catch (error) {
    handleRouteError(error, res);
  }
};

export const adminListUsers = async (req: Request, res: Response) => {
  try {
    ok(res, await listUsers(req.query as Record<string, unknown>));
  } catch (error) {
    handleRouteError(error, res);
  }
};

export const adminGetUser = async (req: Request, res: Response) => {
  try {
    ok(res, await getUserById(req.params.id));
  } catch (error) {
    handleRouteError(error, res);
  }
};

export const adminCreate = async (req: Request, res: Response) => {
  try {
    const actor = requireUser(req);
    created(
      res,
      await adminCreateUser(req.body || {}, {
        userId: actor.userId,
        role: String(actor.role),
      }),
      "User created"
    );
  } catch (error) {
    handleRouteError(error, res);
  }
};

export const adminUpdate = async (req: Request, res: Response) => {
  try {
    const actor = requireUser(req);
    ok(
      res,
      await adminUpdateUser(req.params.id, req.body || {}, {
        userId: actor.userId,
        role: String(actor.role),
      }),
      "User updated"
    );
  } catch (error) {
    handleRouteError(error, res);
  }
};

export const adminResetUserPassword = async (req: Request, res: Response) => {
  try {
    const actor = requireUser(req);
    ok(
      res,
      await adminResetPassword(req.params.id, req.body || {}, {
        userId: actor.userId,
        role: String(actor.role),
      }),
      "Password updated"
    );
  } catch (error) {
    handleRouteError(error, res);
  }
};

export const adminDelete = async (req: Request, res: Response) => {
  try {
    const actor = requireUser(req);
    ok(
      res,
      await softDeleteUser(
        req.params.id,
        { userId: actor.userId, role: String(actor.role) },
        req.body || {}
      ),
      "User deleted"
    );
  } catch (error) {
    handleRouteError(error, res);
  }
};

export const deleteMe = async (req: Request, res: Response) => {
  try {
    const user = (req as CustomUserRequest).user!;
    ok(res, await softDeleteUser(user.userId), "Account deleted");
  } catch (error) {
    handleRouteError(error, res);
  }
};
