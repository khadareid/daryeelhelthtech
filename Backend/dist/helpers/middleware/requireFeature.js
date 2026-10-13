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
exports.requireFeature = void 0;
const featureFlag_service_1 = require("../../services/featureFlag.service");
const requireFeature = (key, action = "read") => (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        const allowed = yield (0, featureFlag_service_1.isFeatureAllowed)({
            key,
            userId: (user === null || user === void 0 ? void 0 : user.userId) || (user === null || user === void 0 ? void 0 : user.userid),
            role: user === null || user === void 0 ? void 0 : user.role,
            action,
        });
        if (!allowed) {
            res.status(403).json({
                isSuccess: false,
                message: `Feature "${key}" is not available`,
            });
            return;
        }
        next();
    }
    catch (error) {
        next(error);
    }
});
exports.requireFeature = requireFeature;
