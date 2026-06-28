"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = void 0;
exports.sendSuccess = sendSuccess;
exports.sendError = sendError;
function sendSuccess(res, data, statusCode = 200, meta) {
    const response = {
        success: true,
        data,
        error: null,
        meta: meta || null,
    };
    res.status(statusCode).json(response);
}
function sendError(res, statusCode, code, message, fields) {
    const response = {
        success: false,
        data: null,
        error: {
            code,
            message,
            fields,
        },
        meta: null,
    };
    res.status(statusCode).json(response);
}
class AppError extends Error {
    statusCode;
    code;
    fields;
    constructor(statusCode, code, message, fields) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.fields = fields;
        this.name = 'AppError';
    }
}
exports.AppError = AppError;
//# sourceMappingURL=response.js.map