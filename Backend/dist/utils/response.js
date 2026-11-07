"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fail = exports.created = exports.ok = void 0;
const ok = (res, result, message = "OK", status = 200) => {
    res.status(status).json({ isSuccess: true, message, result });
};
exports.ok = ok;
const created = (res, result, message = "Created") => (0, exports.ok)(res, result, message, 201);
exports.created = created;
const fail = (res, message, status = 400, result) => {
    res.status(status).json({ isSuccess: false, message, result });
};
exports.fail = fail;
