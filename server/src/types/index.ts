export type TransactionType = 'credit' | 'debit';
export type RiskLevel = 'low' | 'moderate' | 'high' | 'critical';
export type TransactionStatus = 'pending' | 'analysed' | 'flagged' | 'verified';
export type VerificationStatus = 'locally_verified' | 'tampered' | 'requires_re-analysis' | 'onchain_verified';

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  amount: number; // in INR
  type: TransactionType;
  category: string;
  counterparty: string;
  description: string;
  status: TransactionStatus;
  risk_score: number;
  risk_level: RiskLevel;
  risk_factors: string[]; // parsed array
  created_at: string;
  updated_at: string;
}

export interface DecisionRecord {
  id: string;
  transaction_id: string;
  transaction_ref: string;
  risk_score: number;
  risk_category: RiskLevel;
  suggested_action: string;
  reasoning: string;
  evidence: Array<{
    ruleId: string;
    ruleName: string;
    points: number;
    description: string;
    severity: 'low' | 'moderate' | 'high' | 'critical';
  }>;
  canonical_payload: string;
  canonical_hash: string;
  verification_status: VerificationStatus;
  created_at: string;
  verified_at?: string;
  onchain_tx_hash?: string;
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  event_type: 
    | 'TX_CREATED'
    | 'TX_UPDATED'
    | 'TX_DELETED'
    | 'CSV_IMPORTED'
    | 'ANALYSIS_EXECUTED'
    | 'RISK_SCORED'
    | 'DECISION_CREATED'
    | 'HASH_GENERATED'
    | 'INTEGRITY_VERIFIED'
    | 'INTEGRITY_FAILED'
    | 'TAMPER_DEMO_RUN'
    | 'DATA_RESET'
    | 'DEMO_DATA_LOADED'
    | 'RECORD_EXPORTED';
  entity_type: 'transaction' | 'decision' | 'system' | 'audit';
  entity_id: string;
  actor: string;
  details: any;
  status: 'success' | 'warning' | 'alert';
}

export interface RuleEvaluationResult {
  ruleId: string;
  ruleName: string;
  triggered: boolean;
  scoreContribution: number;
  reason: string;
  severity: RiskLevel;
}

export interface RiskAnalysisResult {
  overallScore: number;
  riskLevel: RiskLevel;
  summary: string;
  triggeredRules: RuleEvaluationResult[];
  recommendedAction: string;
  timestamp: string;
}

export interface SystemMetrics {
  totalTransactionValue: number;
  totalTransactions: number;
  transactionsAnalysed: number;
  highRiskCount: number;
  criticalRiskCount: number;
  verifiedDecisionsCount: number;
  totalCredits: number;
  totalDebits: number;
  netCashFlow: number;
  averageAmount: number;
}
