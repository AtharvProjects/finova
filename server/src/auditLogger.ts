import { db } from './db';
import { AuditEvent } from './types';

export function logAuditEvent(params: {
  event_type: AuditEvent['event_type'];
  entity_type: AuditEvent['entity_type'];
  entity_id: string;
  actor?: string;
  details: any;
  status?: AuditEvent['status'];
}): AuditEvent {
  const id = `AUD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const timestamp = new Date().toISOString();
  const actor = params.actor || 'Compliance Engine (Automated)';
  const status = params.status || 'success';
  const detailsStr = typeof params.details === 'string' ? params.details : JSON.stringify(params.details);

  const stmt = db.prepare(`
    INSERT INTO audit_trail (id, timestamp, event_type, entity_type, entity_id, actor, details, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(id, timestamp, params.event_type, params.entity_type, params.entity_id, actor, detailsStr, status);

  return {
    id,
    timestamp,
    event_type: params.event_type,
    entity_type: params.entity_type,
    entity_id: params.entity_id,
    actor,
    details: params.details,
    status,
  };
}

export function getAuditTrail(limit: number = 100, eventType?: string): AuditEvent[] {
  let query = 'SELECT * FROM audit_trail';
  const params: any[] = [];

  if (eventType && eventType !== 'ALL') {
    query += ' WHERE event_type = ?';
    params.push(eventType);
  }

  query += ' ORDER BY timestamp DESC LIMIT ?';
  params.push(limit);

  const rows = db.prepare(query).all(...params) as any[];

  return rows.map((row) => {
    let parsedDetails = row.details;
    try {
      parsedDetails = JSON.parse(row.details);
    } catch {
      // keep raw string
    }
    return {
      ...row,
      details: parsedDetails,
    };
  });
}
