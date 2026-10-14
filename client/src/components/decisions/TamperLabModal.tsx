import React, { useState } from 'react';
import { X, ShieldAlert, CheckCircle2, AlertTriangle, ArrowRight, RefreshCw, Copy, Check } from 'lucide-react';
import { DecisionRecord } from '../../types';
import { runTamperDemo } from '../../lib/api';
import { useToast } from '../common/Toast';

interface TamperLabModalProps {
  decision: DecisionRecord | null;
  isOpen: boolean;
  onClose: () => void;
}

export const TamperLabModal: React.FC<TamperLabModalProps> = ({ decision, isOpen, onClose }) => {
  const { showToast } = useToast();
  const [fieldToTamper, setFieldToTamper] = useState('riskScore');
  const [tamperedValue, setTamperedValue] = useState('10');
  const [loading, setLoading] = useState(false);
  const [tamperResult, setTamperResult] = useState<any>(null);
  const [copiedOriginal, setCopiedOriginal] = useState(false);
  const [copiedTampered, setCopiedTampered] = useState(false);

  if (!isOpen || !decision) return null;

  const handleRunTamper = async () => {
    setLoading(true);
    try {
      let val: any = tamperedValue;
      if (fieldToTamper === 'riskScore' || fieldToTamper === 'amountINR') {
        val = Number(tamperedValue);
      }
      const data = await runTamperDemo(decision.id, fieldToTamper, val);
      setTamperResult(data);
      showToast('Tamper Demonstration Executed', 'Verification mismatch detected on temporary test copy', 'warning');
    } catch (err: any) {
      showToast('Error', err.message || 'Failed to simulate tamper test', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, isOriginal: boolean) => {
    navigator.clipboard.writeText(text);
    if (isOriginal) {
      setCopiedOriginal(true);
      setTimeout(() => setCopiedOriginal(false), 2000);
    } else {
      setCopiedTampered(true);
      setTimeout(() => setCopiedTampered(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl border border-[#E6E0D6] shadow-2xl max-w-3xl w-full overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E6E0D6] flex items-center justify-between bg-[#F7F4EE]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#C77758]/15 border border-[#C77758]/30 flex items-center justify-center text-[#C77758]">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-base text-[#292D2B]">Cryptographic Tamper Demonstration Lab</h3>
              <p className="text-xs text-[#77766F]">
                Decision ID: <span className="font-mono font-medium text-[#244A3D]">{decision.id}</span>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#77766F] hover:text-[#292D2B] p-1.5 rounded-md hover:bg-[#E8DCCB]/30">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notice alert */}
        <div className="px-6 py-3 bg-[#FAF8F5] border-b border-[#E6E0D6] text-xs text-[#77766F] flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-[#B47D28] shrink-0 mt-0.5" />
          <span>
            <strong>Safety Guarantee:</strong> This test clones the canonical payload into memory and performs the tamper experiment on a temporary sandbox copy. The real SQLite database record remains intact and unaltered.
          </span>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Form to configure tamper */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-lg bg-[#F7F4EE] border border-[#E6E0D6]">
            <div>
              <label className="block text-xs font-medium text-[#292D2B] mb-1">
                Select Field to Alter
              </label>
              <select
                value={fieldToTamper}
                onChange={(e) => {
                  setFieldToTamper(e.target.value);
                  if (e.target.value === 'riskScore') setTamperedValue('10');
                  else if (e.target.value === 'amountINR') setTamperedValue('5000');
                  else if (e.target.value === 'suggestedAction') setTamperedValue('Unconditional Straight Approval');
                  else setTamperedValue('Altered Entity');
                }}
                className="w-full text-xs px-3 py-2 rounded-md border border-[#E6E0D6] bg-white text-[#292D2B] focus:outline-none focus:border-[#244A3D]"
              >
                <option value="riskScore">riskScore (Alter score to bypass audit)</option>
                <option value="amountINR">amountINR (Under-report transaction value)</option>
                <option value="suggestedAction">suggestedAction (Change compliance verdict)</option>
                <option value="counterparty">counterparty (Spoof receiving entity)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#292D2B] mb-1">
                Tampered Value (Injected Payload)
              </label>
              <input
                type="text"
                value={tamperedValue}
                onChange={(e) => setTamperedValue(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-md border border-[#E6E0D6] bg-white text-[#292D2B] focus:outline-none focus:border-[#244A3D]"
              />
            </div>

            <div className="sm:col-span-2 flex justify-end pt-1">
              <button
                onClick={handleRunTamper}
                disabled={loading}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-[#C77758] hover:bg-[#b56546] rounded-md transition-colors shadow-xs disabled:opacity-50"
              >
                {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldAlert className="w-3.5 h-3.5" />}
                Run Cryptographic Verification Test
              </button>
            </div>
          </div>

          {/* Results Comparison View */}
          {tamperResult && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg border border-[#E8B6B6] bg-[#FCF7F7]">
                <div className="flex items-start gap-3">
                  <div className="p-1 rounded-full bg-[#A94442] text-white shrink-0 mt-0.5">
                    <X className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-[#A94442]">Cryptographic Verification Failed (Tampering Detected)</h4>
                    <p className="text-xs text-[#292D2B] mt-1 leading-relaxed">
                      {tamperResult.tamperResult?.message}
                    </p>
                  </div>
                </div>
              </div>

              {/* Hash side-by-side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Original Valid Record */}
                <div className="p-4 rounded-lg border border-[#BCE0C3] bg-[#F9FCF9]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-[#2E6F40] flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Original Registered Hash
                    </span>
                    <button
                      onClick={() => handleCopy(tamperResult.tamperResult.originalHash, true)}
                      className="text-[#77766F] hover:text-[#292D2B] p-1 text-xs"
                      title="Copy Hash"
                    >
                      {copiedOriginal ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <div className="bg-white p-2.5 rounded border border-[#E6E0D6] font-mono text-[11px] text-[#292D2B] break-all leading-tight">
                    {tamperResult.tamperResult.originalHash}
                  </div>
                  <p className="text-[11px] text-[#77766F] mt-2">
                    Field <code className="bg-[#E8DCCB]/40 px-1 rounded">{fieldToTamper}</code>: <span className="font-semibold text-[#244A3D]">{String(tamperResult.tamperResult.originalValue)}</span>
                  </p>
                </div>

                {/* Tampered Candidate */}
                <div className="p-4 rounded-lg border border-[#E8B6B6] bg-[#FCF7F7]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-[#A94442] flex items-center gap-1.5">
                      <X className="w-3.5 h-3.5" />
                      Tampered Candidate Hash
                    </span>
                    <button
                      onClick={() => handleCopy(tamperResult.tamperResult.tamperedHash, false)}
                      className="text-[#77766F] hover:text-[#292D2B] p-1 text-xs"
                      title="Copy Hash"
                    >
                      {copiedTampered ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <div className="bg-white p-2.5 rounded border border-[#E8B6B6] font-mono text-[11px] text-[#A94442] break-all leading-tight font-semibold">
                    {tamperResult.tamperResult.tamperedHash}
                  </div>
                  <p className="text-[11px] text-[#A94442] mt-2">
                    Field <code className="bg-red-100 px-1 rounded">{fieldToTamper}</code>: <span className="font-semibold">{String(tamperResult.tamperResult.tamperedValue)}</span> (Altered)
                  </p>
                </div>
              </div>

              {/* Technical explanation */}
              <div className="p-3.5 bg-[#FAF7F2] rounded-lg border border-[#E8DCCB] text-xs text-[#77766F] space-y-1">
                <div className="font-semibold text-[#244A3D]">Architectural Explanation for Reviewers:</div>
                <p>
                  {tamperResult.explanation}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-[#E6E0D6] bg-[#F7F4EE] flex items-center justify-between">
          <span className="text-xs text-[#77766F]">
            Status: <span className="text-[#2E6F40] font-medium">Database Unmodified</span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-[#292D2B] bg-white border border-[#E6E0D6] hover:bg-[#FAF8F5] rounded-md transition-colors"
          >
            Close Tamper Lab
          </button>
        </div>
      </div>
    </div>
  );
};
