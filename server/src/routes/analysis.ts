import { Router, Request, Response } from 'express';
import { db } from '../db';
import { evaluateTransactionRisk, getRiskConfig } from '../riskEngine';
import { runComprehensiveFinancialAnalysis } from '../financialAnalysis';
import { logAuditEvent } from '../auditLogger';
import { Transaction } from '../types';

const router = Router();

// Run comprehensive portfolio financial analysis
router.get('/comprehensive', (_req: Request, res: Response) => {
  try {
    const rows = db.prepare('SELECT * FROM transactions ORDER BY date DESC').all() as any[];
    const transactions: Transaction[] = rows.map((r) => ({
      ...r,
      risk_factors: JSON.parse(r.risk_factors || '[]'),
    }));

    const config = getRiskConfig();
    const report = runComprehensiveFinancialAnalysis(transactions, config.largeTxThreshold);

    logAuditEvent({
      event_type: 'ANALYSIS_EXECUTED',
      entity_type: 'system',
      entity_id: 'PORTFOLIO_ANALYSIS',
      details: {
        totalEvaluated: transactions.length,
        anomaliesCount: report.anomalies.length,
        netCashFlow: report.summary.netCashFlow,
      },
    });

    res.json({ report, config });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to generate comprehensive analysis' });
  }
});

// Evaluate a hypothetical or single transaction (preview risk without saving)
router.post('/evaluate-single', (req: Request, res: Response) => {
  try {
    const rawTx = req.body;
    if (!rawTx.amount || !rawTx.counterparty || !rawTx.category) {
      return res.status(400).json({ error: 'amount, counterparty, and category are required' });
    }

    const allTxRows = db.prepare('SELECT * FROM transactions').all() as any[];
    const allTransactions: Transaction[] = allTxRows.map((r) => ({
      ...r,
      risk_factors: JSON.parse(r.risk_factors || '[]'),
    }));

    const result = evaluateTransactionRisk(rawTx, allTransactions);

    res.json({ result });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Evaluation failed' });
  }
});

export default router;
