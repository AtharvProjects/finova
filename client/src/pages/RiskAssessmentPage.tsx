import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  ShieldCheck,
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  FileCheck2,
  Sliders,
} from 'lucide-react';
import { fetchTransactions, generateDecision, evaluateSingleTx } from '../lib/api';
import { formatINR, getRiskBadgeClasses } from '../lib/formatters';
import { Transaction } from '../types';
import { useToast } from '../components/common/Toast';

export const RiskAssessmentPage: React.FC = () => {
  const { refreshTrigger, onRefresh } = useOutletContext<{ refreshTrigger: number; onRefresh: () => void }>();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedTxId, setSelectedTxId] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await fetchTransactions({ limit: 100 });
        setTransactions(data.transactions);
        if (data.transactions.length > 0 && !selectedTxId) {
          // Default to highest risk or first transaction
          const sorted = [...data.transactions].sort((a, b) => b.risk_score - a.risk_score);
          setSelectedTxId(sorted[0].id);
        }
      } catch (err: any) {
        showToast('Error', 'Failed to load transactions for risk assessment', 'error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [refreshTrigger]);

  const activeTx = transactions.find((t) => t.id === selectedTxId) || transactions[0];

  useEffect(() => {
    if (activeTx) {
      evaluateSingleTx(activeTx)
        .then((res) => setAnalysisResult(res.result))
        .catch(() => {});
    }
  }, [selectedTxId, activeTx]);

  const handleGenerateDecisionReport = async () => {
    if (!activeTx) return;
    setGenerating(true);
    try {
      const res = await generateDecision(activeTx.id);
      showToast('Decision Certificate Created', `Hashed canonical record ${res.decision.id}`, 'success');
      onRefresh();
      navigate('/decisions');
    } catch (err: any) {
      showToast('Error', err.message || 'Failed to generate decision', 'error');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-6 h-6 border-2 border-[#244A3D] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const badge = analysisResult ? getRiskBadgeClasses(analysisResult.riskLevel) : getRiskBadgeClasses('low');

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-[#292D2B]">Explainable Risk & Decision Engine</h2>
          <p className="text-xs text-[#77766F]">
            Auditable, deterministic rule evaluation with full mathematical transparency
          </p>
        </div>

        {/* Transaction Selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-[#77766F] font-medium whitespace-nowrap">Evaluate Transaction:</label>
          <select
            value={selectedTxId}
            onChange={(e) => setSelectedTxId(e.target.value)}
            className="text-xs px-3 py-2 rounded-md border border-[#E6E0D6] bg-white text-[#292D2B] font-medium focus:outline-none focus:border-[#244A3D]"
          >
            {transactions.map((t) => (
              <option key={t.id} value={t.id}>
                {t.id} — {t.counterparty} ({formatINR(t.amount)})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Scoring Grid */}
      {analysisResult && activeTx && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Risk Gauge & Summary Card */}
          <div className="lg:col-span-5 bg-white p-6 rounded-xl border border-[#E6E0D6] shadow-xs flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="font-mono text-xs font-semibold text-[#244A3D]">{activeTx.id}</span>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${badge.bg} ${badge.text} ${badge.border}`}>
                  {analysisResult.riskLevel.toUpperCase()}
                </span>
              </div>

              {/* Large Score Visualizer */}
              <div className="p-6 rounded-2xl bg-[#FAF8F5] border border-[#E6E0D6] text-center my-4">
                <span className="text-xs text-[#77766F] uppercase tracking-wider block mb-1">Calculated Risk Index</span>
                <div className="text-5xl font-bold tabular-nums text-[#292D2B]">
                  {analysisResult.overallScore}
                  <span className="text-lg font-normal text-[#77766F] ml-1">/ 100</span>
                </div>

                {/* Score Progress Bar */}
                <div className="w-full bg-[#E6E0D6] h-2.5 rounded-full mt-4 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      analysisResult.overallScore >= 80
                        ? 'bg-[#A94442]'
                        : analysisResult.overallScore >= 60
                        ? 'bg-[#C77758]'
                        : analysisResult.overallScore >= 30
                        ? 'bg-[#B47D28]'
                        : 'bg-[#2E6F40]'
                    }`}
                    style={{ width: `${analysisResult.overallScore}%` }}
                  />
                </div>

                <div className="flex justify-between text-[10px] text-[#77766F] mt-2">
                  <span>Low (0-29)</span>
                  <span>Moderate (30-59)</span>
                  <span>High (60-79)</span>
                  <span>Critical (80-100)</span>
                </div>
              </div>

              {/* Transaction Target Specs */}
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-[#E6E0D6]">
                  <span className="text-[#77766F]">Counterparty:</span>
                  <span className="font-medium text-[#292D2B]">{activeTx.counterparty}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[#E6E0D6]">
                  <span className="text-[#77766F]">Amount in INR:</span>
                  <span className="font-medium tabular-nums text-[#292D2B]">{formatINR(activeTx.amount)}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[#E6E0D6]">
                  <span className="text-[#77766F]">Category:</span>
                  <span className="font-medium text-[#292D2B]">{activeTx.category}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[#E6E0D6]">
                  <span className="text-[#77766F]">Narrative:</span>
                  <span className="font-medium text-[#292D2B] text-right truncate max-w-[200px]">{activeTx.description}</span>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-4 border-t border-[#E6E0D6]">
              <button
                onClick={handleGenerateDecisionReport}
                disabled={generating}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-[#244A3D] hover:bg-[#1E3E33] rounded-lg shadow-xs transition-colors disabled:opacity-50"
              >
                <FileCheck2 className="w-4 h-4" />
                {generating ? 'Hashing & Anchoring Record...' : 'Generate Verifiable Decision Report'}
              </button>
            </div>
          </div>

          {/* "Why This Result?" Detailed Mathematical Inspector */}
          <div className="lg:col-span-7 bg-white p-6 rounded-xl border border-[#E6E0D6] shadow-xs space-y-6">
            <div>
              <h3 className="text-base font-semibold text-[#292D2B] flex items-center gap-2">
                <span>"Why This Result?" Evidence Inspector</span>
              </h3>
              <p className="text-xs text-[#77766F] mt-0.5">
                Full deterministic breakdown of rule weights, conditions met, and supporting factual evidence.
              </p>
            </div>

            {/* Evaluated Rules List */}
            <div className="space-y-3">
              {analysisResult.triggeredRules.map((r: any) => {
                const isTriggered = r.triggered;
                return (
                  <div
                    key={r.ruleId}
                    className={`p-4 rounded-xl border transition-colors ${
                      isTriggered
                        ? 'bg-[#FCF7F7] border-[#E8B6B6]'
                        : 'bg-[#F9FCF9] border-[#BCE0C3]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-[#292D2B]">{r.ruleId}</span>
                        <span className="text-xs font-medium text-[#292D2B]">{r.ruleName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                            isTriggered
                              ? 'bg-red-100 text-[#A94442]'
                              : 'bg-green-100 text-[#2E6F40]'
                          }`}
                        >
                          {isTriggered ? `Triggered (+${r.scoreContribution} pts)` : 'Passed (0 pts)'}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-[#77766F] leading-relaxed">{r.reason}</p>
                  </div>
                );
              })}
            </div>

            {/* Recommended Action Summary */}
            <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#E8DCCB] space-y-2">
              <div className="text-xs font-semibold text-[#244A3D] uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#244A3D]" />
                Algorithmic Compliance Directive
              </div>
              <p className="text-xs font-medium text-[#292D2B] leading-relaxed">
                {analysisResult.recommendedAction}
              </p>
              <p className="text-[11px] text-[#77766F]">
                <em>Governance Protocol:</em> System provides decision-support indications; final financial authorizations remain with authorized human compliance controllers.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
