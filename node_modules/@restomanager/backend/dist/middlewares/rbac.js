"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = requireRole;
exports.requireMinRole = requireMinRole;
const response_1 = require("../utils/response");
const ROLE_HIERARCHY = {
    owner: 6,
    manager: 5,
    cashier: 4,
    server: 3,
    chef: 3,
    stock_manager: 3,
};
function requireRole(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            (0, response_1.sendError)(res, 401, 'AUTH_REQUIRED', 'Authentication required');
            return;
        }
        const userRole = req.user.role;
        if (!allowedRoles.includes(userRole)) {
            (0, response_1.sendError)(res, 403, 'FORBIDDEN', 'Insufficient permissions');
            return;
        }
        next();
    };
}
function requireMinRole(minRole) {
    return (req, res, next) => {
        if (!req.user) {
            (0, response_1.sendError)(res, 401, 'AUTH_REQUIRED', 'Authentication required');
            return;
        }
        const userRole = req.user.role;
        const userLevel = ROLE_HIERARCHY[userRole] || 0;
        const requiredLevel = ROLE_HIERARCHY[minRole] || 0;
        if (userLevel < requiredLevel) {
            (0, response_1.sendError)(res, 403, 'FORBIDDEN', 'Insufficient permissions');
            return;
        }
        next();
    };
}
//# sourceMappingURL=rbac.js.map