import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';

const router = Router();

// Liveness — process is up. No DB dependency, so this can't be dragged down by a Mongo outage.
router.get('/', (_req: Request, res: Response) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// Readiness — process is up AND can actually serve requests that touch the DB.
router.get('/ready', async (_req: Request, res: Response) => {
  const readyState = mongoose.connection.readyState; // 1 = connected

  if (readyState !== 1 || !mongoose.connection.db) {
    res.status(503).json({ status: 'not ready', db: readyState });
    return;
  }

  try {
    await mongoose.connection.db.admin().ping();
    res.json({ status: 'ok', db: readyState });
  } catch {
    res.status(503).json({ status: 'not ready', db: readyState });
  }
});

export default router;
