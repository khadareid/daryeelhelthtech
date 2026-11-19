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
exports.lookupPatientByHealthId = void 0;
const hospitalPatientRequest_service_1 = require("../services/healthcare/hospitalPatientRequest.service");
function httpError(res, error, fallback) {
    const status = (error === null || error === void 0 ? void 0 : error.status) || 500;
    console.error(fallback, (error === null || error === void 0 ? void 0 : error.message) || error);
    res.status(status).json({
        isSuccess: false,
        message: process.env.NODE_ENV === "production" && status >= 500
            ? fallback
            : (error === null || error === void 0 ? void 0 : error.message) || fallback,
    });
}
/** GET /integrations/patients/by-health-id?healthId= — SaaS verify only; never creates users */
const lookupPatientByHealthId = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const healthId = String(req.query.healthId || req.query.q || "").trim();
        const outcome = yield (0, hospitalPatientRequest_service_1.findPatientByHealthId)(healthId);
        const patient = outcome.patient;
        const result = outcome.result;
        // Canonical contract for SaaS:
        // isSuccess + result.healthId  (and patient summary for convenience)
        res.status(200).json({
            isSuccess: true,
            found: outcome.found,
            message: outcome.found ? "OK" : outcome.message,
            patient,
            result: result !== null && result !== void 0 ? result : patient,
            data: {
                found: outcome.found,
                patient,
                result,
            },
        });
    }
    catch (error) {
        httpError(res, error, "Failed to look up patient by Health ID");
    }
});
exports.lookupPatientByHealthId = lookupPatientByHealthId;
