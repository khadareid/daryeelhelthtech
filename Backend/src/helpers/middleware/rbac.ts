import { NextFunction, Request, Response } from "express";
import { Role } from "@prisma/client";

import { CustomUserRequest } from "./VerifyToken";

// Administrative roles
const ADMIN_ROLES: Role[] = [
  Role.SUPER_ADMIN,
  Role.ADMIN,
];

// Generic role authorization middleware
export const authorizeRoles =
  (...allowedRoles: Role[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    const user = (req as CustomUserRequest).user;

    if (!user) {
      res.status(401).json({
        message: "Unauthorized",
        isSuccess: false,
      });
      return;
    }

    const role = user.role as Role | undefined;

    if (!role) {
      res.status(401).json({
        message: "User role is missing",
        isSuccess: false,
      });
      return;
    }

    if (!allowedRoles.includes(role)) {
      res.status(403).json({
        message: "You do not have permission to perform this action",
        isSuccess: false,
      });
      return;
    }

    next();
  };

// SUPER_ADMIN + ADMIN
export const adminOnly = authorizeRoles(
  Role.SUPER_ADMIN,
  Role.ADMIN
);

// SUPER_ADMIN only
export const superAdminOnly = authorizeRoles(
  Role.SUPER_ADMIN
);

// SUPER_ADMIN + ADMIN
export const superAdminOrAdmin = authorizeRoles(
  Role.SUPER_ADMIN,
  Role.ADMIN
);

// Role permissions
export const ROLE_PERMISSIONS: Record<string, Role[]> = {
  // Audit logs
  "audit-logs": [
    Role.SUPER_ADMIN,
    Role.ADMIN,
  ],

  // User management
  users: [
    Role.SUPER_ADMIN,
    Role.ADMIN,
  ],

  // Financial reports
  "financial-reports": [
    Role.SUPER_ADMIN,
    Role.ADMIN,
  ],

  // Branch management
  branches: [
    Role.SUPER_ADMIN,
    Role.ADMIN,
  ],

  // System settings
  settings: [
    Role.SUPER_ADMIN,
    Role.ADMIN,
  ],

  // Patients
  patients: [
    Role.SUPER_ADMIN,
    Role.ADMIN,
    Role.DOCTOR,
    Role.NURSE,
    Role.MIDWIFE,
    Role.RECEPTIONIST,
  ],

  // Medical records
  "medical-records": [
    Role.SUPER_ADMIN,
    Role.ADMIN,
    Role.DOCTOR,
    Role.NURSE,
    Role.MIDWIFE,
  ],

  // Appointments
  appointments: [
    Role.SUPER_ADMIN,
    Role.ADMIN,
    Role.DOCTOR,
    Role.NURSE,
    Role.MIDWIFE,
    Role.RECEPTIONIST,
    Role.PATIENT,
  ],

  // Laboratory
  laboratory: [
    Role.SUPER_ADMIN,
    Role.ADMIN,
    Role.DOCTOR,
    Role.LAB_TECH,
  ],

  // Pharmacy
  pharmacy: [
    Role.SUPER_ADMIN,
    Role.ADMIN,
    Role.DOCTOR,
    Role.PHARMACIST,
  ],

  // Prescriptions
  prescriptions: [
    Role.SUPER_ADMIN,
    Role.ADMIN,
    Role.DOCTOR,
    Role.PHARMACIST,
  ],
};