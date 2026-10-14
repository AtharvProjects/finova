import { Router, Request, Response } from 'express';
import { db } from '../db';
import { logAuditEvent } from '../auditLogger';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  try {
    const rows = db.prepare('SELECT key, value FROM system_settings').all() as Array<{ key: string; value: string }>;
    const settings: Record<string, string> = {};
    for (const r of rows) {
      settings[r.key] = r.value;
    }
    res.json({ settings });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch settings' });
  }
});

router.put('/', (req: Request, res: Response) => {
  try {
    const { settings } = req.body;
    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ error: 'Settings object is required' });
    }

    const updateStmt = db.prepare('INSERT OR REPLACE INTO system_settings (key, value) VALUES (?, ?)');

    db.transaction(() => {
      for (const [k, v] of Object.entries(settings)) {
        updateStmt.run(k, String(v));
      }
    })();

    logAuditEvent({
      event_type: 'RISK_SCORED', // Configuration update
      entity_type: 'system',
      entity_id: 'SYSTEM_SETTINGS',
      details: settings,
    });

    res.json({ message: 'Settings saved successfully', settings });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to update settings' });
  }
});

export default router;
