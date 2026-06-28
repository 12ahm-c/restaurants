import { Router } from 'express';
import { healthController } from './health.controller';

const router = Router();

router.get('/health', healthController.check);
router.get('/health/metrics', healthController.metrics);

export default router;
