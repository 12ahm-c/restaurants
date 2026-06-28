import { Request, Response, NextFunction } from 'express';
import { redis, isRedisAvailable } from '../config/redis';
import { sendError } from '../utils/response';

const IDEMPOTENCY_TTL = 24 * 60 * 60; // 24 hours

export async function idempotencyMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  const idempotencyKey = req.headers['idempotency-key'] as string;

  if (!idempotencyKey) {
    sendError(res, 400, 'VALIDATION_ERROR', 'Idempotency-Key header is required');
    return;
  }

  if (!isRedisAvailable()) {
    next();
    return;
  }

  try {
    const existingResponse = await redis.get(`idempotency:${idempotencyKey}`);

    if (existingResponse) {
      const cached = JSON.parse(existingResponse);
      res.status(cached.statusCode).json(cached.body);
      return;
    }
  } catch {
    // Redis error, continue without idempotency check
  }

  const originalJson = res.json.bind(res);
  const originalStatus = res.status.bind(res);

  let statusCode = 200;

  res.status = ((code: number) => {
    statusCode = code;
    return originalStatus(code);
  }) as typeof res.status;

  res.json = ((body: unknown) => {
    const response = {
      statusCode,
      body,
    };

    redis.set(
      `idempotency:${idempotencyKey}`,
      JSON.stringify(response),
      'EX',
      IDEMPOTENCY_TTL
    );

    return originalJson(body);
  }) as typeof res.json;

  next();
}
