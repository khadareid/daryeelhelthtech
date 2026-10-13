import { NextFunction, Request, Response } from 'express';

import { CustomUserRequest } from './VerifyToken';
import { createAuditLog, getClientMeta } from '../../services/audit.service';

const MUTATION_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

const actionFromMethod = (method: string) => {
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

const entityFromPath = (path: string) => {
  const cleanPath = path.split('?')[0];

  const segments = cleanPath.split('/').filter(Boolean);

  // Find "v1" and take the next segment
  const v1Index = segments.indexOf('v1');

  if (v1Index !== -1 && segments[v1Index + 1]) {
    return segments[v1Index + 1];
  }

  return segments[0] || 'UNKNOWN';
};

export const auditMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (!MUTATION_METHODS.has(req.method)) {
    return next();
  }

  const originalJson = res.json.bind(res);

  res.json = (body: unknown) => {
    const user = (req as CustomUserRequest).user;

    // Only log successful authenticated mutations
    if (res.statusCode < 400 && user) {
      const meta = getClientMeta(req);

      const entity = entityFromPath(req.originalUrl || req.path);

      const entityId = typeof req.params?.id === 'string' ? req.params.id : undefined;

      void createAuditLog({
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
