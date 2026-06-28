"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
exports.createRequestLogger = createRequestLogger;
const pino_1 = __importDefault(require("pino"));
const env_1 = require("../config/env");
exports.logger = (0, pino_1.default)({
    level: env_1.env.NODE_ENV === 'production' ? 'info' : 'debug',
    transport: env_1.env.NODE_ENV !== 'production' ? { target: 'pino-pretty' } : undefined,
    formatters: {
        level: (label) => ({ level: label }),
    },
    timestamp: pino_1.default.stdTimeFunctions.isoTime,
    serializers: {
        err: pino_1.default.stdSerializers.err,
        req: pino_1.default.stdSerializers.req,
        res: pino_1.default.stdSerializers.res,
    },
    redact: ['password', 'token', 'secret', 'authorization', 'cookie'],
});
function createRequestLogger(requestId) {
    return exports.logger.child({ requestId });
}
//# sourceMappingURL=logger.js.map