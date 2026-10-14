import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../db';
import { evaluateTransactionRisk } from '../riskEngine';
import { logAuditEvent } from '../auditLogger';
import { Transaction } from '../types';

const router = Router();

const transactionSchema = z.object({
  id: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  amount: z.number().positive('Amount must be greater than zero'),
  type: z.enum(['credit', 'debit']),
  category: z.string().min(2, 'Category is required'),
  counterparty: z.string().min(2, 'Counterparty is required'),
  description: z.string().min(3, 'Description must be at least 3 characters'),
});

function getAllTransactions(): Transaction[] {
  const rows = db.prepare('SELECT * FROM transactions ORDER BY date DESC, created_at DESC').all() as any[];
  return rows.map((r) => ({
    ...r,
    risk_factors: JSON.parse(r.risk_factors || '[]'),
  }));
}

// GET all transactions with filters, search, and pagination
router.get('/', (req: Request, res: Response) => {
  try {
    const { search, type, category, risk_level, sort_by = 'date', sort_order = 'desc', limit = 100, offset = 0 } = req.query;

    let query = 'SELECT * FROM transactions WHERE 1=1';
    const params: any[] = [];

    if (search && typeof search === 'string') {
      query += ' AND (id LIKE ? OR counterparty LIKE ? OR description LIKE ?)';
      const s = `%${search.trim()}%`;
      params.push(s, s, s);
    }

    if (type && type !== 'all') {
      query += ' AND type = ?';
      params.push(type);
    }

    if (category && category !== 'all') {
      query += ' AND category = ?';
      params.push(category);
    }

    if (risk_level && risk_level !== 'all') {
      query += ' AND risk_level = ?';
      params.push(risk_level);
    }

    // Allowed sort columns
    const allowedSort = ['date', 'amount', 'risk_score', 'counterparty', 'created_at'];
    const validSort = allowedSort.includes(sort_by as string) ? (sort_by as string) : 'date';
    const validOrder = (sort_order as string).toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    // Total count before pagination
    const countStmt = query.replace('SELECT * FROM transactions', 'SELECT COUNT(*) as count FROM transactions');
    const totalCount = (db.prepare(countStmt).get(...params) as any).count;

    query += ` ORDER BY ${validSort} ${validOrder} LIMIT ? OFFSET ?`;
    params.push(Number(limit), Number(offset));

    const rows = db.prepare(query).all(...params) as any[];
    const transactions = rows.map((r) => ({
      ...r,
      risk_factors: JSON.parse(r.risk_factors || '[]'),
    }));

    res.json({
      transactions,
      pagination: {
        total: totalCount,
        limit: Number(limit),
        offset: Number(offset),
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch transactions' });
  }
});

// CSV Export — must be defined BEFORE /:id to prevent route shadowing
router.get('/export-csv', (_req: Request, res: Response) => {
  try {
    const rows = db.prepare('SELECT * FROM transactions ORDER BY date DESC').all() as any[];
    const headers = ['id', 'date', 'amount', 'type', 'category', 'counterparty', 'description', 'risk_score', 'risk_level', 'status'];

    let csvContent = headers.join(',') + '\n';
    for (const r of rows) {
      const line = [
        `"${r.id}"`,
        `"${r.date}"`,
        r.amount,
        `"${r.type}"`,
        `"${(r.category || '').replace(/"/g, '""')}"`,
        `"${(r.counterparty || '').replace(/"/g, '""')}"`,
        `"${(r.description || '').replace(/"/g, '""')}"`,
        r.risk_score,
        `"${r.risk_level}"`,
        `"${r.status}"`,
      ].join(',');
      csvContent += line + '\n';
    }

    logAuditEvent({
      event_type: 'RECORD_EXPORTED',
      entity_type: 'transaction',
      entity_id: 'ALL_TRANSACTIONS',
      details: { rowCount: rows.length },
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="finova_transactions.csv"');
    res.send(csvContent);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to export CSV' });
  }
});

// GET single transaction
router.get('/:id', (req: Request, res: Response) => {
  try {
    const row = db.prepare('SELECT * FROM transactions WHERE id = ?').get(req.params.id) as any;
    if (!row) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const tx: Transaction = {
      ...row,
      risk_factors: JSON.parse(row.risk_factors || '[]'),
    };

    // Find any associated decision
    const decision = db.prepare('SELECT * FROM decisions WHERE transaction_id = ?').get(tx.id) as any;

    res.json({
      transaction: tx,
      decision: decision ? { ...decision, evidence: JSON.parse(decision.evidence || '[]') } : null,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch transaction' });
  }
});

// POST create transaction
router.post('/', (req: Request, res: Response) => {
  try {
    const validated = transactionSchema.parse(req.body);
    const existingList = getAllTransactions();

    const id = validated.id || `TXN-2026-${Math.floor(100 + Math.random() * 900)}`;
    const now = new Date().toISOString();

    // Evaluate risk
    const riskEval = evaluateTransactionRisk({ ...validated, id }, existingList);
    const riskFactors = riskEval.triggeredRules.filter((r) => r.triggered).map((r) => r.ruleName);
    const status = riskEval.riskLevel === 'critical' || riskEval.riskLevel === 'high' ? 'flagged' : 'analysed';

    const stmt = db.prepare(`
      INSERT INTO transactions (id, date, amount, type, category, counterparty, description, status, risk_score, risk_level, risk_factors, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      validated.date,
      validated.amount,
      validated.type,
      validated.category,
      validated.counterparty,
      validated.description,
      status,
      riskEval.overallScore,
      riskEval.riskLevel,
      JSON.stringify(riskFactors),
      now,
      now
    );

    logAuditEvent({
      event_type: 'TX_CREATED',
      entity_type: 'transaction',
      entity_id: id,
      details: {
        amount: validated.amount,
        counterparty: validated.counterparty,
        riskScore: riskEval.overallScore,
        riskLevel: riskEval.riskLevel,
      },
    });

    const createdTx = {
      id,
      ...validated,
      status,
      risk_score: riskEval.overallScore,
      risk_level: riskEval.riskLevel,
      risk_factors: riskFactors,
      created_at: now,
      updated_at: now,
    };

    res.status(201).json({ transaction: createdTx, riskAnalysis: riskEval });
  } catch (error: any) {
    if (error.errors) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    res.status(500).json({ error: error.message || 'Failed to create transaction' });
  }
});

// PUT update transaction
router.put('/:id', (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const existing = db.prepare('SELECT * FROM transactions WHERE id = ?').get(id) as any;
    if (!existing) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const validated = transactionSchema.parse(req.body);
    const existingList = getAllTransactions();

    // Re-evaluate risk
    const riskEval = evaluateTransactionRisk({ ...validated, id }, existingList);
    const riskFactors = riskEval.triggeredRules.filter((r) => r.triggered).map((r) => r.ruleName);
    const status = riskEval.riskLevel === 'critical' || riskEval.riskLevel === 'high' ? 'flagged' : 'analysed';
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      UPDATE transactions
      SET date = ?, amount = ?, type = ?, category = ?, counterparty = ?, description = ?,
          status = ?, risk_score = ?, risk_level = ?, risk_factors = ?, updated_at = ?
      WHERE id = ?
    `);

    stmt.run(
      validated.date,
      validated.amount,
      validated.type,
      validated.category,
      validated.counterparty,
      validated.description,
      status,
      riskEval.overallScore,
      riskEval.riskLevel,
      JSON.stringify(riskFactors),
      now,
      id
    );

    // CRITICAL REQUIREMENT: If this transaction has an existing verified decision,
    // mark it as 'requires_re-analysis' so we never silently preserve valid status after data changes!
    const existingDecision = db.prepare('SELECT id FROM decisions WHERE transaction_id = ?').get(id) as any;
    if (existingDecision) {
      db.prepare(`UPDATE decisions SET verification_status = 'requires_re-analysis' WHERE id = ?`).run(
        existingDecision.id
      );

      logAuditEvent({
        event_type: 'INTEGRITY_FAILED',
        entity_type: 'decision',
        entity_id: existingDecision.id,
        status: 'warning',
        details: {
          reason: 'Underlying transaction modified; prior cryptographic certificate invalidated and requires re-analysis',
          modifiedTxId: id,
        },
      });
    }

    logAuditEvent({
      event_type: 'TX_UPDATED',
      entity_type: 'transaction',
      entity_id: id,
      details: {
        updatedFields: validated,
        newRiskScore: riskEval.overallScore,
        decisionInvalidated: !!existingDecision,
      },
    });

    res.json({
      message: 'Transaction updated successfully',
      invalidatedDecision: existingDecision ? existingDecision.id : null,
    });
  } catch (error: any) {
    if (error.errors) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    res.status(500).json({ error: error.message || 'Failed to update transaction' });
  }
});

// DELETE transaction
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const existing = db.prepare('SELECT * FROM transactions WHERE id = ?').get(id) as any;
    if (!existing) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    db.prepare('DELETE FROM transactions WHERE id = ?').run(id);

    logAuditEvent({
      event_type: 'TX_DELETED',
      entity_type: 'transaction',
      entity_id: id,
      details: { counterparty: existing.counterparty, amount: existing.amount },
    });

    res.json({ message: 'Transaction deleted successfully', id });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to delete transaction' });
  }
});

// CSV Import
router.post('/import-csv', (req: Request, res: Response) => {
  try {
    const { csvData } = req.body;
    if (!csvData || typeof csvData !== 'string') {
      return res.status(400).json({ error: 'CSV data string is required' });
    }

    const lines = csvData.trim().split(/\r?\n/);
    if (lines.length < 2) {
      return res.status(400).json({ error: 'CSV must contain headers and at least one data row' });
    }

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const dateIdx = headers.indexOf('date');
    const amountIdx = headers.indexOf('amount');
    const typeIdx = headers.indexOf('type');
    const categoryIdx = headers.indexOf('category');
    const counterpartyIdx = headers.indexOf('counterparty');
    const descIdx = headers.indexOf('description');

    if (dateIdx === -1 || amountIdx === -1 || typeIdx === -1 || counterpartyIdx === -1) {
      return res.status(400).json({
        error: 'CSV missing required headers. Required columns: date, amount, type, counterparty (optional: category, description)',
      });
    }

    const existingList = getAllTransactions();
    let importedCount = 0;
    const errors: string[] = [];

    const insertStmt = db.prepare(`
      INSERT INTO transactions (id, date, amount, type, category, counterparty, description, status, risk_score, risk_level, risk_factors, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const now = new Date().toISOString();

    db.transaction(() => {
      for (let i = 1; i < lines.length; i++) {
        const row = lines[i].split(',').map((c) => c.trim().replace(/^["']|["']$/g, ''));
        if (row.length < 4 || !row[dateIdx]) continue;

        try {
          const rawAmount = parseFloat(row[amountIdx]);
          if (isNaN(rawAmount) || rawAmount <= 0) {
            errors.push(`Row ${i + 1}: Invalid amount "${row[amountIdx]}"`);
            continue;
          }

          const rawType = row[typeIdx].toLowerCase();
          const validTypes: any = ['credit', 'debit'];
          if (!validTypes.includes(rawType)) {
            errors.push(`Row ${i + 1}: Invalid type "${row[typeIdx]}", must be credit or debit`);
            continue;
          }

          const category = categoryIdx !== -1 && row[categoryIdx] ? row[categoryIdx] : 'Operating Expense';
          const description = descIdx !== -1 && row[descIdx] ? row[descIdx] : `Payment to ${row[counterpartyIdx]}`;
          const id = `TXN-CSV-${Date.now().toString().slice(-4)}${i}`;

          const rawTx = {
            id,
            date: row[dateIdx],
            amount: rawAmount,
            type: rawType as 'credit' | 'debit',
            category,
            counterparty: row[counterpartyIdx],
            description,
          };

          const riskEval = evaluateTransactionRisk(rawTx, existingList);
          const riskFactors = riskEval.triggeredRules.filter((r) => r.triggered).map((r) => r.ruleName);
          const status = riskEval.riskLevel === 'critical' || riskEval.riskLevel === 'high' ? 'flagged' : 'analysed';

          insertStmt.run(
            id,
            rawTx.date,
            rawTx.amount,
            rawTx.type,
            rawTx.category,
            rawTx.counterparty,
            rawTx.description,
            status,
            riskEval.overallScore,
            riskEval.riskLevel,
            JSON.stringify(riskFactors),
            now,
            now
          );

          importedCount++;
        } catch (rowErr: any) {
          errors.push(`Row ${i + 1}: ${rowErr.message}`);
        }
      }
    })();

    logAuditEvent({
      event_type: 'CSV_IMPORTED',
      entity_type: 'transaction',
      entity_id: `CSV-BATCH-${Date.now()}`,
      details: { importedCount, errorCount: errors.length },
    });

    res.json({
      message: `Successfully imported ${importedCount} transactions.`,
      importedCount,
      errors: errors.slice(0, 10),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to parse CSV' });
  }
});

export default router;
