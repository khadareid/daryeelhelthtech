"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const VerifyToken_1 = require("../helpers/middleware/VerifyToken");
const NewsController_1 = require("../Controllers/NewsController");
const router = (0, express_1.Router)();
const handle = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res)).catch(next);
};
const optionalAuth = (req, res, next) => {
    const header = req.headers.authorization;
    if (!header) {
        next();
        return;
    }
    (0, VerifyToken_1.decodeToken)(req, res, next);
};
router.get("/", optionalAuth, handle(NewsController_1.listNews));
router.get("/:id", optionalAuth, handle(NewsController_1.getNews));
router.post("/", VerifyToken_1.decodeToken, handle(NewsController_1.createNews));
router.patch("/:id", VerifyToken_1.decodeToken, handle(NewsController_1.updateNews));
router.delete("/:id", VerifyToken_1.decodeToken, handle(NewsController_1.deleteNews));
router.post("/:id/comments", VerifyToken_1.decodeToken, handle(NewsController_1.addComment));
router.patch("/comments/:commentId", VerifyToken_1.decodeToken, handle(NewsController_1.updateComment));
router.delete("/comments/:commentId", VerifyToken_1.decodeToken, handle(NewsController_1.deleteComment));
router.post("/:id/reactions", VerifyToken_1.decodeToken, handle(NewsController_1.addReaction));
router.delete("/:id/reactions", VerifyToken_1.decodeToken, handle(NewsController_1.removeReaction));
router.post("/reports", VerifyToken_1.decodeToken, handle(NewsController_1.reportNews));
exports.default = router;
