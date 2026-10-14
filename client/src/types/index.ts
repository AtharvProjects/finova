export type TransactionType = 'credit' | 'debit';
export type RiskLevel = 'low' | 'moderate' | 'high' | 'critical';
export type TransactionStatus = 'pending' | 'analysed' | 'flagged' | 'verified';
export type VerificationStatus = 'locally_verified' | 'tampered' | 'requires_re-analysis' | 'onchain_verified';

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  type: TransactionType;
  category: string;
  counterparty: string;
  description: string;
  status: TransactionStatus;
  risk_score: number;
  risk_level: RiskLevel;
  risk_factors: string[];
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
    points?: number;
    scoreContribution?: number;
    description?: string;
    reason?: string;
    severity: RiskLevel;
    triggered?: boolean;
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
  event_type: string;
  entity_type: 'transaction' | 'decision' | 'system' | 'audit';
  entity_id: string;
  actor: string;
  details: any;
  status: 'success' | 'warning' | 'alert';
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

export interface DashboardStats {
  metrics: SystemMetrics;
  volumeChart: Array<{ date: string; credit: number; debit: number; total: number; count: number }>;
  riskDistribution: Array<{ name: string; value: number; color: string }>;
  recentTransactions: Transaction[];
  recentDecisions: DecisionRecord[];
  insights: string[];
  systemStatus: {
    analysisEngine: { status: string; latency: string; version: string };
    localDatabase: { status: string; engine: string; records: number };
    hashVerification: { status: string; algorithm: string; verifiedRate: string };
    voiceAssistant: { status: string; engine: string; grounded: boolean };
  };
}

export type VoiceEngineType = 'elevenlabs' | 'neural' | 'browser';

export interface NeuralVoicePersona {
  id: string;
  name: string;
  locale: string;
  gender: 'Female' | 'Male';
  role: string;
  accent: string;
  description: string;
  sampleText: string;
  isRecommended: boolean;
  provider?: 'elevenlabs' | 'azure_edge';
}

export interface VoiceConfig {
  engine: VoiceEngineType;
  voiceId: string;
  rate: string;
  pitch: string;
  autoSpeak: boolean;
  elevenLabsApiKey?: string;
}


