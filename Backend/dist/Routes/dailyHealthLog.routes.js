"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const VerifyToken_1 = require("../helpers/middleware/VerifyToken");
const dailyHealthLog_controller_1 = require("../Controllers/dailyHealthLog.controller");
const router = (0, express_1.Router)();
const handle = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res)).catch(next);
};
router.use(VerifyToken_1.decodeToken);
router.post("/", handle(dailyHealthLog_controller_1.createDailyHealthLog));
router.get("/today", handle(dailyHealthLog_controller_1.getTodayDailyHealthLog));
router.get("/history", handle(dailyHealthLog_controller_1.getDailyHealthHistory));
router.get("/:date", handle(dailyHealthLog_controller_1.getDailyHealthLogByDate));
router.put("/:date", handle(dailyHealthLog_controller_1.updateDailyHealthLog));
router.delete("/:date", handle(dailyHealthLog_controller_1.deleteDailyHealthLog));
exports.default = router;
