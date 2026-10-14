import { Transaction, DecisionRecord, AuditEvent, DashboardStats } from '../types';

const BASE_URL = '/api';

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const res = await fetch(`${BASE_URL}/stats/dashboard`);
  if (!res.ok) throw new Error('Failed to load dashboard metrics');
  return res.json();
}

export async function fetchTransactions(params: Record<string, any> = {}): Promise<{
  transactions: Transaction[];
  pagination: { total: number; limit: number; offset: number };
}> {
  const query = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') query.append(k, String(v));
  }
  const res = await fetch(`${BASE_URL}/transactions?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch transactions');
  return res.json();
}

export async function fetchTransactionById(id: string): Promise<{ transaction: Transaction; decision: DecisionRecord | null }> {
  const res = await fetch(`${BASE_URL}/transactions/${id}`);
  if (!res.ok) throw new Error('Failed to fetch transaction details');
  return res.json();
}

export async function createTransaction(data: any): Promise<{ transaction: Transaction; riskAnalysis: any }> {
  const res = await fetch(`${BASE_URL}/transactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to create transaction');
  }
  return res.json();
}

export async function updateTransaction(id: string, data: any): Promise<any> {
  const res = await fetch(`${BASE_URL}/transactions/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to update transaction');
  }
  return res.json();
}

export async function deleteTransaction(id: string): Promise<any> {
  const res = await fetch(`${BASE_URL}/transactions/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete transaction');
  return res.json();
}

export async function importTransactionsCsv(csvData: string): Promise<any> {
  const res = await fetch(`${BASE_URL}/transactions/import-csv`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ csvData }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to import CSV');
  }
  return res.json();
}

export async function fetchDecisions(): Promise<{ decisions: DecisionRecord[] }> {
  const res = await fetch(`${BASE_URL}/decisions`);
  if (!res.ok) throw new Error('Failed to fetch decision records');
  return res.json();
}

export async function fetchDecisionById(id: string): Promise<{ decision: DecisionRecord; transaction: Transaction | null }> {
  const res = await fetch(`${BASE_URL}/decisions/${id}`);
  if (!res.ok) throw new Error('Failed to fetch decision details');
  return res.json();
}

export async function generateDecision(transactionId: string): Promise<{ decision: DecisionRecord }> {
  const res = await fetch(`${BASE_URL}/decisions/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transaction_id: transactionId }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to generate decision');
  }
  return res.json();
}

export async function verifyDecision(id: string): Promise<any> {
  const res = await fetch(`${BASE_URL}/decisions/${id}/verify`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to verify decision integrity');
  return res.json();
}

export async function runTamperDemo(decisionId: string, fieldToTamper: string, tamperedValue: any): Promise<any> {
  const res = await fetch(`${BASE_URL}/decisions/${decisionId}/tamper-demo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fieldToTamper, tamperedValue }),
  });
  if (!res.ok) throw new Error('Failed to run tamper demo');
  return res.json();
}

export async function fetchComprehensiveAnalysis(): Promise<any> {
  const res = await fetch(`${BASE_URL}/analysis/comprehensive`);
  if (!res.ok) throw new Error('Failed to run financial analysis');
  return res.json();
}

export async function evaluateSingleTx(data: any): Promise<any> {
  const res = await fetch(`${BASE_URL}/analysis/evaluate-single`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to evaluate transaction');
  return res.json();
}

export async function queryVoiceAssistant(query: string, language?: string): Promise<any> {
  const res = await fetch(`${BASE_URL}/voice/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, language }),
  });
  if (!res.ok) throw new Error('Voice assistant query failed');
  return res.json();
}

export async function fetchAuditTrail(eventType?: string): Promise<{ events: AuditEvent[] }> {
  const query = eventType && eventType !== 'ALL' ? `?event_type=${encodeURIComponent(eventType)}` : '';
  const res = await fetch(`${BASE_URL}/audit${query}`);
  if (!res.ok) throw new Error('Failed to fetch audit trail');
  return res.json();
}

export async function fetchSettings(): Promise<{ settings: Record<string, string> }> {
  const res = await fetch(`${BASE_URL}/settings`);
  if (!res.ok) throw new Error('Failed to fetch settings');
  return res.json();
}

export async function updateSettings(settings: Record<string, string>): Promise<any> {
  const res = await fetch(`${BASE_URL}/settings`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ settings }),
  });
  if (!res.ok) throw new Error('Failed to update settings');
  return res.json();
}

export async function resetDemoData(): Promise<any> {
  const res = await fetch(`${BASE_URL}/demo/reset`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to reset demo data');
  return res.json();
}

export async function clearAllData(): Promise<any> {
  const res = await fetch(`${BASE_URL}/demo/clear`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to clear database');
  return res.json();
}

export async function fetchVoicePersonas(): Promise<{
  personas: import('../types').NeuralVoicePersona[];
  elevenLabsPersonas: import('../types').NeuralVoicePersona[];
  defaultVoice: string;
  elevenLabsDefaultVoice: string;
  hasElevenLabsKey: boolean;
  maskedKey: string | null;
  engines: Array<{ id: string; name: string; subtitle: string }>;
}> {
  const res = await fetch(`${BASE_URL}/voice/personas`);
  if (!res.ok) throw new Error('Failed to fetch voice personas');
  return res.json();
}

export async function validateElevenLabsApiKey(apiKey?: string): Promise<{
  valid: boolean;
  tier?: string;
  characterCount?: number;
  characterLimit?: number;
  error?: string;
}> {
  const res = await fetch(`${BASE_URL}/voice/validate-key`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiKey }),
  });
  if (!res.ok) throw new Error('Failed to validate ElevenLabs key');
  return res.json();
}

export async function saveElevenLabsApiKey(apiKey: string): Promise<{
  success: boolean;
  hasKey: boolean;
  message: string;
}> {
  const res = await fetch(`${BASE_URL}/voice/save-key`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiKey }),
  });
  if (!res.ok) throw new Error('Failed to save ElevenLabs API key');
  return res.json();
}

export async function fetchNeuralAudioBlob(
  text: string,
  voiceId = 'en-IN-NeerjaNeural',
  rate = '+0%',
  pitch = '+0Hz',
  engine = 'neural',
  apiKey?: string
): Promise<Blob> {
  const res = await fetch(`${BASE_URL}/voice/tts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, voiceId, rate, pitch, engine, apiKey }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Speech synthesis failed' }));
    throw new Error(err.error || 'TTS synthesis failed');
  }
  return res.blob();
}

export function getNeuralAudioUrl(
  text: string,
  voiceId = 'en-IN-NeerjaNeural',
  rate = '+0%',
  pitch = '+0Hz',
  engine = 'neural',
  apiKey?: string
): string {
  const params = new URLSearchParams({ text, voiceId, rate, pitch, engine });
  if (apiKey) params.append('apiKey', apiKey);
  return `${BASE_URL}/voice/tts?${params.toString()}`;
}


