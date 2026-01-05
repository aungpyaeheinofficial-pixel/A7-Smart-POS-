import { Router, Request, Response } from 'express';

const router = Router();

/**
 * Health check endpoint
 * GET /healthz
 * No authentication required
 */
router.get('/healthz', (_req: Request, res: Response) => {
  res.json({
    ok: true,
    service: 'a7-smart-pos-api',
    time: new Date().toISOString(),
  });
});

export default router;

