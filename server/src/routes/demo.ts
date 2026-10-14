import { Router, Request, Response } from 'express';
import { db } from '../db';
import { seedDemoData } from '../seed';
import { logAuditEvent } from '../auditLogger';

const router = Router();

router.post('/reset', (_req: Request, res: Response) => {
  try {
    seedDemoData();
    res.json({ message: 'Demo dataset successfully loaded. 10 transactions, 2 verified decisions initialized.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to reload demo data' });
  }
});

router.post('/clear', (_req: Request, res: Response) => {
  try {
    db.exec(`
      DELETE FROM decisions;
      DELETE FROM transactions;
      DELETE FROM audit_trail;
    `);

    logAuditEvent({
      event_type: 'DATA_RESET',
      entity_type: 'system',
      entity_id: 'SYSTEM_CLEAR',
      details: { message: 'All database tables cleared to test empty states.' },
    });

    res.json({ message: 'All transactional data and decisions cleared successfully. Empty states active.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to clear data' });
  }
});

export default router;
