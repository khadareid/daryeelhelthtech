"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decodeToken = void 0;
const GenerateToken_1 = require("../GenerateToken");
const decodeToken = (req, res, next) => {
    var _a;
    try {
        const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(" ")[1];
        if (!token) {
            return res
                .status(401)
                .json({ isSuccess: false, message: "Access Denied. No Token Provided." });
        }
        const payload = (0, GenerateToken_1.verifyAccessToken)(token);
        req.user = { userId: payload.userId, email: payload.email, role: payload.role };
        next();
    }
    catch (error) {
        return res.status(403).json({ isSuccess: false, message: "Invalid Token" });
    }
};
exports.decodeToken = decodeToken;
