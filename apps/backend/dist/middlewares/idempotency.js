"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.idempotencyMiddleware = idempotencyMiddleware;
const redis_1 = require("../config/redis");
const response_1 = require("../utils/response");
const IDEMPOTENCY_TTL = 24 * 60 * 60; // 24 hours
async function idempotencyMiddleware(req, res, next) {
    const idempotencyKey = req.headers['idempotency-key'];
    if (!idempotencyKey) {
        (0, response_1.sendError)(res, 400, 'VALIDATION_ERROR', 'Idempotency-Key header is required');
        return;
    }
    if (!(0, redis_1.isRedisAvailable)()) {
        next();
        return;
    }
    try {
        const existingResponse = await redis_1.redis.get(`idempotency:${idempotencyKey}`);
        if (existingResponse) {
            const cached = JSON.parse(existingResponse);
            res.status(cached.statusCode).json(cached.body);
            return;
        }
    }
    catch {
        // Redis error, continue without idempotency check
    }
    const originalJson = res.json.bind(res);
    const originalStatus = res.status.bind(res);
    let statusCode = 200;
    res.status = ((code) => {
        statusCode = code;
        return originalStatus(code);
    });
    res.json = ((body) => {
        const response = {
            statusCode,
            body,
        };
        redis_1.redis.set(`idempotency:${idempotencyKey}`, JSON.stringify(response), 'EX', IDEMPOTENCY_TTL);
        return originalJson(body);
    });
    next();
}
//# sourceMappingURL=idempotency.js.map