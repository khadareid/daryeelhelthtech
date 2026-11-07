"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminAppointments = exports.deleteDoctor = exports.updateDoctor = exports.getDoctor = exports.createDoctor = exports.listDoctors = exports.verifyDoctor = exports.pendingDoctors = exports.resetUserPassword = exports.deleteUser = exports.updateUser = exports.createUser = exports.getUser = exports.listUsers = exports.auditLogs = exports.dashboard = void 0;
const UserController_1 = require("./UserController");
Object.defineProperty(exports, "createUser", { enumerable: true, get: function () { return UserController_1.adminCreate; } });
Object.defineProperty(exports, "deleteUser", { enumerable: true, get: function () { return UserController_1.adminDelete; } });
Object.defineProperty(exports, "getUser", { enumerable: true, get: function () { return UserController_1.adminGetUser; } });
Object.defineProperty(exports, "listUsers", { enumerable: true, get: function () { return UserController_1.adminListUsers; } });
Object.defineProperty(exports, "resetUserPassword", { enumerable: true, get: function () { return UserController_1.adminResetUserPassword; } });
Object.defineProperty(exports, "updateUser", { enumerable: true, get: function () { return UserController_1.adminUpdate; } });
const DoctorController_1 = require("./DoctorController");
Object.defineProperty(exports, "createDoctor", { enumerable: true, get: function () { return DoctorController_1.adminCreate; } });
Object.defineProperty(exports, "deleteDoctor", { enumerable: true, get: function () { return DoctorController_1.adminDelete; } });
Object.defineProperty(exports, "getDoctor", { enumerable: true, get: function () { return DoctorController_1.adminGet; } });
Object.defineProperty(exports, "listDoctors", { enumerable: true, get: function () { return DoctorController_1.adminList; } });
Object.defineProperty(exports, "updateDoctor", { enumerable: true, get: function () { return DoctorController_1.adminUpdate; } });
Object.defineProperty(exports, "pendingDoctors", { enumerable: true, get: function () { return DoctorController_1.pending; } });
Object.defineProperty(exports, "verifyDoctor", { enumerable: true, get: function () { return DoctorController_1.verify; } });
const AppointmentController_1 = require("./AppointmentController");
Object.defineProperty(exports, "adminAppointments", { enumerable: true, get: function () { return AppointmentController_1.list; } });
const admin_service_1 = require("../services/admin.service");
const errors_1 = require("../utils/errors");
const response_1 = require("../utils/response");
const dashboard = (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        (0, response_1.ok)(res, yield (0, admin_service_1.getDashboardStats)());
    }
    catch (error) {
        (0, errors_1.handleRouteError)(error, res);
    }
});
exports.dashboard = dashboard;
const auditLogs = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        (0, response_1.ok)(res, yield (0, admin_service_1.listAuditLogs)(req.query));
    }
    catch (error) {
        (0, errors_1.handleRouteError)(error, res);
    }
});
exports.auditLogs = auditLogs;
