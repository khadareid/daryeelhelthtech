import { NextFunction, Request, Response } from "express";
import { Role } from "@prisma/client";
import { CustomUserRequest } from "./VerifyToken";

export const authorizeRoles =
  (...allowedRoles: Role[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    const user = (req as CustomUserRequest).user;

    if (!user) {
      res.status(401).json({ message: "Unauthorized", isSuccess: false });
      return;
    }

    if (!user.role || !allowedRoles.includes(user.role as Role)) {
      res.status(403).json({
        message: "You do not have permission to perform this action",
        isSuccess: false,
      });
      return;
    }

    next();
  };

export const adminOnly = authorizeRoles(Role.SUPER_ADMIN, Role.ADMIN);
export const superAdminOnly = authorizeRoles(Role.SUPER_ADMIN);
export const superAdminOrAdmin = authorizeRoles(Role.SUPER_ADMIN, Role.ADMIN);

export const isAdminRole = (role?: Role | string | null) =>
  role === Role.ADMIN || role === Role.SUPER_ADMIN;
