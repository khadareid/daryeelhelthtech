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
exports.createOwnedRouter = void 0;
const express_1 = require("express");
const VerifyToken_1 = require("../helpers/middleware/VerifyToken");
const rbac_1 = require("../helpers/middleware/rbac");
const ownedCrud_service_1 = require("../services/ownedCrud.service");
const asyncHandler_1 = require("./asyncHandler");
const errors_1 = require("./errors");
const ownership_1 = require("./ownership");
const response_1 = require("./response");
const createOwnedRouter = (delegate, options = {}) => {
    const router = (0, express_1.Router)();
    router.use(VerifyToken_1.decodeToken);
    router.get("/", (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b;
        try {
            const user = (0, ownership_1.requireUser)(req);
            const targetUserId = (0, rbac_1.isAdminRole)(user.role)
                ? (typeof req.query.userId === "string" ? req.query.userId : undefined) ||
                    undefined
                : user.userId;
            // Non-admins always scoped to self; admins without userId see all
            const scopeUserId = (0, rbac_1.isAdminRole)(user.role)
                ? (typeof req.query.userId === "string" ? req.query.userId : undefined)
                : user.userId;
            const result = yield (0, ownedCrud_service_1.listOwned)(delegate, scopeUserId, req.query, (_b = (_a = options.listExtraWhere) === null || _a === void 0 ? void 0 : _a.call(options, req.query)) !== null && _b !== void 0 ? _b : {});
            // silence unused
            void targetUserId;
            (0, response_1.ok)(res, result);
        }
        catch (error) {
            (0, errors_1.handleRouteError)(error, res);
        }
    })));
    router.get("/:id", (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const user = (0, ownership_1.requireUser)(req);
            const row = yield (0, ownedCrud_service_1.getOwned)(delegate, req.params.id, {
                userId: user.userId,
                isAdmin: (0, rbac_1.isAdminRole)(user.role),
            });
            (0, response_1.ok)(res, row);
        }
        catch (error) {
            (0, errors_1.handleRouteError)(error, res);
        }
    })));
    router.post("/", (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        try {
            const userId = (0, ownership_1.resolveTargetUserId)(req, typeof ((_a = req.body) === null || _a === void 0 ? void 0 : _a.userId) === "string" ? req.body.userId : undefined);
            const data = options.sanitizeCreate
                ? options.sanitizeCreate(req.body || {})
                : Object.assign({}, (req.body || {}));
            delete data.userId;
            delete data.id;
            const row = yield (0, ownedCrud_service_1.createOwned)(delegate, userId, data);
            (0, response_1.created)(res, row);
        }
        catch (error) {
            (0, errors_1.handleRouteError)(error, res);
        }
    })));
    router.put("/:id", (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const user = (0, ownership_1.requireUser)(req);
            const data = options.sanitizeUpdate
                ? options.sanitizeUpdate(req.body || {})
                : Object.assign({}, (req.body || {}));
            delete data.userId;
            delete data.id;
            const row = yield (0, ownedCrud_service_1.getOwned)(delegate, req.params.id, {
                userId: user.userId,
                isAdmin: (0, rbac_1.isAdminRole)(user.role),
            });
            void row;
            const updated = yield delegate.update({
                where: { id: req.params.id },
                data,
            });
            (0, response_1.ok)(res, updated, "Updated");
        }
        catch (error) {
            (0, errors_1.handleRouteError)(error, res);
        }
    })));
    router.patch("/:id", (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const user = (0, ownership_1.requireUser)(req);
            const data = options.sanitizeUpdate
                ? options.sanitizeUpdate(req.body || {})
                : Object.assign({}, (req.body || {}));
            delete data.userId;
            delete data.id;
            yield (0, ownedCrud_service_1.getOwned)(delegate, req.params.id, {
                userId: user.userId,
                isAdmin: (0, rbac_1.isAdminRole)(user.role),
            });
            const updated = yield delegate.update({
                where: { id: req.params.id },
                data,
            });
            (0, response_1.ok)(res, updated, "Updated");
        }
        catch (error) {
            (0, errors_1.handleRouteError)(error, res);
        }
    })));
    router.delete("/:id", (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const user = (0, ownership_1.requireUser)(req);
            const deleted = yield (0, ownedCrud_service_1.deleteOwned)(delegate, req.params.id, {
                userId: user.userId,
                isAdmin: (0, rbac_1.isAdminRole)(user.role),
            });
            (0, response_1.ok)(res, deleted, "Deleted");
        }
        catch (error) {
            (0, errors_1.handleRouteError)(error, res);
        }
    })));
    return router;
};
exports.createOwnedRouter = createOwnedRouter;
