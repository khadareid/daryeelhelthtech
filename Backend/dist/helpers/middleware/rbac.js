"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAdminRole = exports.superAdminOrAdmin = exports.superAdminOnly = exports.adminOnly = exports.authorizeRoles = void 0;
const client_1 = require("@prisma/client");
const authorizeRoles = (...allowedRoles) => (req, res, next) => {
    const user = req.user;
    if (!user) {
        res.status(401).json({ message: "Unauthorized", isSuccess: false });
        return;
    }
    if (!user.role || !allowedRoles.includes(user.role)) {
        res.status(403).json({
            message: "You do not have permission to perform this action",
            isSuccess: false,
        });
        return;
    }
    next();
};
exports.authorizeRoles = authorizeRoles;
exports.adminOnly = (0, exports.authorizeRoles)(client_1.Role.SUPER_ADMIN, client_1.Role.ADMIN);
exports.superAdminOnly = (0, exports.authorizeRoles)(client_1.Role.SUPER_ADMIN);
exports.superAdminOrAdmin = (0, exports.authorizeRoles)(client_1.Role.SUPER_ADMIN, client_1.Role.ADMIN);
const isAdminRole = (role) => role === client_1.Role.ADMIN || role === client_1.Role.SUPER_ADMIN;
exports.isAdminRole = isAdminRole;
