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
exports.deleteMe = exports.adminDelete = exports.adminResetUserPassword = exports.adminUpdate = exports.adminCreate = exports.adminGetUser = exports.adminListUsers = exports.changeMyPassword = exports.updateProfile = exports.me = void 0;
const user_service_1 = require("../services/user.service");
const errors_1 = require("../utils/errors");
const ownership_1 = require("../utils/ownership");
const response_1 = require("../utils/response");
const me = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = (0, ownership_1.requireUser)(req);
        (0, response_1.ok)(res, yield (0, user_service_1.getMe)(user.userId));
    }
    catch (error) {
        (0, errors_1.handleRouteError)(error, res);
    }
});
exports.me = me;
const updateProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = (0, ownership_1.requireUser)(req);
        (0, response_1.ok)(res, yield (0, user_service_1.updateMe)(user.userId, req.body || {}), "Profile updated");
    }
    catch (error) {
        (0, errors_1.handleRouteError)(error, res);
    }
});
exports.updateProfile = updateProfile;
const changeMyPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = (0, ownership_1.requireUser)(req);
        (0, response_1.ok)(res, yield (0, user_service_1.changePassword)(user.userId, req.body || {}), "Password changed");
    }
    catch (error) {
        (0, errors_1.handleRouteError)(error, res);
    }
});
exports.changeMyPassword = changeMyPassword;
const adminListUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        (0, response_1.ok)(res, yield (0, user_service_1.listUsers)(req.query));
    }
    catch (error) {
        (0, errors_1.handleRouteError)(error, res);
    }
});
exports.adminListUsers = adminListUsers;
const adminGetUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        (0, response_1.ok)(res, yield (0, user_service_1.getUserById)(req.params.id));
    }
    catch (error) {
        (0, errors_1.handleRouteError)(error, res);
    }
});
exports.adminGetUser = adminGetUser;
const adminCreate = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const actor = (0, ownership_1.requireUser)(req);
        (0, response_1.created)(res, yield (0, user_service_1.adminCreateUser)(req.body || {}, {
            userId: actor.userId,
            role: String(actor.role),
        }), "User created");
    }
    catch (error) {
        (0, errors_1.handleRouteError)(error, res);
    }
});
exports.adminCreate = adminCreate;
const adminUpdate = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const actor = (0, ownership_1.requireUser)(req);
        (0, response_1.ok)(res, yield (0, user_service_1.adminUpdateUser)(req.params.id, req.body || {}, {
            userId: actor.userId,
            role: String(actor.role),
        }), "User updated");
    }
    catch (error) {
        (0, errors_1.handleRouteError)(error, res);
    }
});
exports.adminUpdate = adminUpdate;
const adminResetUserPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const actor = (0, ownership_1.requireUser)(req);
        (0, response_1.ok)(res, yield (0, user_service_1.adminResetPassword)(req.params.id, req.body || {}, {
            userId: actor.userId,
            role: String(actor.role),
        }), "Password updated");
    }
    catch (error) {
        (0, errors_1.handleRouteError)(error, res);
    }
});
exports.adminResetUserPassword = adminResetUserPassword;
const adminDelete = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const actor = (0, ownership_1.requireUser)(req);
        (0, response_1.ok)(res, yield (0, user_service_1.softDeleteUser)(req.params.id, { userId: actor.userId, role: String(actor.role) }, req.body || {}), "User deleted");
    }
    catch (error) {
        (0, errors_1.handleRouteError)(error, res);
    }
});
exports.adminDelete = adminDelete;
const deleteMe = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        (0, response_1.ok)(res, yield (0, user_service_1.softDeleteUser)(user.userId), "Account deleted");
    }
    catch (error) {
        (0, errors_1.handleRouteError)(error, res);
    }
});
exports.deleteMe = deleteMe;
