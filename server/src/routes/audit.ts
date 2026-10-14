import { Router, Request, Response } from 'express';
import { getAuditTrail } from '../auditLogger';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  try {
    const { limit = 100, event_type } = req.query;
    const events = getAuditTrail(Number(limit), event_type as string);
    res.json({ events });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch audit trail' });
  }
});

export default router;
