import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ChevronRight, ChevronLeft, CheckCircle2, Play, ExternalLink } from 'lucide-react';

interface PresentationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTriggerDemoLoad: () => void;
}

const STEPS = [
  {
    step: 1,
    title: 'Open Executive Dashboard',
    path: '/',
    description: 'Review the high-level financial health, live 7-day transaction volumes, and 4 verified metrics calculated from real ledger data.',
    actionLabel: 'Go to Overview',
  },
  {
    step: 2,
    title: 'Load Demonstration Dataset',
    path: '/',
    description: 'Populate the local SQLite ledger with 10 realistic Indian fintech transactions including normal payroll, high-outlier expenses, and duplicate billing.',
    actionLabel: 'Load Demo Data Now',
    isDemoLoad: true,
  },
  {
    step: 3,
    title: 'Select a High-Risk Transaction',
    path: '/transactions',
    description: 'Navigate to Transaction Management. Open reference "TXN-2026-107" (₹28,50,000 to Apex Global Equities) in the detail drawer.',
    actionLabel: 'Open Transactions',
  },
  {
    step: 4,
    title: 'Run Financial Analysis',
    path: '/analysis',
    description: 'Execute the deterministic anomaly detector to evaluate portfolio cash flows, duplicate payments, and baseline outlier thresholds.',
    actionLabel: 'Run Portfolio Analysis',
  },
  {
    step: 5,
    title: 'Inspect Risk Score & Mathematical Proof',
    path: '/risk',
    description: 'Examine the explainable risk breakdown. See how 45 points were awarded for ultra-high transaction value and 20 points for capital category.',
    actionLabel: 'Inspect Risk Engine',
  },
  {
    step: 6,
    title: 'Generate Decision Report',
    path: '/risk',
    description: 'Synthesize an authoritative compliance recommendation report (e.g. "Mandatory Secondary Review") based strictly on deterministic evidence.',
    actionLabel: 'View Decision Formulation',
  },
  {
    step: 7,
    title: 'Create SHA-256 Cryptographic Record',
    path: '/decisions',
    description: 'Serialize canonical JSON with recursively sorted keys and generate an immutable SHA-256 fingerprint anchored to the local registry.',
    actionLabel: 'Open Verified Decisions',
  },
  {
    step: 8,
    title: 'Verify Decision Integrity',
    path: '/decisions',
    description: 'Click "Verify Integrity" on DEC-2026-801. Watch the system recalculate the SHA-256 hash in real-time and confirm bit-level validity.',
    actionLabel: 'Verify Record #801',
  },
  {
    step: 9,
    title: 'Run Interactive Tamper Demonstration',
    path: '/decisions',
    description: 'Launch the Tamper Lab modal. Simulate a malicious attempt to alter the risk score from 65 to 10 on a temporary test clone.',
    actionLabel: 'Open Tamper Lab',
  },
  {
    step: 10,
    title: 'Verify Tamper Detection & Integrity Failure',
    path: '/decisions',
    description: 'Confirm that the recalculated hash fails completely and highlights cryptographic mismatch, while the original database record remains pristine.',
    actionLabel: 'Inspect Tamper Mismatch',
  },
  {
    step: 11,
    title: 'Engage AI Voice Financial Assistant',
    path: '/voice',
    description: 'Ask the voice assistant: "Explain the highest-risk transaction." Listen to browser speech synthesis reciting findings directly grounded in SQLite.',
    actionLabel: 'Talk to Voice Assistant',
  },
  {
    step: 12,
    title: 'Inspect Immutable Audit Trail',
    path: '/audit',
    description: 'Review the chronological append-only audit trail capturing transaction changes, hash generation, integrity checks, and tamper simulation events.',
    actionLabel: 'View Audit Trail',
  },
];

export const PresentationModal: React.FC<PresentationModalProps> = ({ isOpen, onClose, onTriggerDemoLoad }) => {
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const navigate = useNavigate();

  if (!isOpen) return null;

  const current = STEPS[currentStepIdx];

  const handleStepAction = () => {
    if (current.isDemoLoad) {
      onTriggerDemoLoad();
    }
    navigate(current.path);
    if (currentStepIdx === STEPS.length - 1) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl border border-[#E6E0D6] shadow-xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E6E0D6] flex items-center justify-between bg-[#F7F4EE]">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-[#244A3D] text-white flex items-center justify-center font-semibold text-sm">
              {current.step}
            </span>
            <div>
              <h3 className="font-semibold text-base text-[#292D2B]">Presentation Flow Guide</h3>
              <p className="text-xs text-[#77766F]">12-Step Academic Project Demonstration</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#77766F] hover:text-[#292D2B] p-1.5 rounded-md hover:bg-[#E8DCCB]/30">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          <div className="flex items-center justify-between text-xs text-[#77766F] border-b border-[#E6E0D6] pb-3">
            <span>Step {current.step} of 12</span>
            <div className="flex gap-1">
              {STEPS.map((s, idx) => (
                <button
                  key={s.step}
                  onClick={() => setCurrentStepIdx(idx)}
                  className={`w-3.5 h-1.5 rounded-full transition-all ${
                    idx === currentStepIdx ? 'bg-[#244A3D] w-6' : idx < currentStepIdx ? 'bg-[#2E6F40]' : 'bg-[#E6E0D6]'
                  }`}
                  title={s.title}
                />
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-[#292D2B] mb-2">{current.title}</h4>
            <p className="text-sm text-[#77766F] leading-relaxed bg-[#FAF8F5] p-4 rounded-lg border border-[#E6E0D6]">
              {current.description}
            </p>
          </div>

          <div className="p-3.5 bg-[#FAF7F2] border border-[#E8DCCB] rounded-lg flex items-center justify-between">
            <div className="text-xs text-[#292D2B]">
              <span className="font-semibold text-[#244A3D]">Target Section:</span> {current.path === '/' ? 'Overview' : current.path.slice(1).toUpperCase()}
            </div>
            <button
              onClick={handleStepAction}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-white bg-[#244A3D] hover:bg-[#1E3E33] rounded-md transition-colors shadow-xs"
            >
              <span>{current.actionLabel}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Footer controls */}
        <div className="px-6 py-3.5 border-t border-[#E6E0D6] bg-[#F7F4EE] flex items-center justify-between">
          <button
            onClick={() => setCurrentStepIdx((p) => Math.max(0, p - 1))}
            disabled={currentStepIdx === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#77766F] disabled:opacity-40 hover:text-[#292D2B] border border-[#E6E0D6] rounded-md bg-white disabled:hover:bg-white hover:bg-[#F7F4EE]"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>

          <div className="text-xs text-[#77766F]">
            Use for live classroom or committee presentations
          </div>

          <button
            onClick={() => {
              if (currentStepIdx < STEPS.length - 1) {
                setCurrentStepIdx((p) => p + 1);
              } else {
                onClose();
              }
            }}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-white bg-[#244A3D] hover:bg-[#1E3E33] rounded-md shadow-xs transition-colors"
          >
            {currentStepIdx === STEPS.length - 1 ? 'Finish Tour' : 'Next Step'}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
