import React, { useState } from 'react';
import { X, Copy, Check, Code, ShieldCheck } from 'lucide-react';
import { DecisionRecord } from '../../types';

interface CanonicalPayloadModalProps {
  decision: DecisionRecord | null;
  isOpen: boolean;
  onClose: () => void;
}

export const CanonicalPayloadModal: React.FC<CanonicalPayloadModalProps> = ({ decision, isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !decision) return null;

  let prettyJson = '';
  try {
    const parsed = JSON.parse(decision.canonical_payload);
    prettyJson = JSON.stringify(parsed, null, 2);
  } catch {
    prettyJson = decision.canonical_payload;
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(prettyJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl border border-[#E6E0D6] shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E6E0D6] flex items-center justify-between bg-[#F7F4EE]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#244A3D]/10 text-[#244A3D] flex items-center justify-center">
              <Code className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-base text-[#292D2B]">Deterministic Canonical Payload</h3>
              <p className="text-xs text-[#77766F]">
                Decision ID: <span className="font-mono text-[#244A3D]">{decision.id}</span>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#77766F] hover:text-[#292D2B] p-1.5 rounded-md hover:bg-[#E8DCCB]/30">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          <div className="p-3 bg-[#FAF8F5] border border-[#E6E0D6] rounded-lg flex items-center justify-between">
            <div>
              <div className="text-[11px] text-[#77766F] uppercase tracking-wider font-medium">Canonical SHA-256 Digest</div>
              <div className="font-mono text-xs font-semibold text-[#244A3D] break-all mt-0.5">
                {decision.canonical_hash}
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[#2E6F40] bg-[#EDF6EE] px-2.5 py-1 rounded-md shrink-0 border border-[#BCE0C3]">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Immutable Digest</span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-[#292D2B]">
                Canonical JSON (Recursively Sorted Key Pairs)
              </span>
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1 text-xs text-[#244A3D] hover:underline"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy JSON'}
              </button>
            </div>
            <pre className="p-4 rounded-lg bg-[#1E2522] text-[#E8DCCB] font-mono text-xs overflow-x-auto max-h-72 leading-relaxed selection:bg-[#244A3D]">
              {prettyJson}
            </pre>
          </div>

          <p className="text-xs text-[#77766F] leading-normal">
            <strong>Key Ordering Guarantee:</strong> All JSON properties are sorted alphabetically before byte hashing, guaranteeing that identical data always yields the exact same 256-bit hash.
          </p>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-[#E6E0D6] bg-[#F7F4EE] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-[#292D2B] bg-white border border-[#E6E0D6] hover:bg-[#FAF8F5] rounded-md transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
