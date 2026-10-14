import { Transaction, RiskLevel, RiskAnalysisResult, RuleEvaluationResult } from './types';
import { db } from './db';

export interface RiskConfig {
  largeTxThreshold: number; // e.g. 500,000
  criticalTxThreshold: number; // e.g. 2,000,000
  duplicateWindowHours: number; // e.g. 24
  highRiskThreshold: number; // e.g. 60
  criticalRiskThreshold: number; // e.g. 80
}

export function getRiskConfig(): RiskConfig {
  const defaults: RiskConfig = {
    largeTxThreshold: 500000,
    criticalTxThreshold: 2000000,
    duplicateWindowHours: 24,
    highRiskThreshold: 60,
    criticalRiskThreshold: 80,
  };

  try {
    const settingsRows = db.prepare('SELECT key, value FROM system_settings').all() as Array<{ key: string; value: string }>;
    const settingsMap = new Map(settingsRows.map((r) => [r.key, r.value]));

    return {
      largeTxThreshold: Number(settingsMap.get('large_tx_threshold') || defaults.largeTxThreshold),
      criticalTxThreshold: Number(settingsMap.get('critical_tx_threshold') || defaults.criticalTxThreshold),
      duplicateWindowHours: Number(settingsMap.get('duplicate_window_hours') || defaults.duplicateWindowHours),
      highRiskThreshold: Number(settingsMap.get('high_risk_threshold') || defaults.highRiskThreshold),
      criticalRiskThreshold: Number(settingsMap.get('critical_risk_threshold') || defaults.criticalRiskThreshold),
    };
  } catch {
    return defaults;
  }
}

/**
 * Deterministically evaluates a transaction against documented, transparent rules
 */
export function evaluateTransactionRisk(
  tx: Omit<Transaction, 'status' | 'risk_score' | 'risk_level' | 'risk_factors' | 'created_at' | 'updated_at'> & { id?: string },
  allTransactions: Transaction[] = []
): RiskAnalysisResult {
  const config = getRiskConfig();
  const rules: RuleEvaluationResult[] = [];
  let totalScore = 0;

  // 1. RULE: Baseline Value Check (High / Unusual Value Threshold)
  if (tx.amount >= config.criticalTxThreshold) {
    const points = 45;
    totalScore += points;
    rules.push({
      ruleId: 'RULE-VAL-01',
      ruleName: 'Ultra-High Outlier Amount',
      triggered: true,
      scoreContribution: points,
      reason: `Amount (₹${tx.amount.toLocaleString('en-IN')}) exceeds critical enterprise threshold of ₹${config.criticalTxThreshold.toLocaleString('en-IN')}`,
      severity: 'critical',
    });
  } else if (tx.amount >= config.largeTxThreshold) {
    const points = 25;
    totalScore += points;
    rules.push({
      ruleId: 'RULE-VAL-02',
      ruleName: 'Elevated Amount Threshold',
      triggered: true,
      scoreContribution: points,
      reason: `Amount (₹${tx.amount.toLocaleString('en-IN')}) exceeds standard review threshold of ₹${config.largeTxThreshold.toLocaleString('en-IN')}`,
      severity: 'moderate',
    });
  } else {
    rules.push({
      ruleId: 'RULE-VAL-03',
      ruleName: 'Standard Amount Range',
      triggered: false,
      scoreContribution: 0,
      reason: `Amount (₹${tx.amount.toLocaleString('en-IN')}) is within normal operating parameters`,
      severity: 'low',
    });
  }

  // 2. RULE: Duplicate Pattern Detection
  // Check against other transactions with same counterparty & amount within the time window
  const potentialDuplicates = allTransactions.filter((other) => {
    if (tx.id && other.id === tx.id) return false;
    const sameCounterparty = other.counterparty.trim().toLowerCase() === tx.counterparty.trim().toLowerCase();
    const sameAmount = Math.abs(other.amount - tx.amount) < 0.01;
    // Date comparison (within roughly 1 day)
    const d1 = new Date(tx.date).getTime();
    const d2 = new Date(other.date).getTime();
    const diffHours = Math.abs(d1 - d2) / (1000 * 60 * 60);
    return sameCounterparty && sameAmount && diffHours <= config.duplicateWindowHours;
  });

  if (potentialDuplicates.length > 0) {
    const points = 35;
    totalScore += points;
    rules.push({
      ruleId: 'RULE-DUP-01',
      ruleName: 'Duplicate Transaction Pattern',
      triggered: true,
      scoreContribution: points,
      reason: `Identical amount (₹${tx.amount.toLocaleString('en-IN')}) and counterparty "${tx.counterparty}" detected matching ${potentialDuplicates.map((d) => d.id).join(', ')}`,
      severity: 'high',
    });
  } else {
    rules.push({
      ruleId: 'RULE-DUP-02',
      ruleName: 'Duplicate Check Clear',
      triggered: false,
      scoreContribution: 0,
      reason: 'No duplicate payments found within time window',
      severity: 'low',
    });
  }

  // 3. RULE: Incomplete / Vague Entity or Description Information
  const desc = (tx.description || '').toLowerCase();
  const counterparty = (tx.counterparty || '').toLowerCase();
  const isVagueCounterparty =
    counterparty.length < 3 ||
    counterparty.includes('miscellaneous') ||
    counterparty.includes('cash') ||
    counterparty.includes('unknown') ||
    counterparty.includes('n/a');
  const isVagueDescription =
    desc.length < 5 ||
    desc.includes('misc') ||
    desc.includes('cash expense') ||
    desc.includes('temp transfer');

  if (isVagueCounterparty || isVagueDescription) {
    const points = 25;
    totalScore += points;
    rules.push({
      ruleId: 'RULE-INF-01',
      ruleName: 'Incomplete or Ambiguous Metadata',
      triggered: true,
      scoreContribution: points,
      reason: `Counterparty "${tx.counterparty}" or description "${tx.description}" lacks institutional identification or invoice cross-reference`,
      severity: 'moderate',
    });
  } else {
    rules.push({
      ruleId: 'RULE-INF-02',
      ruleName: 'Counterparty Metadata Verified',
      triggered: false,
      scoreContribution: 0,
      reason: 'Structured counterparty and valid narrative details provided',
      severity: 'low',
    });
  }

  // 4. RULE: High-Velocity or Frequency Anomaly
  const sameDateCount = allTransactions.filter(
    (other) => (!tx.id || other.id !== tx.id) && other.date === tx.date && other.counterparty.toLowerCase() === tx.counterparty.toLowerCase()
  ).length;

  if (sameDateCount >= 2) {
    const points = 20;
    totalScore += points;
    rules.push({
      ruleId: 'RULE-VEL-01',
      ruleName: 'High Counterparty Velocity',
      triggered: true,
      scoreContribution: points,
      reason: `High transaction frequency (${sameDateCount + 1} occurrences on ${tx.date}) with counterparty "${tx.counterparty}"`,
      severity: 'high',
    });
  } else {
    rules.push({
      ruleId: 'RULE-VEL-02',
      ruleName: 'Normal Frequency Velocity',
      triggered: false,
      scoreContribution: 0,
      reason: 'Transaction frequency is within expected velocity baseline',
      severity: 'low',
    });
  }

  // 5. RULE: Category Risk Profile
  const sensitiveCategories = ['Cash Disbursement', 'Capital Expenditure', 'Offshore Transfer', 'Unclassified'];
  if (sensitiveCategories.some((cat) => tx.category.toLowerCase().includes(cat.toLowerCase()))) {
    const points = 15;
    totalScore += points;
    rules.push({
      ruleId: 'RULE-CAT-01',
      ruleName: 'High-Audit Expense Category',
      triggered: true,
      scoreContribution: points,
      reason: `Category "${tx.category}" is flagged for mandatory compliance review`,
      severity: 'moderate',
    });
  }

  // Bound score between 0 and 100
  const finalScore = Math.min(100, Math.max(0, totalScore));

  // Determine Risk Category based on configurable thresholds
  let riskLevel: RiskLevel = 'low';
  if (finalScore >= config.criticalRiskThreshold) {
    riskLevel = 'critical';
  } else if (finalScore >= config.highRiskThreshold) {
    riskLevel = 'high';
  } else if (finalScore >= 30) {
    riskLevel = 'moderate';
  } else {
    riskLevel = 'low';
  }

  // Determine Recommended Action
  let recommendedAction = '';
  switch (riskLevel) {
    case 'critical':
      recommendedAction = 'Immediate Compliance Hold: Suspend transaction pending manual executive audit inquiry';
      break;
    case 'high':
      recommendedAction = 'Mandatory Secondary Review: Require senior financial controller approval and KYC verification';
      break;
    case 'moderate':
      recommendedAction = 'Routine Audit Flag: Reconcile supporting tax invoice and purchase order documentation';
      break;
    case 'low':
      recommendedAction = 'Standard Approval: Transaction meets straight-through verification parameters';
      break;
  }

  const triggeredCount = rules.filter((r) => r.triggered).length;
  const summary = `Evaluated against 5 core risk rules. ${triggeredCount} rule${triggeredCount === 1 ? '' : 's'} triggered resulting in a score of ${finalScore}/100 (${riskLevel.toUpperCase()}).`;

  return {
    overallScore: finalScore,
    riskLevel,
    summary,
    triggeredRules: rules,
    recommendedAction,
    timestamp: new Date().toISOString(),
  };
}
