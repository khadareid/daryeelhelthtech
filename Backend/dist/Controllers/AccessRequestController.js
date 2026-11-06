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
exports.respond = exports.create = exports.list = void 0;
const accessRequest_service_1 = require("../services/accessRequest.service");
const errors_1 = require("../utils/errors");
const ownership_1 = require("../utils/ownership");
const response_1 = require("../utils/response");
const list = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = (0, ownership_1.requireUser)(req);
        (0, response_1.ok)(res, yield (0, accessRequest_service_1.listAccessRequests)(user, req.query));
    }
    catch (error) {
        (0, errors_1.handleRouteError)(error, res);
    }
});
exports.list = list;
const create = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = (0, ownership_1.requireUser)(req);
        (0, response_1.created)(res, yield (0, accessRequest_service_1.createAccessRequest)(user, req.body || {}));
    }
    catch (error) {
        (0, errors_1.handleRouteError)(error, res);
    }
});
exports.create = create;
const respond = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = (0, ownership_1.requireUser)(req);
        (0, response_1.ok)(res, yield (0, accessRequest_service_1.respondAccessRequest)(req.params.id, user, req.body || {}), "Updated");
    }
    catch (error) {
        (0, errors_1.handleRouteError)(error, res);
    }
});
exports.respond = respond;
