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
exports.adminDelete = exports.adminUpdate = exports.adminGet = exports.adminCreate = exports.adminList = exports.pending = exports.verify = exports.upsertMe = exports.getMe = exports.getOne = exports.list = void 0;
const doctor_service_1 = require("../services/doctor.service");
const response_1 = require("../utils/response");
const errors_1 = require("../utils/errors");
const ownership_1 = require("../utils/ownership");
const response_2 = require("../utils/response");
const list = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        (0, response_2.ok)(res, yield (0, doctor_service_1.listDoctors)(req.query));
    }
    catch (error) {
        (0, errors_1.handleRouteError)(error, res);
    }
});
exports.list = list;
const getOne = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        (0, response_2.ok)(res, yield (0, doctor_service_1.getDoctorById)(req.params.id));
    }
    catch (error) {
        (0, errors_1.handleRouteError)(error, res);
    }
});
exports.getOne = getOne;
const getMe = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = (0, ownership_1.requireUser)(req);
        (0, response_2.ok)(res, yield (0, doctor_service_1.getMyDoctorProfile)(user.userId));
    }
    catch (error) {
        (0, errors_1.handleRouteError)(error, res);
    }
});
exports.getMe = getMe;
const upsertMe = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = (0, ownership_1.requireUser)(req);
        (0, response_2.ok)(res, yield (0, doctor_service_1.upsertMyDoctorProfile)(user.userId, req.body || {}), "Doctor profile saved");
    }
    catch (error) {
        (0, errors_1.handleRouteError)(error, res);
    }
});
exports.upsertMe = upsertMe;
const verify = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        (0, response_2.ok)(res, yield (0, doctor_service_1.adminVerifyDoctor)(req.params.id, req.body || {}), "Doctor verification updated");
    }
    catch (error) {
        (0, errors_1.handleRouteError)(error, res);
    }
});
exports.verify = verify;
const pending = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        (0, response_2.ok)(res, yield (0, doctor_service_1.listPendingDoctors)(req.query));
    }
    catch (error) {
        (0, errors_1.handleRouteError)(error, res);
    }
});
exports.pending = pending;
const adminList = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        (0, response_2.ok)(res, yield (0, doctor_service_1.adminListDoctors)(req.query));
    }
    catch (error) {
        (0, errors_1.handleRouteError)(error, res);
    }
});
exports.adminList = adminList;
const adminCreate = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        (0, response_1.created)(res, yield (0, doctor_service_1.adminCreateDoctor)(req.body || {}), "Doctor created");
    }
    catch (error) {
        (0, errors_1.handleRouteError)(error, res);
    }
});
exports.adminCreate = adminCreate;
const adminGet = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        (0, response_2.ok)(res, yield (0, doctor_service_1.getDoctorById)(req.params.id));
    }
    catch (error) {
        (0, errors_1.handleRouteError)(error, res);
    }
});
exports.adminGet = adminGet;
const adminUpdate = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        (0, response_2.ok)(res, yield (0, doctor_service_1.adminUpdateDoctor)(req.params.id, req.body || {}), "Doctor updated");
    }
    catch (error) {
        (0, errors_1.handleRouteError)(error, res);
    }
});
exports.adminUpdate = adminUpdate;
const adminDelete = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        (0, response_2.ok)(res, yield (0, doctor_service_1.adminDeleteDoctor)(req.params.id), "Doctor deactivated");
    }
    catch (error) {
        (0, errors_1.handleRouteError)(error, res);
    }
});
exports.adminDelete = adminDelete;
