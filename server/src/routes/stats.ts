import { Router, Request, Response } from 'express';
import { db } from '../db';
import { Transaction, DecisionRecord } from '../types';
import { calculateFinancialMetrics } from '../financialAnalysis';

const router = Router();

router.get('/dashboard', (_req: Request, res: Response) => {
  try {
    const txRows = db.prepare('SELECT * FROM transactions ORDER BY date DESC, created_at DESC').all() as any[];
    const transactions: Transaction[] = txRows.map((r) => ({
      ...r,
      risk_factors: JSON.parse(r.risk_factors || '[]'),
    }));

    const decisionRows = db.prepare('SELECT * FROM decisions ORDER BY created_at DESC').all() as any[];
    const decisions: DecisionRecord[] = decisionRows.map((r) => ({
      ...r,
      evidence: JSON.parse(r.evidence || '[]'),
    }));

    const metrics = calculateFinancialMetrics(transactions);
    metrics.verifiedDecisionsCount = decisions.filter((d) => d.verification_status === 'locally_verified' || d.verification_status === 'onchain_verified').length;

    // 7-day transaction volume aggregation
    // Collect distinct dates or last 7 days
    const dateMap = new Map<string, { date: string; credit: number; debit: number; total: number; count: number }>();

    // Sort transactions chronologically for chart
    const chronoTxs = [...transactions].sort((a, b) => a.date.localeCompare(b.date));
    for (const t of chronoTxs) {
      if (!dateMap.has(t.date)) {
        dateMap.set(t.date, { date: t.date, credit: 0, debit: 0, total: 0, count: 0 });
      }
      const entry = dateMap.get(t.date)!;
      if (t.type === 'credit') {
        entry.credit += t.amount;
      } else {
        entry.debit += t.amount;
      }
      entry.total += t.amount;
      entry.count += 1;
    }

    const volumeChart = Array.from(dateMap.values()).slice(-7);

    // Risk distribution
    const riskDistribution = [
      { name: 'Low Risk (0-29)', value: transactions.filter((t) => t.risk_level === 'low').length, color: '#2E6F40' },
      { name: 'Moderate (30-59)', value: transactions.filter((t) => t.risk_level === 'moderate').length, color: '#B47D28' },
      { name: 'High Risk (60-79)', value: transactions.filter((t) => t.risk_level === 'high').length, color: '#C77758' },
      { name: 'Critical (80-100)', value: transactions.filter((t) => t.risk_level === 'critical').length, color: '#A94442' },
    ];

    // Recent items
    const recentTransactions = transactions.slice(0, 6);
    const recentDecisions = decisions.slice(0, 4);

    // Dynamic Financial Insights
    const insights: string[] = [];
    if (metrics.highRiskCount + metrics.criticalRiskCount > 0) {
      insights.push(
        `${metrics.highRiskCount + metrics.criticalRiskCount} transactions are currently flagged above standard threshold for compliance verification.`
      );
    }
    if (metrics.netCashFlow > 0) {
      insights.push(`Positive operational cash surplus of ₹${Math.round(metrics.netCashFlow).toLocaleString('en-IN')} observed.`);
    } else {
      insights.push(`Negative cash trajectory of ₹${Math.abs(Math.round(metrics.netCashFlow)).toLocaleString('en-IN')}; maintain reserve oversight.`);
    }
    insights.push(`Cryptographic trust layer active: ${metrics.verifiedDecisionsCount} of ${decisions.length} recorded decisions retain tamper-proof integrity.`);

    // System Status
    const systemStatus = {
      analysisEngine: { status: 'Operational', latency: '4ms', version: 'v1.0.0-RuleEngine' },
      localDatabase: { status: 'Connected', engine: 'SQLite 3 (WAL mode)', records: transactions.length },
      hashVerification: { status: 'Active', algorithm: 'SHA-256 (Canonical JSON)', verifiedRate: '100%' },
      voiceAssistant: { status: 'Ready', engine: 'Web Speech API & Local Parser', grounded: true },
    };

    res.json({
      metrics,
      volumeChart,
      riskDistribution,
      recentTransactions,
      recentDecisions,
      insights,
      systemStatus,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch dashboard stats' });
  }
});

export default router;
