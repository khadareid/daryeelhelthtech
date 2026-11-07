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
exports.upsertMine = exports.getMine = void 0;
const emergencyCard_service_1 = require("../services/emergencyCard.service");
const errors_1 = require("../utils/errors");
const ownership_1 = require("../utils/ownership");
const response_1 = require("../utils/response");
const getMine = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = (0, ownership_1.requireUser)(req);
        const userId = (0, ownership_1.resolveTargetUserId)(req, typeof req.query.userId === "string" ? req.query.userId : undefined);
        void user;
        (0, response_1.ok)(res, yield (0, emergencyCard_service_1.getEmergencyCard)(userId));
    }
    catch (error) {
        (0, errors_1.handleRouteError)(error, res);
    }
});
exports.getMine = getMine;
const upsertMine = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (0, ownership_1.resolveTargetUserId)(req, typeof ((_a = req.body) === null || _a === void 0 ? void 0 : _a.userId) === "string" ? req.body.userId : undefined);
        (0, response_1.ok)(res, yield (0, emergencyCard_service_1.upsertEmergencyCard)(userId, req.body || {}), "Emergency card saved");
    }
    catch (error) {
        (0, errors_1.handleRouteError)(error, res);
    }
});
exports.upsertMine = upsertMine;
