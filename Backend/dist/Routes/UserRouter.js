"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// routes/user.routes.ts
const express_1 = require("express");
const UserController_1 = require("../Controllers/UserController");
const VerifyToken_1 = require("../helpers/middleware/VerifyToken");
const router = (0, express_1.Router)();
router.post("/register", UserController_1.register);
router.post("/login", UserController_1.login);
router.get("/doctors", UserController_1.listPublicDoctors);
router.get("/profile/:userid", VerifyToken_1.decodeToken, UserController_1.getUserProfile);
router.put("/profile/:userid", VerifyToken_1.decodeToken, UserController_1.updateUserProfile);
router.put("/profile/:userid/password", VerifyToken_1.decodeToken, UserController_1.changePassword);
router.patch("/profile/:userid/role", VerifyToken_1.decodeToken, UserController_1.changeRole);
exports.default = router;
