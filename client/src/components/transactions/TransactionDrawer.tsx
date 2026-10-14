import React from 'react';
import { X, ShieldCheck, AlertCircle, FileText, Calendar, Building, Tag, ArrowUpRight, ArrowDownLeft, CheckCircle2 } from 'lucide-react';
import { Transaction, DecisionRecord } from '../../types';
import { formatINR, formatDate, formatDateTime, getRiskBadgeClasses, getVerificationBadgeClasses, truncateHash } from '../../lib/formatters';

interface TransactionDrawerProps {
  transaction: Transaction | null;
  decision: DecisionRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onGenerateDecision: (txId: string) => void;
  onEdit: (tx: Transaction) => void;
}

export const TransactionDrawer: React.FC<TransactionDrawerProps> = ({
  transaction,
  decision,
  isOpen,
  onClose,
  onGenerateDecision,
  onEdit,
}) => {
  if (!isOpen || !transaction) return null;

  const riskBadge = getRiskBadgeClasses(transaction.risk_level);
  const isCredit = transaction.type === 'credit';

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-xs transition-opacity" onClick={onClose} />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white border-l border-[#E6E0D6] shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-[#E6E0D6] bg-[#F7F4EE] flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-xs font-semibold text-[#244A3D]">{transaction.id}</span>
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium border ${riskBadge.bg} ${riskBadge.text} ${riskBadge.border}`}>
                  {transaction.risk_level.toUpperCase()} ({transaction.risk_score})
                </span>
              </div>
              <h3 className="font-semibold text-lg text-[#292D2B] truncate">{transaction.counterparty}</h3>
            </div>
            <button onClick={onClose} className="text-[#77766F] hover:text-[#292D2B] p-1.5 rounded-md hover:bg-[#E8DCCB]/30">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 p-6 overflow-y-auto space-y-6">
            {/* Amount card */}
            <div className="p-4 rounded-xl border border-[#E6E0D6] bg-[#FAF8F5] flex items-center justify-between">
              <div>
                <span className="text-xs text-[#77766F] block">Transaction Value</span>
                <span className="text-2xl font-semibold tabular-nums text-[#292D2B]">
                  {formatINR(transaction.amount)}
                </span>
              </div>
              <div className={`p-2.5 rounded-full ${isCredit ? 'bg-[#EDF6EE] text-[#2E6F40]' : 'bg-[#FAF0ED] text-[#C77758]'}`}>
                {isCredit ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
              </div>
            </div>

            {/* Properties Grid */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-[#77766F] uppercase tracking-wider">Transaction Attributes</h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-white rounded-lg border border-[#E6E0D6]">
                  <span className="text-[#77766F] block mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> Date
                  </span>
                  <span className="font-medium text-[#292D2B]">{formatDate(transaction.date)}</span>
                </div>
                <div className="p-3 bg-white rounded-lg border border-[#E6E0D6]">
                  <span className="text-[#77766F] block mb-1 flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5" /> Category
                  </span>
                  <span className="font-medium text-[#292D2B]">{transaction.category}</span>
                </div>
                <div className="p-3 bg-white rounded-lg border border-[#E6E0D6]">
                  <span className="text-[#77766F] block mb-1 flex items-center gap-1">
                    <Building className="w-3.5 h-3.5" /> Type
                  </span>
                  <span className="font-medium text-[#292D2B] capitalize">{transaction.type}</span>
                </div>
                <div className="p-3 bg-white rounded-lg border border-[#E6E0D6]">
                  <span className="text-[#77766F] block mb-1">Status</span>
                  <span className="font-medium text-[#292D2B] capitalize">{transaction.status}</span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <h4 className="text-xs font-semibold text-[#77766F] uppercase tracking-wider mb-2">Narrative & Description</h4>
              <p className="text-xs text-[#292D2B] bg-[#FAF8F5] p-3 rounded-lg border border-[#E6E0D6] leading-relaxed">
                {transaction.description}
              </p>
            </div>

            {/* Triggered Risk Rules */}
            <div>
              <h4 className="text-xs font-semibold text-[#77766F] uppercase tracking-wider mb-2">Evaluated Risk Triggers</h4>
              {transaction.risk_factors && transaction.risk_factors.length > 0 ? (
                <div className="space-y-2">
                  {transaction.risk_factors.map((rf, idx) => (
                    <div key={idx} className="flex items-start gap-2 p-2.5 rounded-md bg-[#FAF0ED] border border-[#F2D0C5] text-xs text-[#C77758]">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{rf}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2 p-2.5 rounded-md bg-[#EDF6EE] border border-[#BCE0C3] text-xs text-[#2E6F40]">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>No elevated anomaly indicators triggered. Straight-through clearing approved.</span>
                </div>
              )}
            </div>

            {/* Linked Decision Status */}
            <div>
              <h4 className="text-xs font-semibold text-[#77766F] uppercase tracking-wider mb-2">Cryptographic Decision Proof</h4>
              {decision ? (
                <div className="p-4 rounded-xl border border-[#E6E0D6] bg-white space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-semibold text-[#244A3D]">{decision.id}</span>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium border ${getVerificationBadgeClasses(decision.verification_status).bg}`}>
                      {getVerificationBadgeClasses(decision.verification_status).label}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-[#77766F] block">SHA-256 Digest:</span>
                    <span className="font-mono text-[11px] text-[#292D2B] break-all">{truncateHash(decision.canonical_hash, 14, 14)}</span>
                  </div>
                  <div className="text-xs text-[#77766F]">
                    Recommendation: <span className="text-[#292D2B] font-medium">{decision.suggested_action}</span>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-dashed border-[#E6E0D6] bg-[#FAF8F5] text-center space-y-2">
                  <p className="text-xs text-[#77766F]">No cryptographic decision certificate generated yet for this record.</p>
                  <button
                    onClick={() => onGenerateDecision(transaction.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[#244A3D] hover:bg-[#1E3E33] rounded-md transition-colors shadow-xs"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Generate & Hash Decision
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-[#E6E0D6] bg-[#F7F4EE] flex items-center justify-between gap-3">
            <button
              onClick={() => onEdit(transaction)}
              className="flex-1 px-3 py-2 text-xs font-medium text-[#292D2B] bg-white border border-[#E6E0D6] hover:bg-[#FAF8F5] rounded-md transition-colors"
            >
              Edit Transaction
            </button>
            {!decision && (
              <button
                onClick={() => onGenerateDecision(transaction.id)}
                className="flex-1 px-3 py-2 text-xs font-medium text-white bg-[#244A3D] hover:bg-[#1E3E33] rounded-md transition-colors shadow-xs"
              >
                Create Verified Record
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
