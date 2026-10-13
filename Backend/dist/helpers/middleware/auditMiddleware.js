"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditMiddleware = void 0;
const audit_service_1 = require("../../services/audit.service");
const MUTATION_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const actionFromMethod = (method) => {
    switch (method) {
        case 'POST':
            return 'CREATE';
        case 'PUT':
        case 'PATCH':
            return 'UPDATE';
        case 'DELETE':
            return 'DELETE';
        default:
            return method;
    }
};
const entityFromPath = (path) => {
    const cleanPath = path.split('?')[0];
    const segments = cleanPath.split('/').filter(Boolean);
    // Find "v1" and take the next segment
    const v1Index = segments.indexOf('v1');
    if (v1Index !== -1 && segments[v1Index + 1]) {
        return segments[v1Index + 1];
    }
    return segments[0] || 'UNKNOWN';
};
const auditMiddleware = (req, res, next) => {
    if (!MUTATION_METHODS.has(req.method)) {
        return next();
    }
    const originalJson = res.json.bind(res);
    res.json = (body) => {
        var _a;
        const user = req.user;
        // Only log successful authenticated mutations
        if (res.statusCode < 400 && user) {
            const meta = (0, audit_service_1.getClientMeta)(req);
            const entity = entityFromPath(req.originalUrl || req.path);
            const entityId = typeof ((_a = req.params) === null || _a === void 0 ? void 0 : _a.id) === 'string' ? req.params.id : undefined;
            void (0, audit_service_1.createAuditLog)({
                action: actionFromMethod(req.method),
                entity,
                entityId,
                userId: user.userid,
                oldValue: undefined,
                newValue: {
                    path: req.originalUrl,
                    method: req.method,
                    body: req.body,
                    response: body,
                },
                ipAddress: meta.ipAddress,
                userAgent: meta.userAgent,
            });
        }
        return originalJson(body);
    };
    next();
};
exports.auditMiddleware = auditMiddleware;
