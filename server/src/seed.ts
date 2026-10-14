import { db, initDatabase } from './db';
import { evaluateTransactionRisk } from './riskEngine';
import { computeCanonicalSha256 } from './crypto';
import { logAuditEvent } from './auditLogger';

export function seedDemoData() {
  initDatabase();

  // Clear existing records to ensure clean state
  db.exec(`
    DELETE FROM decisions;
    DELETE FROM transactions;
    DELETE FROM audit_trail;
  `);

  const demoRawTransactions = [
    {
      id: 'TXN-2026-101',
      date: '2026-10-08',
      amount: 145000,
      type: 'credit',
      category: 'Client Invoicing',
      counterparty: 'Tata Consultancy Services Ltd',
      description: 'Milestone 2 API Integration Retainer for Q3',
    },
    {
      id: 'TXN-2026-102',
      date: '2026-10-09',
      amount: 45000,
      type: 'debit',
      category: 'Operating Expense',
      counterparty: 'CloudMatrix Technologies Pvt Ltd',
      description: 'Monthly Cloud GPU cluster compute invoice #CM-9082',
    },
    {
      id: 'TXN-2026-103',
      date: '2026-10-09',
      amount: 45000,
      type: 'debit',
      category: 'Operating Expense',
      counterparty: 'CloudMatrix Technologies Pvt Ltd',
      description: 'Duplicate re-submission: GPU cluster compute #CM-9082 (Flagged Duplicate)',
    },
    {
      id: 'TXN-2026-104',
      date: '2026-10-10',
      amount: 850000,
      type: 'credit',
      category: 'Client Invoicing',
      counterparty: 'Infosys BPM Enterprise',
      description: 'Enterprise AI Governance Advisory Annual License Fee',
    },
    {
      id: 'TXN-2026-105',
      date: '2026-10-10',
      amount: 320000,
      type: 'debit',
      category: 'Salary',
      counterparty: 'HDFC Corporate Payroll Services',
      description: 'Monthly payroll batch transfer for Core Engineering team',
    },
    {
      id: 'TXN-2026-106',
      date: '2026-10-11',
      amount: 38000,
      type: 'debit',
      category: 'Operating Expense',
      counterparty: 'Regus Workspace Bandra Kurla Complex',
      description: 'Lease & Managed executive desk facilities for Mumbai hub',
    },
    {
      id: 'TXN-2026-107',
      date: '2026-10-11',
      amount: 2850000,
      type: 'debit',
      category: 'Capital Expenditure',
      counterparty: 'Apex Global Equities Ltd',
      description: 'Unscheduled off-market equity treasury purchase without prior mandate (Outlier High Value)',
    },
    {
      id: 'TXN-2026-108',
      date: '2026-10-12',
      amount: 18500,
      type: 'debit',
      category: 'Cash Disbursement',
      counterparty: 'Cash / Unknown',
      description: 'Misc expense petty cash withdrawal without tax invoice (Incomplete Metadata)',
    },
    {
      id: 'TXN-2026-109',
      date: '2026-10-12',
      amount: 95000,
      type: 'credit',
      category: 'Consulting',
      counterparty: 'Razorpay Software Pvt Ltd',
      description: 'Technical advisory settlement for FinTech sandbox compliance',
    },
    {
      id: 'TXN-2026-110',
      date: '2026-10-13',
      amount: 22000,
      type: 'debit',
      category: 'Operating Expense',
      counterparty: 'Airtel Enterprise Telecom',
      description: 'Dedicated high-speed fiber leased line broadband payment',
    },
  ];

  const insertTx = db.prepare(`
    INSERT INTO transactions (id, date, amount, type, category, counterparty, description, status, risk_score, risk_level, risk_factors, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // First convert all raw txs into full evaluations
  const evaluatedTransactions: any[] = [];
  const now = new Date().toISOString();

  for (const raw of demoRawTransactions) {
    const riskResult = evaluateTransactionRisk(raw as any, evaluatedTransactions);
    const riskFactors = riskResult.triggeredRules.filter((r) => r.triggered).map((r) => r.ruleName);

    const fullTx = {
      ...raw,
      status: riskResult.riskLevel === 'critical' || riskResult.riskLevel === 'high' ? 'flagged' : 'analysed',
      risk_score: riskResult.overallScore,
      risk_level: riskResult.riskLevel,
      risk_factors: JSON.stringify(riskFactors),
      created_at: now,
      updated_at: now,
    };

    insertTx.run(
      fullTx.id,
      fullTx.date,
      fullTx.amount,
      fullTx.type,
      fullTx.category,
      fullTx.counterparty,
      fullTx.description,
      fullTx.status,
      fullTx.risk_score,
      fullTx.risk_level,
      fullTx.risk_factors,
      fullTx.created_at,
      fullTx.updated_at
    );

    evaluatedTransactions.push(fullTx);
  }

  // Pre-generate verified decisions for presentation
  const keyTx = evaluatedTransactions.find((t) => t.id === 'TXN-2026-107'); // High-risk Apex Global
  if (keyTx) {
    const riskEval = evaluateTransactionRisk(keyTx, evaluatedTransactions);
    const decisionId = 'DEC-2026-801';
    const canonicalPayloadObj = {
      decisionId,
      transactionRef: keyTx.id,
      counterparty: keyTx.counterparty,
      amountINR: keyTx.amount,
      riskScore: riskEval.overallScore,
      riskCategory: riskEval.riskLevel,
      suggestedAction: riskEval.recommendedAction,
      evidenceSummary: riskEval.triggeredRules.filter((r) => r.triggered).map((r) => r.ruleName),
      timestamp: '2026-10-11T14:32:00.000Z',
      platformVersion: 'FINOVA-v1.0.0-PROTOTYPE',
    };

    const { canonicalJson, hash } = computeCanonicalSha256(canonicalPayloadObj);

    const insertDecision = db.prepare(`
      INSERT INTO decisions (id, transaction_id, transaction_ref, risk_score, risk_category, suggested_action, reasoning, evidence, canonical_payload, canonical_hash, verification_status, created_at, verified_at, onchain_tx_hash)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertDecision.run(
      decisionId,
      keyTx.id,
      keyTx.id,
      riskEval.overallScore,
      riskEval.riskLevel,
      riskEval.recommendedAction,
      riskEval.summary,
      JSON.stringify(riskEval.triggeredRules),
      canonicalJson,
      hash,
      'locally_verified',
      '2026-10-11T14:32:00.000Z',
      '2026-10-11T14:32:05.000Z',
      '0x4e83c79d12a35b1c9027f674da309a1e7b2354cf176a928731d6244fbe2c019a'
    );
  }

  // Pre-generate verified decision for duplicate transaction
  const dupTx = evaluatedTransactions.find((t) => t.id === 'TXN-2026-103');
  if (dupTx) {
    const riskEval = evaluateTransactionRisk(dupTx, evaluatedTransactions);
    const decisionId = 'DEC-2026-802';
    const canonicalPayloadObj = {
      decisionId,
      transactionRef: dupTx.id,
      counterparty: dupTx.counterparty,
      amountINR: dupTx.amount,
      riskScore: riskEval.overallScore,
      riskCategory: riskEval.riskLevel,
      suggestedAction: riskEval.recommendedAction,
      evidenceSummary: riskEval.triggeredRules.filter((r) => r.triggered).map((r) => r.ruleName),
      timestamp: '2026-10-09T16:15:00.000Z',
      platformVersion: 'FINOVA-v1.0.0-PROTOTYPE',
    };

    const { canonicalJson, hash } = computeCanonicalSha256(canonicalPayloadObj);

    const insertDecision = db.prepare(`
      INSERT INTO decisions (id, transaction_id, transaction_ref, risk_score, risk_category, suggested_action, reasoning, evidence, canonical_payload, canonical_hash, verification_status, created_at, verified_at, onchain_tx_hash)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertDecision.run(
      decisionId,
      dupTx.id,
      dupTx.id,
      riskEval.overallScore,
      riskEval.riskLevel,
      riskEval.recommendedAction,
      riskEval.summary,
      JSON.stringify(riskEval.triggeredRules),
      canonicalJson,
      hash,
      'locally_verified',
      '2026-10-09T16:15:00.000Z',
      '2026-10-09T16:15:02.000Z',
      null
    );
  }

  // Seed initial audit trail
  logAuditEvent({
    event_type: 'DEMO_DATA_LOADED',
    entity_type: 'system',
    entity_id: 'SYSTEM-INIT',
    details: { message: 'Initialized 10 realistic Indian fintech demo transactions, 2 verified decisions, and baseline risk rules.' },
  });

  logAuditEvent({
    event_type: 'DECISION_CREATED',
    entity_type: 'decision',
    entity_id: 'DEC-2026-801',
    details: { ruleTriggered: 'Ultra-High Outlier Amount', score: 65, action: 'Mandatory Secondary Review' },
  });

  logAuditEvent({
    event_type: 'HASH_GENERATED',
    entity_type: 'decision',
    entity_id: 'DEC-2026-801',
    details: { algorithm: 'SHA-256', canonicalKeys: 8 },
  });

  logAuditEvent({
    event_type: 'INTEGRITY_VERIFIED',
    entity_type: 'decision',
    entity_id: 'DEC-2026-801',
    details: { result: 'PASSED', hashMatch: true },
  });

  console.log('FINOVA demo dataset seeded successfully.');
}

if (require.main === module) {
  seedDemoData();
}
