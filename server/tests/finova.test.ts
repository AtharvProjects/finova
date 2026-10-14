import { describe, it, expect, beforeAll } from 'vitest';
import { initDatabase } from '../src/db';
import { canonicalStringify, computeCanonicalSha256, verifyRecordIntegrity, simulateTamperTest } from '../src/crypto';
import { formatINR, calculateFinancialMetrics, runComprehensiveFinancialAnalysis } from '../src/financialAnalysis';
import { evaluateTransactionRisk } from '../src/riskEngine';
import { Transaction } from '../src/types';

beforeAll(() => {
  initDatabase();
});

describe('FINOVA Cryptographic Trust Layer', () => {
  it('should deterministically sort object keys regardless of original insertion order', () => {
    const objA = { z: 1, a: 2, m: { y: 10, x: 20 } };
    const objB = { a: 2, m: { x: 20, y: 10 }, z: 1 };

    const canonicalA = canonicalStringify(objA);
    const canonicalB = canonicalStringify(objB);

    expect(canonicalA).toBe(canonicalB);
    expect(canonicalA).toBe('{"a":2,"m":{"x":20,"y":10},"z":1}');
  });

  it('should compute identical SHA-256 hash for identical data in different order', () => {
    const payload1 = { decisionId: 'DEC-1', riskScore: 75, status: 'approved' };
    const payload2 = { status: 'approved', decisionId: 'DEC-1', riskScore: 75 };

    const { hash: hash1 } = computeCanonicalSha256(payload1);
    const { hash: hash2 } = computeCanonicalSha256(payload2);

    expect(hash1).toBe(hash2);
    expect(hash1.length).toBe(64); // SHA-256 hex length
  });

  it('should pass verification when record is unmodified', () => {
    const payload = { decisionId: 'DEC-100', amount: 50000, counterparty: 'TCS' };
    const { hash } = computeCanonicalSha256(payload);

    const verification = verifyRecordIntegrity(payload, hash);
    expect(verification.isValid).toBe(true);
    expect(verification.match).toBe(true);
  });

  it('should fail verification when a protected field is tampered with', () => {
    const originalPayload = { decisionId: 'DEC-100', riskScore: 85, action: 'Hold' };
    const { hash: originalHash } = computeCanonicalSha256(originalPayload);

    // Tampered copy: hacker tries to lower risk score to 15
    const tamperedPayload = { ...originalPayload, riskScore: 15 };
    const verification = verifyRecordIntegrity(tamperedPayload, originalHash);

    expect(verification.isValid).toBe(false);
    expect(verification.match).toBe(false);
    expect(verification.computedHash).not.toBe(originalHash);
  });

  it('should safely simulate tamper test without modifying original state', () => {
    const originalPayload = { decisionId: 'DEC-200', riskScore: 70 };
    const { hash } = computeCanonicalSha256(originalPayload);

    const tamperResult = simulateTamperTest(originalPayload, hash, 'riskScore', 20);

    expect(tamperResult.isTamperedValid).toBe(false);
    expect(tamperResult.originalValue).toBe(70);
    expect(tamperResult.tamperedValue).toBe(20);
    expect(tamperResult.tamperedHash).not.toBe(tamperResult.originalHash);
    expect(originalPayload.riskScore).toBe(70); // original unmodified
  });
});

describe('FINOVA Financial Calculations & Indian Currency Formatting', () => {
  it('should format numbers according to the Indian grouping system (Lakhs & Crores)', () => {
    expect(formatINR(1000)).toBe('₹1,000.00');
    expect(formatINR(100000)).toBe('₹1,00,000.00'); // 1 Lakh
    expect(formatINR(2850000)).toBe('₹28,50,000.00'); // 28.5 Lakhs
    expect(formatINR(10000000)).toBe('₹1,00,00,000.00'); // 1 Crore
    expect(formatINR(-45000)).toBe('-₹45,000.00');
  });

  it('should accurately calculate net cash flow and averages', () => {
    const dummyTxs: Transaction[] = [
      {
        id: 'TXN-1',
        date: '2026-10-10',
        amount: 200000,
        type: 'credit',
        category: 'Client Invoicing',
        counterparty: 'Infosys',
        description: 'Test',
        status: 'analysed',
        risk_score: 10,
        risk_level: 'low',
        risk_factors: [],
        created_at: '',
        updated_at: '',
      },
      {
        id: 'TXN-2',
        date: '2026-10-11',
        amount: 50000,
        type: 'debit',
        category: 'Operating Expense',
        counterparty: 'Cloud Services',
        description: 'Test',
        status: 'analysed',
        risk_score: 15,
        risk_level: 'low',
        risk_factors: [],
        created_at: '',
        updated_at: '',
      },
    ];

    const metrics = calculateFinancialMetrics(dummyTxs);
    expect(metrics.totalCredits).toBe(200000);
    expect(metrics.totalDebits).toBe(50000);
    expect(metrics.netCashFlow).toBe(150000);
    expect(metrics.averageAmount).toBe(125000);
    expect(metrics.totalTransactions).toBe(2);
  });
});

describe('FINOVA Explainable Risk Scoring Engine', () => {
  it('should award low risk to standard small recurring transaction', () => {
    const normalTx = {
      amount: 15000,
      counterparty: 'Airtel Telecom',
      category: 'Operating Expense',
      description: 'Monthly office broadband lease line bill',
      date: '2026-10-12',
      type: 'debit' as const,
    };

    const result = evaluateTransactionRisk(normalTx, []);
    expect(result.riskLevel).toBe('low');
    expect(result.overallScore).toBeLessThan(30);
    expect(result.triggeredRules.find((r) => r.ruleId === 'RULE-VAL-03')?.triggered).toBe(false);
  });

  it('should trigger high/critical risk for ultra-high transaction value', () => {
    const highValueTx = {
      amount: 2850000, // 28.5 Lakhs
      counterparty: 'Apex Global Equities Ltd',
      category: 'Capital Expenditure',
      description: 'Unscheduled off-market equity purchase',
      date: '2026-10-11',
      type: 'debit' as const,
    };

    const result = evaluateTransactionRisk(highValueTx, []);
    expect(result.overallScore).toBeGreaterThanOrEqual(60);
    expect(result.riskLevel).toMatch(/high|critical/);
    const valRule = result.triggeredRules.find((r) => r.ruleId === 'RULE-VAL-01');
    expect(valRule?.triggered).toBe(true);
  });

  it('should detect duplicate transaction patterns', () => {
    const existingTx: Transaction = {
      id: 'TXN-EXISTING',
      date: '2026-10-09',
      amount: 45000,
      counterparty: 'CloudMatrix Tech',
      category: 'Operating Expense',
      description: 'Monthly Cloud GPU cluster compute',
      status: 'analysed',
      risk_score: 20,
      risk_level: 'low',
      risk_factors: [],
      type: 'debit',
      created_at: '',
      updated_at: '',
    };

    const duplicateCandidate = {
      id: 'TXN-NEW',
      date: '2026-10-09',
      amount: 45000,
      counterparty: 'CloudMatrix Tech',
      category: 'Operating Expense',
      description: 'Re-attempt GPU cluster compute',
      type: 'debit' as const,
    };

    const result = evaluateTransactionRisk(duplicateCandidate, [existingTx]);
    const dupRule = result.triggeredRules.find((r) => r.ruleId === 'RULE-DUP-01');
    expect(dupRule?.triggered).toBe(true);
    expect(dupRule?.scoreContribution).toBe(35);
  });
});

describe('FINOVA Realistic Voice Normalizer & Neural Personas', () => {
  it('should expose curated realistic neural personas including Neerja as recommended', async () => {
    const { NEURAL_VOICE_PERSONAS } = await import('../src/ttsService');
    expect(NEURAL_VOICE_PERSONAS.length).toBeGreaterThanOrEqual(5);
    const neerja = NEURAL_VOICE_PERSONAS.find((p) => p.id === 'en-IN-NeerjaNeural');
    expect(neerja).toBeDefined();
    expect(neerja?.isRecommended).toBe(true);
    expect(neerja?.locale).toBe('en-IN');
  });

  it('should phonetically normalize Indian Rupee amounts for natural speech', async () => {
    const { normalizeFinancialText } = await import('../src/ttsService');
    const input = 'Net cash flow is positive at ₹4,50,000.00 across all ledgers.';
    const normalized = normalizeFinancialText(input);
    expect(normalized).toContain('lakh rupees');
    expect(normalized).not.toContain('₹');
  });

  it('should normalize transaction IDs and crypto hashes into human speech format', async () => {
    const { normalizeFinancialText } = await import('../src/ttsService');
    const input = 'Transaction TXN-1002 with hash 0x8a9b2c3d4e5f1020 has SHA-256 verification.';
    const normalized = normalizeFinancialText(input);
    expect(normalized).toContain('Transaction 1 0 0 2');
    expect(normalized).toContain('S H A two fifty-six');
    expect(normalized).toContain('hash zero x 8 a 9 b');
  });

  it('should expose curated ElevenLabs voices including Sarah and Adam', async () => {
    const { ELEVENLABS_VOICES } = await import('../src/ttsService');
    expect(ELEVENLABS_VOICES.length).toBeGreaterThanOrEqual(5);
    const sarah = ELEVENLABS_VOICES.find((v) => v.id === 'EXAVITQu4vr4xnSDxMaL');
    expect(sarah).toBeDefined();
    expect(sarah?.provider).toBe('elevenlabs');
    expect(sarah?.isRecommended).toBe(true);

    const adam = ELEVENLABS_VOICES.find((v) => v.id === 'pNInz6obpgDQGcFmaJgB');
    expect(adam).toBeDefined();
    expect(adam?.provider).toBe('elevenlabs');
  });

  it('should seamlessly fallback to Azure Neural if ElevenLabs request fails', async () => {
    const { synthesizeUnifiedSpeech } = await import('../src/ttsService');
    const result = await synthesizeUnifiedSpeech({
      text: 'FINOVA automated fallback test verification.',
      engine: 'elevenlabs',
      apiKey: 'invalid_test_key_triggers_fallback',
    });

    expect(result.buffer).toBeDefined();
    expect(result.buffer.length).toBeGreaterThan(0);
    expect(result.fallbackOccurred).toBe(true);
    expect(result.engineUsed).toBe('neural');
  });

  it('should successfully synthesize speech via ElevenLabs with active credentials', async () => {
    const { synthesizeUnifiedSpeech } = await import('../src/ttsService');
    const result = await synthesizeUnifiedSpeech({
      text: 'FINOVA active key test.',
      engine: 'elevenlabs',
      voiceId: 'EXAVITQu4vr4xnSDxMaL',
    });

    expect(result.buffer).toBeDefined();
    expect(result.buffer.length).toBeGreaterThan(0);
    expect(result.engineUsed).toBe('elevenlabs');
    expect(result.fallbackOccurred).toBe(false);
  });
});

describe('FINOVA Bilingual Hindi & English Voice Intelligence', () => {
  it('should auto-detect Hindi Devanagari and Hinglish queries as bilingual', async () => {
    const { detectLanguageMode, containsDevanagari, containsHinglishKeywords } = await import('../src/voiceAssistant');

    expect(containsDevanagari('आज का कैश फ्लो बताओ')).toBe(true);
    expect(containsDevanagari('Net cash flow summary')).toBe(false);

    expect(containsHinglishKeywords('aaj ka net cash flow kitna hai?')).toBe(true);
    expect(containsHinglishKeywords('sabse zyada risk kis transaction me hai?')).toBe(true);
    expect(containsHinglishKeywords('What is the current net cash flow?')).toBe(false);

    expect(detectLanguageMode('आज का सारांश बताओ')).toBe('bilingual');
    expect(detectLanguageMode('kya koi high risk transaction hai?')).toBe('bilingual');
    expect(detectLanguageMode('Summarize today’s financial activity')).toBe('en');
    expect(detectLanguageMode('Summarize today’s activity', 'bilingual')).toBe('bilingual');
  });

  it('should generate fluent Hinglish spoken text and Devanagari script for cash flow queries', async () => {
    const { handleVoiceQuery } = await import('../src/voiceAssistant');
    const response = handleVoiceQuery('aaj ka net cash flow kitna hai?');

    expect(response.language).toBe('bilingual');
    expect(response.spokenText).toContain('net cash flow');
    expect(response.spokenText).toContain('kul');
    expect(response.spokenText).toContain('transactions');
    expect(response.spokenTextHindi).toBeDefined();
    expect(response.spokenTextHindi).toContain('कैश फ्लो');
    expect(response.spokenTextEnglish).toBeDefined();
    expect(response.spokenTextEnglish).toContain('net cash flow');
    expect(response.visualData?.title).toContain('नेट कैश फ्लो');
    expect(response.suggestedQuestions.length).toBeGreaterThan(0);
  });

  it('should generate bilingual responses for highest-risk deep dive queries', async () => {
    const { handleVoiceQuery } = await import('../src/voiceAssistant');
    const response = handleVoiceQuery('sabse zyada risk wala transaction samjhaiye');

    expect(response.language).toBe('bilingual');
    expect(response.spokenText).toContain('risk');
    expect(response.spokenTextHindi).toContain('जोखिम');
    expect(response.visualData?.title).toContain('जोखिम विश्लेषण');
  });

  it('should generate bilingual explanations for blockchain verification and hash proof', async () => {
    const { handleVoiceQuery } = await import('../src/voiceAssistant');
    const response = handleVoiceQuery('blockchain verification hash kaise kaam karta hai?');

    expect(response.language).toBe('bilingual');
    expect(response.spokenText).toContain('SHA-256');
    expect(response.spokenText).toContain('tampering');
    expect(response.spokenTextHindi).toContain('क्रिप्टोग्राफ़िक');
    expect(response.visualData?.title).toContain('हैश सत्यापन');
  });

  it('should normalize Hindi currency symbols and Devanagari numerals for TTS', async () => {
    const { normalizeFinancialText } = await import('../src/ttsService');

    // Devanagari numerals
    const devanagariText = 'कुल राशि ₹५,००,००० है।';
    const normDevanagari = normalizeFinancialText(devanagariText);
    expect(normDevanagari).toContain('5 lakh rupees');

    // Alternative currency abbreviations: रु and Rs.
    const ruText = 'बचत रु 2,50,000 दर्ज है';
    const normRu = normalizeFinancialText(ruText);
    expect(normRu).toContain('2.5 lakh rupees');

    const rsText = 'Net inflow Rs. 10000000 reached';
    const normRs = normalizeFinancialText(rsText);
    expect(normRs).toContain('1 crore rupees');
  });

  it('should offer dedicated Swara and Madhur bilingual neural voice personas', async () => {
    const { NEURAL_VOICE_PERSONAS } = await import('../src/ttsService');
    const swara = NEURAL_VOICE_PERSONAS.find((p) => p.id === 'hi-IN-SwaraNeural');
    const madhur = NEURAL_VOICE_PERSONAS.find((p) => p.id === 'hi-IN-MadhurNeural');

    expect(swara).toBeDefined();
    expect(swara?.locale).toBe('hi-IN');
    expect(madhur).toBeDefined();
    expect(madhur?.locale).toBe('hi-IN');
  });
});



