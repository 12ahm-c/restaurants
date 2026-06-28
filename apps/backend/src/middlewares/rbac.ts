import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response';

export type Role = 'owner' | 'manager' | 'cashier' | 'server' | 'chef' | 'stock_manager';

const ROLE_HIERARCHY: Record<Role, number> = {
  owner: 6,
  manager: 5,
  cashier: 4,
  server: 3,
  chef: 3,
  stock_manager: 3,
};

export function requireRole(...allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 401, 'AUTH_REQUIRED', 'Authentication required');
      return;
    }

    const userRole = req.user.role as Role;

    if (!allowedRoles.includes(userRole)) {
      sendError(res, 403, 'FORBIDDEN', 'Insufficient permissions');
      return;
    }

    next();
  };
}

export function requireMinRole(minRole: Role) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 401, 'AUTH_REQUIRED', 'Authentication required');
      return;
    }

    const userRole = req.user.role as Role;
    const userLevel = ROLE_HIERARCHY[userRole] || 0;
    const requiredLevel = ROLE_HIERARCHY[minRole] || 0;

    if (userLevel < requiredLevel) {
      sendError(res, 403, 'FORBIDDEN', 'Insufficient permissions');
      return;
    }

    next();
  };
}
