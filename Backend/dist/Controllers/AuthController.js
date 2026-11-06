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
exports.login = exports.register = void 0;
const auth_service_1 = require("../services/auth.service");
const audit_service_1 = require("../services/audit.service");
const errors_1 = require("../utils/errors");
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield (0, auth_service_1.registerUser)(req.body || {});
        res.status(201).json(Object.assign({ isSuccess: true, message: "Registered successfully", result }, result));
    }
    catch (error) {
        (0, errors_1.handleRouteError)(error, res, "Registration failed");
    }
});
exports.register = register;
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const meta = (0, audit_service_1.getClientMeta)(req);
        const result = yield (0, auth_service_1.loginUser)(req.body || {}, meta);
        res.status(200).json(Object.assign({ isSuccess: true, message: "Login successful", result }, result));
    }
    catch (error) {
        (0, errors_1.handleRouteError)(error, res, "Login failed");
    }
});
exports.login = login;
