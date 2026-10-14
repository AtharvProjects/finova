import { Transaction, SystemMetrics } from './types';

/**
 * Format a number into standard Indian Rupee notation (e.g. ₹12,50,000.00)
 */
export function formatINR(val: number, includeSymbol: boolean = true): string {
  const isNegative = val < 0;
  const absVal = Math.abs(val);
  const fixed = absVal.toFixed(2);
  const [integerPart, decimalPart] = fixed.split('.');

  // Indian grouping: last 3 digits, then groups of 2
  let result = '';
  if (integerPart.length <= 3) {
    result = integerPart;
  } else {
    const lastThree = integerPart.substring(integerPart.length - 3);
    const otherNumbers = integerPart.substring(0, integerPart.length - 3);
    const withCommas = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
    result = withCommas + ',' + lastThree;
  }

  const sign = isNegative ? '-' : '';
  const symbol = includeSymbol ? '₹' : '';
  return `${sign}${symbol}${result}.${decimalPart}`;
}

export interface AnomalyReportItem {
  id: string;
  type: 'DUPLICATE' | 'LARGE_AMOUNT' | 'VELOCITY_SPIKE' | 'MISSING_METADATA';
  severity: 'low' | 'moderate' | 'high' | 'critical';
  title: string;
  description: string;
  affectedTxIds: string[];
  evidence: string;
  recommendation: string;
}

export interface FinancialAnalysisReport {
  summary: {
    totalCredits: number;
    totalDebits: number;
    netCashFlow: number;
    averageAmount: number;
    totalTransactions: number;
    largestTransaction: { id: string; amount: number; counterparty: string } | null;
  };
  anomalies: AnomalyReportItem[];
  riskDistribution: {
    low: number;
    moderate: number;
    high: number;
    critical: number;
  };
  recommendations: string[];
  generatedAt: string;
}

export function calculateFinancialMetrics(transactions: Transaction[]): SystemMetrics {
  let totalCredits = 0;
  let totalDebits = 0;
  let highRiskCount = 0;
  let criticalRiskCount = 0;
  let totalValue = 0;

  for (const tx of transactions) {
    totalValue += tx.amount;
    if (tx.type === 'credit') {
      totalCredits += tx.amount;
    } else {
      totalDebits += tx.amount;
    }

    if (tx.risk_level === 'high') {
      highRiskCount++;
    } else if (tx.risk_level === 'critical') {
      criticalRiskCount++;
    }
  }

  const totalTransactions = transactions.length;
  const averageAmount = totalTransactions > 0 ? totalValue / totalTransactions : 0;
  const netCashFlow = totalCredits - totalDebits;

  return {
    totalTransactionValue: totalValue,
    totalTransactions,
    transactionsAnalysed: transactions.filter((t) => t.status !== 'pending').length,
    highRiskCount,
    criticalRiskCount,
    verifiedDecisionsCount: 0, // Populated from DB decisions count
    totalCredits,
    totalDebits,
    netCashFlow,
    averageAmount,
  };
}

export function runComprehensiveFinancialAnalysis(
  transactions: Transaction[],
  largeThreshold: number = 500000
): FinancialAnalysisReport {
  const metrics = calculateFinancialMetrics(transactions);

  const anomalies: AnomalyReportItem[] = [];
  const riskDistribution = {
    low: 0,
    moderate: 0,
    high: 0,
    critical: 0,
  };

  let largestTx: { id: string; amount: number; counterparty: string } | null = null;

  // 1. Scan for duplicates
  const seenTx = new Map<string, Transaction>();
  for (const tx of transactions) {
    riskDistribution[tx.risk_level] = (riskDistribution[tx.risk_level] || 0) + 1;

    if (!largestTx || tx.amount > largestTx.amount) {
      largestTx = { id: tx.id, amount: tx.amount, counterparty: tx.counterparty };
    }

    const key = `${tx.amount}_${tx.counterparty.trim().toLowerCase()}`;
    if (seenTx.has(key)) {
      const prev = seenTx.get(key)!;
      anomalies.push({
        id: `ANO-DUP-${tx.id}`,
        type: 'DUPLICATE',
        severity: 'high',
        title: 'Potential Duplicate Payment Detected',
        description: `Matching transaction found for ${formatINR(tx.amount)} with counterparty "${tx.counterparty}".`,
        affectedTxIds: [prev.id, tx.id],
        evidence: `Transaction ${tx.id} (${tx.date}) matches ${prev.id} (${prev.date}) for identical sum of ${formatINR(tx.amount)}.`,
        recommendation: 'Verify if multiple invoices exist or initiate duplicate refund / freeze prior to settlement.',
      });
    } else {
      seenTx.set(key, tx);
    }

    // 2. Scan for unusually large amounts
    if (tx.amount >= largeThreshold) {
      anomalies.push({
        id: `ANO-VAL-${tx.id}`,
        type: 'LARGE_AMOUNT',
        severity: tx.amount >= 2000000 ? 'critical' : 'high',
        title: 'Unusually Large Outflow / Inflow',
        description: `Transaction amount ${formatINR(tx.amount)} exceeds standard baseline threshold of ${formatINR(largeThreshold)}.`,
        affectedTxIds: [tx.id],
        evidence: `Amount represents ${((tx.amount / (metrics.averageAmount || 1))).toFixed(1)}x the average transaction volume.`,
        recommendation: 'Perform executive review and confirm board authorization for capital release.',
      });
    }

    // 3. Scan for vague or missing counterparty / metadata
    const counterparty = (tx.counterparty || '').trim();
    const description = (tx.description || '').trim();
    if (counterparty.length < 3 || counterparty.toLowerCase().includes('cash') || description.length < 5) {
      anomalies.push({
        id: `ANO-META-${tx.id}`,
        type: 'MISSING_METADATA',
        severity: 'moderate',
        title: 'Incomplete or Vague Transaction Description',
        description: `Counterparty or narrative lacks requisite audit clarity.`,
        affectedTxIds: [tx.id],
        evidence: `Counterparty: "${tx.counterparty}", Narrative: "${tx.description}".`,
        recommendation: 'Request full GST invoice, supplier PAN, and purchase order cross-reference.',
      });
    }
  }

  // Recommendations
  const recommendations: string[] = [];
  if (metrics.netCashFlow < 0) {
    recommendations.push(`Net cash flow is negative (${formatINR(metrics.netCashFlow)}). Monitor operational working capital reserves.`);
  } else {
    recommendations.push(`Positive net cash flow (${formatINR(metrics.netCashFlow)}) maintained across analyzed period.`);
  }

  if (anomalies.some((a) => a.type === 'DUPLICATE')) {
    recommendations.push('Immediate automated audit check recommended for flagged duplicate payments.');
  }

  if (riskDistribution.high + riskDistribution.critical > 0) {
    recommendations.push(`${riskDistribution.high + riskDistribution.critical} transactions flagged above high-risk tolerance. Escalate to Chief Risk Officer.`);
  } else {
    recommendations.push('Overall transaction portfolio conforms to standard low-risk financial profiles.');
  }

  return {
    summary: {
      totalCredits: metrics.totalCredits,
      totalDebits: metrics.totalDebits,
      netCashFlow: metrics.netCashFlow,
      averageAmount: metrics.averageAmount,
      totalTransactions: metrics.totalTransactions,
      largestTransaction: largestTx,
    },
    anomalies,
    riskDistribution,
    recommendations,
    generatedAt: new Date().toISOString(),
  };
}
