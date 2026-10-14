import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  ShieldCheck,
  ShieldAlert,
  Code,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  Copy,
  Check,
  AlertTriangle,
  Info,
  Layers,
} from 'lucide-react';
import { fetchDecisions, verifyDecision } from '../lib/api';
import { formatDateTime, formatDate, truncateHash, getVerificationBadgeClasses, getRiskBadgeClasses } from '../lib/formatters';
import { DecisionRecord } from '../types';
import { useToast } from '../components/common/Toast';
import { TamperLabModal } from '../components/decisions/TamperLabModal';
import { CanonicalPayloadModal } from '../components/decisions/CanonicalPayloadModal';

export const VerifiedDecisionsPage: React.FC = () => {
  const { refreshTrigger, onRefresh } = useOutletContext<{ refreshTrigger: number; onRefresh: () => void }>();
  const { showToast } = useToast();

  const [decisions, setDecisions] = useState<DecisionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  // Modals
  const [selectedTamperDecision, setSelectedTamperDecision] = useState<DecisionRecord | null>(null);
  const [selectedCanonicalDecision, setSelectedCanonicalDecision] = useState<DecisionRecord | null>(null);
  const [copiedHashId, setCopiedHashId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchDecisions();
      setDecisions(data.decisions);
    } catch (err: any) {
      showToast('Error', err.message || 'Failed to load decisions', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [refreshTrigger]);

  const handleVerify = async (id: string) => {
    setVerifyingId(id);
    try {
      const res = await verifyDecision(id);
      if (res.isValid) {
        showToast('Integrity Confirmed', `SHA-256 digest verified for record ${id}`, 'success');
      } else {
        showToast('Verification Failed', `Cryptographic hash mismatch or modified underlying data for ${id}`, 'error');
      }
      onRefresh();
      loadData();
    } catch (err: any) {
      showToast('Error', err.message || 'Verification check failed', 'error');
    } finally {
      setVerifyingId(null);
    }
  };

  const handleCopyHash = (id: string, hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHashId(id);
    setTimeout(() => setCopiedHashId(null), 2000);
    showToast('Copied', 'SHA-256 digest copied to clipboard', 'info');
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-[#292D2B]">Cryptographically Verified Decision Records</h2>
          <p className="text-xs text-[#77766F]">
            Immutable SHA-256 canonical fingerprints anchoring financial risk intelligence
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="px-3 py-1 bg-white border border-[#E6E0D6] rounded-md text-[#244A3D] font-medium flex items-center gap-1.5 shadow-xs">
            <Layers className="w-3.5 h-3.5" />
            <span>Total Verified: <strong>{decisions.length}</strong></span>
          </span>
        </div>
      </div>

      {/* Prominent Truth-in-Tech Disclaimer */}
      <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#E8DCCB] shadow-xs flex items-start gap-3">
        <Info className="w-5 h-5 text-[#C77758] shrink-0 mt-0.5" />
        <div className="text-xs text-[#77766F] leading-relaxed">
          <strong className="text-[#292D2B]">Technical Trust Transparency:</strong>{' '}
          Demo verification uses cryptographic canonical SHA-256 hashing and local append-only database storage. Hashing alone proves that decision contents have not been modified since creation, but does not prove writing to a public blockchain consensus network unless an on-chain transaction hash is confirmed.
        </div>
      </div>

      {/* Decision Records Grid */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="w-6 h-6 border-2 border-[#244A3D] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : decisions.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-[#E6E0D6] shadow-xs max-w-lg mx-auto">
          <ShieldAlert className="w-10 h-10 text-[#77766F] mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-[#292D2B] mb-1">No Verified Decisions On Record</h3>
          <p className="text-xs text-[#77766F] mb-4">
            Generate your first decision certificate by selecting any transaction in the ledger.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {decisions.map((dec) => {
            const badge = getVerificationBadgeClasses(dec.verification_status);
            const riskBadge = getRiskBadgeClasses(dec.risk_category);
            const isVerifying = verifyingId === dec.id;

            return (
              <div
                key={dec.id}
                className="bg-white p-5 rounded-xl border border-[#E6E0D6] shadow-xs hover:border-[#D5CEBF] transition-all space-y-4"
              >
                {/* Top Row: IDs & Status Badges */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#E6E0D6]">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-semibold text-[#244A3D]">{dec.id}</span>
                    <span className="text-xs text-[#77766F]">
                      Linked Ref: <strong className="font-mono text-[#292D2B]">{dec.transaction_ref}</strong>
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${riskBadge.bg} ${riskBadge.text} ${riskBadge.border}`}>
                      Risk Score: {dec.risk_score}/100 ({dec.risk_category.toUpperCase()})
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${badge.bg}`}>
                      {badge.label}
                    </span>
                    {dec.onchain_tx_hash && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-mono">
                        Sepolia Tx
                      </span>
                    )}
                  </div>
                </div>

                {/* Middle Row: SHA-256 Digest Bar */}
                <div className="p-3 bg-[#FAF8F5] rounded-lg border border-[#E6E0D6] flex flex-col md:flex-row md:items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] text-[#77766F] uppercase tracking-wider block font-medium">
                      Canonical SHA-256 Cryptographic Digest
                    </span>
                    <span className="font-mono text-xs text-[#292D2B] break-all select-all font-medium">
                      {dec.canonical_hash}
                    </span>
                  </div>
                  <button
                    onClick={() => handleCopyHash(dec.id, dec.canonical_hash)}
                    className="self-start md:self-center inline-flex items-center gap-1.5 px-2.5 py-1 text-xs text-[#77766F] hover:text-[#292D2B] bg-white border border-[#E6E0D6] rounded-md transition-colors shadow-xs"
                    title="Copy full hash"
                  >
                    {copiedHashId === dec.id ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedHashId === dec.id ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                {/* Directive & Reasoning */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-[#77766F] block font-medium mb-1">Recommended Compliance Directive:</span>
                    <p className="font-semibold text-[#292D2B] bg-[#FAF8F5] p-2.5 rounded-md border border-[#E6E0D6]">
                      {dec.suggested_action}
                    </p>
                  </div>
                  <div>
                    <span className="text-[#77766F] block font-medium mb-1">Algorithmic Reasoning Summary:</span>
                    <p className="text-[#292D2B] bg-[#FAF8F5] p-2.5 rounded-md border border-[#E6E0D6] leading-relaxed">
                      {dec.reasoning}
                    </p>
                  </div>
                </div>

                {/* Footer Metadata & Action Buttons */}
                <div className="pt-3 border-t border-[#E6E0D6] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#77766F]">
                  <div>
                    Created: <span className="text-[#292D2B] font-medium">{formatDateTime(dec.created_at)}</span>
                    {dec.verified_at && (
                      <span className="ml-3">
                        Last Verified: <span className="text-[#2E6F40] font-medium">{formatDateTime(dec.verified_at)}</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => handleVerify(dec.id)}
                      disabled={isVerifying}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[#244A3D] hover:bg-[#1E3E33] rounded-md transition-colors shadow-xs disabled:opacity-50"
                      title="Recompute SHA-256 hash from canonical payload and check match"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isVerifying ? 'animate-spin' : ''}`} />
                      <span>{isVerifying ? 'Verifying...' : 'Verify Integrity'}</span>
                    </button>

                    <button
                      onClick={() => setSelectedCanonicalDecision(dec)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#292D2B] bg-white border border-[#E6E0D6] hover:bg-[#FAF8F5] rounded-md transition-colors shadow-xs"
                      title="View sorted canonical JSON payload"
                    >
                      <Code className="w-3.5 h-3.5" />
                      <span>Canonical JSON</span>
                    </button>

                    <button
                      onClick={() => setSelectedTamperDecision(dec)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#C77758] bg-[#FAF0ED] border border-[#F2D0C5] hover:bg-[#f6e6e1] rounded-md transition-colors shadow-xs"
                      title="Test tampering in a temporary copy without touching DB"
                    >
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>Tamper Demonstration</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Interactive Tamper Demonstration Modal */}
      <TamperLabModal
        isOpen={!!selectedTamperDecision}
        decision={selectedTamperDecision}
        onClose={() => setSelectedTamperDecision(null)}
      />

      {/* Canonical Payload Inspection Modal */}
      <CanonicalPayloadModal
        isOpen={!!selectedCanonicalDecision}
        decision={selectedCanonicalDecision}
        onClose={() => setSelectedCanonicalDecision(null)}
      />
    </div>
  );
};
