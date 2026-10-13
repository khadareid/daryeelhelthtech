"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ROLE_PERMISSIONS = exports.superAdminOrAdmin = exports.superAdminOnly = exports.adminOnly = exports.authorizeRoles = void 0;
const client_1 = require("@prisma/client");
// Administrative roles
const ADMIN_ROLES = [
    client_1.Role.SUPER_ADMIN,
    client_1.Role.ADMIN,
];
// Generic role authorization middleware
const authorizeRoles = (...allowedRoles) => (req, res, next) => {
    const user = req.user;
    if (!user) {
        res.status(401).json({
            message: "Unauthorized",
            isSuccess: false,
        });
        return;
    }
    const role = user.role;
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
exports.authorizeRoles = authorizeRoles;
// SUPER_ADMIN + ADMIN
exports.adminOnly = (0, exports.authorizeRoles)(client_1.Role.SUPER_ADMIN, client_1.Role.ADMIN);
// SUPER_ADMIN only
exports.superAdminOnly = (0, exports.authorizeRoles)(client_1.Role.SUPER_ADMIN);
// SUPER_ADMIN + ADMIN
exports.superAdminOrAdmin = (0, exports.authorizeRoles)(client_1.Role.SUPER_ADMIN, client_1.Role.ADMIN);
// Role permissions
exports.ROLE_PERMISSIONS = {
    // Audit logs
    "audit-logs": [
        client_1.Role.SUPER_ADMIN,
        client_1.Role.ADMIN,
    ],
    // User management
    users: [
        client_1.Role.SUPER_ADMIN,
        client_1.Role.ADMIN,
    ],
    // Financial reports
    "financial-reports": [
        client_1.Role.SUPER_ADMIN,
        client_1.Role.ADMIN,
    ],
    // Branch management
    branches: [
        client_1.Role.SUPER_ADMIN,
        client_1.Role.ADMIN,
    ],
    // System settings
    settings: [
        client_1.Role.SUPER_ADMIN,
        client_1.Role.ADMIN,
    ],
    // Patients
    patients: [
        client_1.Role.SUPER_ADMIN,
        client_1.Role.ADMIN,
        client_1.Role.DOCTOR,
        client_1.Role.NURSE,
        client_1.Role.MIDWIFE,
        client_1.Role.RECEPTIONIST,
    ],
    // Medical records
    "medical-records": [
        client_1.Role.SUPER_ADMIN,
        client_1.Role.ADMIN,
        client_1.Role.DOCTOR,
        client_1.Role.NURSE,
        client_1.Role.MIDWIFE,
    ],
    // Appointments
    appointments: [
        client_1.Role.SUPER_ADMIN,
        client_1.Role.ADMIN,
        client_1.Role.DOCTOR,
        client_1.Role.NURSE,
        client_1.Role.MIDWIFE,
        client_1.Role.RECEPTIONIST,
        client_1.Role.PATIENT,
    ],
    // Laboratory
    laboratory: [
        client_1.Role.SUPER_ADMIN,
        client_1.Role.ADMIN,
        client_1.Role.DOCTOR,
        client_1.Role.LAB_TECH,
    ],
    // Pharmacy
    pharmacy: [
        client_1.Role.SUPER_ADMIN,
        client_1.Role.ADMIN,
        client_1.Role.DOCTOR,
        client_1.Role.PHARMACIST,
    ],
    // Prescriptions
    prescriptions: [
        client_1.Role.SUPER_ADMIN,
        client_1.Role.ADMIN,
        client_1.Role.DOCTOR,
        client_1.Role.PHARMACIST,
    ],
};
