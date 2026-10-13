"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Send_code_1 = require("./google/Send-code");
const Verify_code_1 = require("./google/Verify-code");
const router = (0, express_1.Router)();
router.post("/sendcode", Send_code_1.sendCode);
router.post("/verify-code", Verify_code_1.verifyCode);
exports.default = router;
