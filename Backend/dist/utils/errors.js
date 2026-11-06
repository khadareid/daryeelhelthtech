"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorMiddleware = exports.handleRouteError = void 0;
const ownership_1 = require("./ownership");
const response_1 = require("./response");
const handleRouteError = (error, res, fallback = "Server error") => {
    if (error instanceof ownership_1.HttpError) {
        (0, response_1.fail)(res, error.message, error.status);
        return;
    }
    console.error(error);
    (0, response_1.fail)(res, fallback, 500);
};
exports.handleRouteError = handleRouteError;
const errorMiddleware = (err, _req, res, _next) => {
    (0, exports.handleRouteError)(err, res);
};
exports.errorMiddleware = errorMiddleware;
