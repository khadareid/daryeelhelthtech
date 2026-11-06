"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalDecodeToken = exports.decodeToken = void 0;
const GenerateToken_1 = require("../GenerateToken");
const decodeToken = (req, res, next) => {
    var _a;
    try {
        const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(" ")[1];
        if (!token) {
            res.status(401).json({
                isSuccess: false,
                message: "Access Denied. No Token Provided.",
            });
            return;
        }
        const payload = (0, GenerateToken_1.verifyAccessToken)(token);
        req.user = {
            userId: payload.userId,
            email: payload.email,
            role: payload.role,
        };
        next();
    }
    catch (_b) {
        res.status(403).json({ isSuccess: false, message: "Invalid Token" });
    }
};
exports.decodeToken = decodeToken;
const optionalDecodeToken = (req, _res, next) => {
    var _a;
    try {
        const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(" ")[1];
        if (token) {
            const payload = (0, GenerateToken_1.verifyAccessToken)(token);
            req.user = {
                userId: payload.userId,
                email: payload.email,
                role: payload.role,
            };
        }
    }
    catch (_b) {
        // ignore invalid optional tokens
    }
    next();
};
exports.optionalDecodeToken = optionalDecodeToken;
