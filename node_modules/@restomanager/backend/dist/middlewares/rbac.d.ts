import { Request, Response, NextFunction } from 'express';
export type Role = 'owner' | 'manager' | 'cashier' | 'server' | 'chef' | 'stock_manager';
export declare function requireRole(...allowedRoles: Role[]): (req: Request, res: Response, next: NextFunction) => void;
export declare function requireMinRole(minRole: Role): (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=rbac.d.ts.map