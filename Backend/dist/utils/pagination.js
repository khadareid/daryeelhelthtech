"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pageMeta = exports.parsePagination = void 0;
const parsePagination = (query) => {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;
    return { page, limit, skip, take: limit };
};
exports.parsePagination = parsePagination;
const pageMeta = (total, page, limit) => ({
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
});
exports.pageMeta = pageMeta;
