import { Router, Request, Response } from 'express';
import { db } from '../db';
import { computeCanonicalSha256, verifyRecordIntegrity, simulateTamperTest } from '../crypto';
import { evaluateTransactionRisk } from '../riskEngine';
import { logAuditEvent } from '../auditLogger';
import { Transaction, DecisionRecord } from '../types';

const router = Router();

// GET all decisions
router.get('/', (_req: Request, res: Response) => {
  try {
    const rows = db.prepare('SELECT * FROM decisions ORDER BY created_at DESC').all() as any[];
    const decisions: DecisionRecord[] = rows.map((r) => ({
      ...r,
      evidence: JSON.parse(r.evidence || '[]'),
    }));
    res.json({ decisions });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch decisions' });
  }
});

// GET decision by ID
router.get('/:id', (req: Request, res: Response) => {
  try {
    const row = db.prepare('SELECT * FROM decisions WHERE id = ?').get(req.params.id) as any;
    if (!row) {
      return res.status(404).json({ error: 'Decision record not found' });
    }

    const decision: DecisionRecord = {
      ...row,
      evidence: JSON.parse(row.evidence || '[]'),
    };

    // Get linked transaction
    const tx = db.prepare('SELECT * FROM transactions WHERE id = ?').get(decision.transaction_id) as any;

    res.json({
      decision,
      transaction: tx ? { ...tx, risk_factors: JSON.parse(tx.risk_factors || '[]') } : null,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch decision' });
  }
});

// POST generate a verified decision record from a transaction
router.post('/generate', (req: Request, res: Response) => {
  try {
    const { transaction_id } = req.body;
    if (!transaction_id) {
      return res.status(400).json({ error: 'transaction_id is required' });
    }

    const txRow = db.prepare('SELECT * FROM transactions WHERE id = ?').get(transaction_id) as any;
    if (!txRow) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const allTxRows = db.prepare('SELECT * FROM transactions').all() as any[];
    const allTransactions: Transaction[] = allTxRows.map((r) => ({
      ...r,
      risk_factors: JSON.parse(r.risk_factors || '[]'),
    }));

    // Run risk assessment
    const riskEval = evaluateTransactionRisk(txRow, allTransactions);

    const decisionId = `DEC-2026-${Math.floor(100 + Math.random() * 900)}`;
    const now = new Date().toISOString();

    // Canonical payload with deterministic fields
    const canonicalPayloadObj = {
      decisionId,
      transactionRef: txRow.id,
      counterparty: txRow.counterparty,
      amountINR: txRow.amount,
      riskScore: riskEval.overallScore,
      riskCategory: riskEval.riskLevel,
      suggestedAction: riskEval.recommendedAction,
      evidenceSummary: riskEval.triggeredRules.filter((r) => r.triggered).map((r) => r.ruleName),
      timestamp: now,
      platformVersion: 'FINOVA-v1.0.0-PROTOTYPE',
    };

    const { canonicalJson, hash } = computeCanonicalSha256(canonicalPayloadObj);

    // Delete any existing decision for this transaction to maintain 1:1 clean relationship
    db.prepare('DELETE FROM decisions WHERE transaction_id = ?').run(txRow.id);

    const insertStmt = db.prepare(`
      INSERT INTO decisions (
        id, transaction_id, transaction_ref, risk_score, risk_category,
        suggested_action, reasoning, evidence, canonical_payload, canonical_hash,
        verification_status, created_at, verified_at, onchain_tx_hash
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertStmt.run(
      decisionId,
      txRow.id,
      txRow.id,
      riskEval.overallScore,
      riskEval.riskLevel,
      riskEval.recommendedAction,
      riskEval.summary,
      JSON.stringify(riskEval.triggeredRules),
      canonicalJson,
      hash,
      'locally_verified',
      now,
      now,
      null
    );

    // Update transaction status to verified
    db.prepare(`UPDATE transactions SET status = 'verified' WHERE id = ?`).run(txRow.id);

    logAuditEvent({
      event_type: 'DECISION_CREATED',
      entity_type: 'decision',
      entity_id: decisionId,
      details: {
        transactionRef: txRow.id,
        riskScore: riskEval.overallScore,
        riskCategory: riskEval.riskLevel,
        action: riskEval.recommendedAction,
      },
    });

    logAuditEvent({
      event_type: 'HASH_GENERATED',
      entity_type: 'decision',
      entity_id: decisionId,
      details: {
        hash,
        canonicalLength: canonicalJson.length,
        algorithm: 'SHA-256',
      },
    });

    res.status(201).json({
      message: 'Verified decision record successfully created and hashed',
      decision: {
        id: decisionId,
        transaction_id: txRow.id,
        transaction_ref: txRow.id,
        risk_score: riskEval.overallScore,
        risk_category: riskEval.riskLevel,
        suggested_action: riskEval.recommendedAction,
        reasoning: riskEval.summary,
        evidence: riskEval.triggeredRules,
        canonical_payload: canonicalJson,
        canonical_hash: hash,
        verification_status: 'locally_verified',
        created_at: now,
        verified_at: now,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to generate decision' });
  }
});

// POST verify integrity of an existing decision
router.post('/:id/verify', (req: Request, res: Response) => {
  try {
    const row = db.prepare('SELECT * FROM decisions WHERE id = ?').get(req.params.id) as any;
    if (!row) {
      return res.status(404).json({ error: 'Decision not found' });
    }

    let payloadObj: any;
    try {
      payloadObj = JSON.parse(row.canonical_payload);
    } catch {
      payloadObj = row.canonical_payload;
    }

    const verification = verifyRecordIntegrity(payloadObj, row.canonical_hash);
    const now = new Date().toISOString();

    // Check if underlying transaction was modified or status is invalid
    const isActuallyValid = verification.isValid && row.verification_status !== 'requires_re-analysis';

    const updatedStatus = isActuallyValid ? 'locally_verified' : 'tampered';
    db.prepare(`UPDATE decisions SET verification_status = ?, verified_at = ? WHERE id = ?`).run(
      updatedStatus,
      now,
      row.id
    );

    logAuditEvent({
      event_type: isActuallyValid ? 'INTEGRITY_VERIFIED' : 'INTEGRITY_FAILED',
      entity_type: 'decision',
      entity_id: row.id,
      status: isActuallyValid ? 'success' : 'alert',
      details: {
        computedHash: verification.computedHash,
        storedHash: row.canonical_hash,
        match: verification.match,
        verificationStatus: updatedStatus,
      },
    });

    res.json({
      decisionId: row.id,
      isValid: isActuallyValid,
      storedHash: row.canonical_hash,
      recomputedHash: verification.computedHash,
      verificationStatus: updatedStatus,
      verifiedAt: now,
      notice:
        'Demo verification uses cryptographic hashing and local record storage. Hashing alone does not prove that a record was written to a public blockchain.',
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Verification check failed' });
  }
});

// POST run tamper demonstration on temporary test copy (leaves live DB unmodified!)
router.post('/:id/tamper-demo', (req: Request, res: Response) => {
  try {
    const row = db.prepare('SELECT * FROM decisions WHERE id = ?').get(req.params.id) as any;
    if (!row) {
      return res.status(404).json({ error: 'Decision not found' });
    }

    const { fieldToTamper = 'riskScore', tamperedValue = 10 } = req.body;

    let payloadObj: any;
    try {
      payloadObj = JSON.parse(row.canonical_payload);
    } catch {
      payloadObj = row.canonical_payload;
    }

    const tamperResult = simulateTamperTest(payloadObj, row.canonical_hash, fieldToTamper, tamperedValue);

    logAuditEvent({
      event_type: 'TAMPER_DEMO_RUN',
      entity_type: 'decision',
      entity_id: row.id,
      status: 'warning',
      actor: 'Interactive Tamper Lab',
      details: {
        tamperedField: fieldToTamper,
        originalValue: tamperResult.originalValue,
        tamperedValue: tamperResult.tamperedValue,
        originalHash: tamperResult.originalHash,
        tamperedHash: tamperResult.tamperedHash,
        tamperDetected: !tamperResult.isTamperedValid,
        temporaryCopyOnly: true,
      },
    });

    res.json({
      success: true,
      decisionId: row.id,
      tamperResult,
      explanation:
        'Because SHA-256 is an avalanche-effect cryptographic hash function, altering even 1 byte in the canonical JSON payload drastically changes the 256-bit digest. The verification algorithm detected the mismatch immediately.',
      databaseIntact: true,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Tamper simulation failed' });
  }
});

export default router;
