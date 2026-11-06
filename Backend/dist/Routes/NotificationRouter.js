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
const client_1 = require("@prisma/client");
const express_1 = require("express");
const VerifyToken_1 = require("../helpers/middleware/VerifyToken");
const rbac_1 = require("../helpers/middleware/rbac");
const prisma_1 = require("../lib/prisma");
const asyncHandler_1 = require("../utils/asyncHandler");
const createOwnedRouter_1 = require("../utils/createOwnedRouter");
const errors_1 = require("../utils/errors");
const ownership_1 = require("../utils/ownership");
const response_1 = require("../utils/response");
const validation_1 = require("../utils/validation");
const base = (0, createOwnedRouter_1.createOwnedRouter)(prisma_1.prisma.notification, {
    sanitizeCreate: (body) => {
        var _a;
        return ({
            title: (0, validation_1.requireString)(body.title, "title"),
            body: (0, validation_1.requireString)(body.body, "body"),
            type: (0, validation_1.parseEnum)(body.type, Object.values(client_1.NotificationType), "type", true),
            channel: (0, validation_1.parseEnum)(body.channel, Object.values(client_1.NotificationChannel), "channel") || client_1.NotificationChannel.IN_APP,
            data: (_a = body.data) !== null && _a !== void 0 ? _a : undefined,
        });
    },
    sanitizeUpdate: (body) => {
        const data = {};
        if (body.title !== undefined)
            data.title = (0, validation_1.requireString)(body.title, "title");
        if (body.body !== undefined)
            data.body = (0, validation_1.requireString)(body.body, "body");
        if (body.type !== undefined)
            data.type = (0, validation_1.parseEnum)(body.type, Object.values(client_1.NotificationType), "type", true);
        if (body.channel !== undefined)
            data.channel = (0, validation_1.parseEnum)(body.channel, Object.values(client_1.NotificationChannel), "channel");
        if (body.isRead !== undefined) {
            data.isRead = Boolean(body.isRead);
            data.readAt = body.isRead ? new Date() : null;
        }
        if (body.data !== undefined)
            data.data = body.data;
        return data;
    },
});
const router = (0, express_1.Router)();
router.use(VerifyToken_1.decodeToken);
router.patch("/:id/read", (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = (0, ownership_1.requireUser)(req);
        const row = yield prisma_1.prisma.notification.findFirst({
            where: { id: req.params.id },
        });
        if (!row) {
            res.status(404).json({ isSuccess: false, message: "Not found" });
            return;
        }
        if (!(0, rbac_1.isAdminRole)(user.role) && row.userId !== user.userId) {
            res.status(403).json({ isSuccess: false, message: "Forbidden" });
            return;
        }
        const updated = yield prisma_1.prisma.notification.update({
            where: { id: row.id },
            data: { isRead: true, readAt: new Date() },
        });
        (0, response_1.ok)(res, updated, "Marked as read");
    }
    catch (error) {
        (0, errors_1.handleRouteError)(error, res);
    }
})));
router.post("/read-all", (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = (0, ownership_1.requireUser)(req);
        const result = yield prisma_1.prisma.notification.updateMany({
            where: { userId: user.userId, isRead: false },
            data: { isRead: true, readAt: new Date() },
        });
        (0, response_1.ok)(res, result, "All notifications marked as read");
    }
    catch (error) {
        (0, errors_1.handleRouteError)(error, res);
    }
})));
router.use("/", base);
exports.default = router;
