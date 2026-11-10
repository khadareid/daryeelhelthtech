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
exports.SaasIntegrationService = void 0;
const saasClient_1 = require("../../lib/saasClient");
function unwrap(json) {
    var _a, _b;
    return (_b = (_a = json.data) !== null && _a !== void 0 ? _a : json.result) !== null && _b !== void 0 ? _b : json;
}
exports.SaasIntegrationService = {
    searchHospitals(query) {
        return __awaiter(this, void 0, void 0, function* () {
            return saasClient_1.saasApi.listHospitals(query);
        });
    },
    getHospital(hospitalId) {
        return __awaiter(this, void 0, void 0, function* () {
            return saasClient_1.saasApi.getHospital(hospitalId);
        });
    },
    listDepartments(hospitalId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                return yield saasClient_1.saasApi.listDepartments(hospitalId);
            }
            catch (error) {
                // Fallback: derive departments from hospital facilities + doctor specialties
                if ((error === null || error === void 0 ? void 0 : error.status) === 404) {
                    const hospital = yield saasClient_1.saasApi.getHospital(hospitalId);
                    const data = unwrap(hospital);
                    const facilities = Array.isArray(data === null || data === void 0 ? void 0 : data.facilities) ? data.facilities : [];
                    const doctors = Array.isArray(data === null || data === void 0 ? void 0 : data.doctors) ? data.doctors : [];
                    const specialtySet = new Map();
                    for (const d of doctors) {
                        const name = (d === null || d === void 0 ? void 0 : d.specialization) || ((_a = d === null || d === void 0 ? void 0 : d.department) === null || _a === void 0 ? void 0 : _a.name);
                        if (!name)
                            continue;
                        if (!specialtySet.has(name)) {
                            specialtySet.set(name, {
                                departmentId: `specialty:${String(name).toLowerCase().replace(/\s+/g, "-")}`,
                                name,
                                type: "SPECIALTY",
                                hospitalId,
                            });
                        }
                    }
                    const facilityDepartments = facilities.map((f) => ({
                        departmentId: f.facilityId,
                        name: f.name,
                        type: "FACILITY",
                        hospitalId,
                        city: f.city || null,
                        isMain: Boolean(f.isMain),
                    }));
                    const departments = [
                        ...facilityDepartments,
                        ...Array.from(specialtySet.values()),
                    ];
                    return {
                        isSuccess: true,
                        data: departments,
                        result: departments,
                    };
                }
                throw error;
            }
        });
    },
    listHospitalDoctors(hospitalId, query) {
        return __awaiter(this, void 0, void 0, function* () {
            return saasClient_1.saasApi.listDoctors(hospitalId, query);
        });
    },
    searchDoctors(query) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield saasClient_1.saasApi.listAllDoctors(query);
            }
            catch (error) {
                if ((error === null || error === void 0 ? void 0 : error.status) === 404 && (query === null || query === void 0 ? void 0 : query.hospitalId)) {
                    return saasClient_1.saasApi.listDoctors(String(query.hospitalId), query);
                }
                throw error;
            }
        });
    },
    getDoctor(doctorId) {
        return __awaiter(this, void 0, void 0, function* () {
            return saasClient_1.saasApi.getDoctor(doctorId);
        });
    },
    getDoctorAvailability(doctorId, date) {
        return __awaiter(this, void 0, void 0, function* () {
            return saasClient_1.saasApi.getAvailability(doctorId, date);
        });
    },
    createAppointment(body, idempotencyKey) {
        return __awaiter(this, void 0, void 0, function* () {
            return saasClient_1.saasApi.createAppointment(body, idempotencyKey);
        });
    },
    listAppointments(healthtechUserId) {
        return __awaiter(this, void 0, void 0, function* () {
            return saasClient_1.saasApi.listAppointments(healthtechUserId);
        });
    },
    getAppointment(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return saasClient_1.saasApi.getAppointment(id);
        });
    },
    cancelAppointment(id, body) {
        return __awaiter(this, void 0, void 0, function* () {
            return saasClient_1.saasApi.cancelAppointment(id, body);
        });
    },
    requestReschedule(id, body) {
        return __awaiter(this, void 0, void 0, function* () {
            return saasClient_1.saasApi.requestReschedule(id, body);
        });
    },
    respondReschedule(id, body) {
        return __awaiter(this, void 0, void 0, function* () {
            return saasClient_1.saasApi.respondReschedule(id, body);
        });
    },
    submitReview(id, body) {
        return __awaiter(this, void 0, void 0, function* () {
            return saasClient_1.saasApi.submitReview(id, body);
        });
    },
    getOpdTicket(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return saasClient_1.saasApi.getOpdTicket(id);
        });
    },
    getVisit(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return saasClient_1.saasApi.getVisit(id);
        });
    },
};
