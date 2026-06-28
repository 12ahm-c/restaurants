import { Request, Response, NextFunction } from 'express';
export interface JwtPayload {
    sub: string;
    role: string;
    branchId?: string;
    iat: number;
    exp: number;
}
declare global {
    namespace Express {
        interface Request {
            user?: JwtPayload;
        }
    }
}
export declare function authenticate(req: Request, res: Response, next: NextFunction): void;
export declare function optionalAuth(req: Request, _res: Response, next: NextFunction): void;
//# sourceMappingURL=auth.d.ts.map