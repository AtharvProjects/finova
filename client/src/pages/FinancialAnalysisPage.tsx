import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  LineChart,
  Plus,
  Play,
  RotateCcw,
  Upload,
  CheckCircle2,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  FileText,
  ShieldAlert,
  HelpCircle,
} from 'lucide-react';
import { createTransaction, evaluateSingleTx, fetchComprehensiveAnalysis } from '../lib/api';
import { formatINR, formatDateTime, getRiskBadgeClasses } from '../lib/formatters';
import { useToast } from '../components/common/Toast';
import { CsvImportModal } from '../components/transactions/CsvImportModal';

const CATEGORIES = [
  'Operating Expense',
  'Client Invoicing',
  'Salary',
  'Vendor Payment',
  'Capital Expenditure',
  'Consulting',
  'Tax',
  'Cash Disbursement',
  'Transfer',
];

export const FinancialAnalysisPage: React.FC = () => {
  const { refreshTrigger, onRefresh } = useOutletContext<{ refreshTrigger: number; onRefresh: () => void }>();
  const { showToast } = useToast();

  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: '',
    type: 'debit',
    category: 'Operating Expense',
    counterparty: '',
    description: '',
  });

  const [singleResult, setSingleResult] = useState<any>(null);
  const [comprehensiveReport, setComprehensiveReport] = useState<any>(null);
  const [analyzingSingle, setAnalyzingSingle] = useState(false);
  const [savingTx, setSavingTx] = useState(false);
  const [loadingReport, setLoadingReport] = useState(true);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);

  const loadComprehensiveReport = async () => {
    setLoadingReport(true);
    try {
      const data = await fetchComprehensiveAnalysis();
      setComprehensiveReport(data.report);
    } catch (err: any) {
      showToast('Error', err.message || 'Failed to fetch comprehensive analysis', 'error');
    } finally {
      setLoadingReport(false);
    }
  };

  useEffect(() => {
    loadComprehensiveReport();
  }, [refreshTrigger]);

  const handleClear = () => {
    setForm({
      date: new Date().toISOString().split('T')[0],
      amount: '',
      type: 'debit',
      category: 'Operating Expense',
      counterparty: '',
      description: '',
    });
    setSingleResult(null);
  };

  const handleAnalyseSingle = async () => {
    const amountNum = parseFloat(form.amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      showToast('Invalid Amount', 'Please provide a valid positive amount in INR', 'warning');
      return;
    }
    if (!form.counterparty.trim()) {
      showToast('Missing Counterparty', 'Please specify the counterparty institution', 'warning');
      return;
    }

    setAnalyzingSingle(true);
    try {
      const res = await evaluateSingleTx({
        ...form,
        amount: amountNum,
      });
      setSingleResult(res.result);
      showToast('Analysis Completed', `Risk evaluated at ${res.result.overallScore}/100 (${res.result.riskLevel.toUpperCase()})`, 'info');
    } catch (err: any) {
      showToast('Error', err.message || 'Failed to analyze transaction', 'error');
    } finally {
      setAnalyzingSingle(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(form.amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      showToast('Invalid Amount', 'Please provide a positive amount in INR', 'warning');
      return;
    }
    if (!form.counterparty.trim() || !form.description.trim()) {
      showToast('Missing Information', 'Please fill in counterparty and description', 'warning');
      return;
    }

    setSavingTx(true);
    try {
      const res = await createTransaction({
        ...form,
        amount: amountNum,
      });
      showToast('Transaction Recorded', `Saved transaction ${res.transaction.id} and added to audit ledger`, 'success');
      handleClear();
      onRefresh();
      loadComprehensiveReport();
    } catch (err: any) {
      showToast('Error', err.message || 'Failed to save transaction', 'error');
    } finally {
      setSavingTx(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Banner explaining deterministic vs ML claims */}
      <div className="p-4 rounded-xl bg-white border border-[#E6E0D6] shadow-xs flex items-start gap-3">
        <div className="p-2 bg-[#FAF7F2] rounded-lg text-[#244A3D] border border-[#E8DCCB] shrink-0 mt-0.5">
          <HelpCircle className="w-5 h-5" />
        </div>
        <div className="text-xs text-[#77766F] leading-relaxed">
          <span className="font-semibold text-[#292D2B]">Deterministic Financial Intelligence:</span>{' '}
          All calculations, outlier tests, duplicate matching, and risk points use verifiable deterministic algorithms and configurable enterprise thresholds. The prototype does not disguise rule-based financial models as black-box neural networks.
        </div>
      </div>

      {/* Grid: Entry Form + Live Single Anomaly Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Entry Form */}
        <div className="lg:col-span-7 bg-white p-6 rounded-xl border border-[#E6E0D6] shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-[#292D2B]">Transaction Entry & Sandbox Analyzer</h3>
              <p className="text-xs text-[#77766F]">Enter transaction parameters to preview anomaly detection</p>
            </div>
            <button
              onClick={() => setIsCsvModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#244A3D] bg-[#F7F4EE] hover:bg-[#E8DCCB]/50 border border-[#E6E0D6] rounded-md transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              Import CSV
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#292D2B] mb-1">Date *</label>
                <input
                  type="date"
                  required
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-md border border-[#E6E0D6] bg-white text-[#292D2B] focus:outline-none focus:border-[#244A3D]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#292D2B] mb-1">Transaction Type *</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-md border border-[#E6E0D6] bg-white text-[#292D2B] focus:outline-none focus:border-[#244A3D]"
                >
                  <option value="debit">Debit (Outflow / Expense)</option>
                  <option value="credit">Credit (Inflow / Receipt)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#292D2B] mb-1">Amount in INR (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="e.g. 125000"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-md border border-[#E6E0D6] bg-white text-[#292D2B] focus:outline-none focus:border-[#244A3D]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#292D2B] mb-1">Category *</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-md border border-[#E6E0D6] bg-white text-[#292D2B] focus:outline-none focus:border-[#244A3D]"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#292D2B] mb-1">Counterparty or Institution *</label>
              <input
                type="text"
                required
                placeholder="e.g. Infosys Enterprise Services Ltd"
                value={form.counterparty}
                onChange={(e) => setForm({ ...form, counterparty: e.target.value })}
                className="w-full text-xs px-3 py-2 rounded-md border border-[#E6E0D6] bg-white text-[#292D2B] focus:outline-none focus:border-[#244A3D]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#292D2B] mb-1">Description & Purpose *</label>
              <textarea
                rows={2}
                required
                placeholder="e.g. Cloud migration milestone retainer payment with invoice ref"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full text-xs px-3 py-2 rounded-md border border-[#E6E0D6] bg-white text-[#292D2B] focus:outline-none focus:border-[#244A3D]"
              />
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-[#E6E0D6]">
              <button
                type="button"
                onClick={handleClear}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#77766F] hover:text-[#292D2B] transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Clear Form
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAnalyseSingle}
                  disabled={analyzingSingle}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-[#244A3D] bg-[#F7F4EE] hover:bg-[#E8DCCB]/50 border border-[#E6E0D6] rounded-md transition-colors shadow-xs disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5" />
                  {analyzingSingle ? 'Evaluating...' : 'Analyse Preview'}
                </button>
                <button
                  type="submit"
                  disabled={savingTx}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-[#244A3D] hover:bg-[#1E3E33] rounded-md transition-colors shadow-xs disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {savingTx ? 'Recording...' : 'Save Transaction'}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Live Analysis Preview Card */}
        <div className="lg:col-span-5 bg-white p-6 rounded-xl border border-[#E6E0D6] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-[#292D2B]">Analysis Preview</h3>
              <span className="text-[11px] font-mono text-[#77766F]">Pre-flight Check</span>
            </div>

            {singleResult ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-[#E6E0D6] bg-[#FAF8F5] flex items-center justify-between">
                  <div>
                    <span className="text-xs text-[#77766F] block">Computed Risk Score</span>
                    <span className="text-3xl font-semibold tabular-nums text-[#292D2B]">
                      {singleResult.overallScore} <span className="text-sm font-normal text-[#77766F]">/ 100</span>
                    </span>
                  </div>
                  <div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase border ${getRiskBadgeClasses(singleResult.riskLevel).bg} ${getRiskBadgeClasses(singleResult.riskLevel).text} ${getRiskBadgeClasses(singleResult.riskLevel).border}`}>
                      {singleResult.riskLevel}
                    </span>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-[#77766F] uppercase tracking-wider mb-2">Evaluated Rules & Triggers</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {singleResult.triggeredRules.map((r: any) => (
                      <div
                        key={r.ruleId}
                        className={`p-2.5 rounded-lg border text-xs ${
                          r.triggered
                            ? 'bg-[#FCF7F7] border-[#E8B6B6] text-[#A94442]'
                            : 'bg-[#F9FCF9] border-[#BCE0C3] text-[#2E6F40]'
                        }`}
                      >
                        <div className="flex items-center justify-between font-medium">
                          <span>{r.ruleName}</span>
                          <span>{r.triggered ? `+${r.scoreContribution} pts` : '0 pts'}</span>
                        </div>
                        <p className="text-[11px] text-[#77766F] mt-1">{r.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-3 bg-[#FAF7F2] rounded-lg border border-[#E8DCCB] text-xs">
                  <span className="font-semibold text-[#244A3D] block mb-0.5">Recommended Action:</span>
                  <span className="text-[#292D2B]">{singleResult.recommendedAction}</span>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-[#77766F] border-2 border-dashed border-[#E6E0D6] rounded-xl space-y-2 my-auto">
                <FileText className="w-8 h-8 mx-auto text-[#9C9A93]" />
                <p className="text-xs">
                  Fill in the transaction form and click <strong>"Analyse Preview"</strong> to preview deterministic risk scoring and anomaly detection before committing to SQLite.
                </p>
              </div>
            )}
          </div>

          <div className="text-[11px] text-[#9C9A93] pt-4 border-t border-[#E6E0D6] mt-4">
            Analysis Timestamp: {formatDateTime(singleResult?.timestamp || new Date().toISOString())}
          </div>
        </div>
      </div>

      {/* Comprehensive Ledger Report */}
      {comprehensiveReport && (
        <div className="bg-white p-6 rounded-xl border border-[#E6E0D6] shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#E6E0D6]">
            <div>
              <h3 className="text-base font-semibold text-[#292D2B]">Comprehensive Financial Portfolio Report</h3>
              <p className="text-xs text-[#77766F]">
                Generated on {formatDateTime(comprehensiveReport.generatedAt)} across {comprehensiveReport.summary.totalTransactions} recorded transactions
              </p>
            </div>
            <button
              onClick={loadComprehensiveReport}
              className="self-start sm:self-auto text-xs text-[#244A3D] font-medium hover:underline flex items-center gap-1"
            >
              Re-run Portfolio Scan
            </button>
          </div>

          {/* Key Portfolio Summary Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-[#FAF8F5] border border-[#E6E0D6]">
              <span className="text-xs text-[#77766F] block">Total Inflow (Credits)</span>
              <span className="text-lg font-semibold tabular-nums text-[#2E6F40]">
                {formatINR(comprehensiveReport.summary.totalCredits)}
              </span>
            </div>
            <div className="p-4 rounded-lg bg-[#FAF8F5] border border-[#E6E0D6]">
              <span className="text-xs text-[#77766F] block">Total Outflow (Debits)</span>
              <span className="text-lg font-semibold tabular-nums text-[#C77758]">
                {formatINR(comprehensiveReport.summary.totalDebits)}
              </span>
            </div>
            <div className="p-4 rounded-lg bg-[#FAF8F5] border border-[#E6E0D6]">
              <span className="text-xs text-[#77766F] block">Net Cash Flow</span>
              <span className={`text-lg font-semibold tabular-nums ${comprehensiveReport.summary.netCashFlow >= 0 ? 'text-[#2E6F40]' : 'text-[#A94442]'}`}>
                {formatINR(comprehensiveReport.summary.netCashFlow)}
              </span>
            </div>
            <div className="p-4 rounded-lg bg-[#FAF8F5] border border-[#E6E0D6]">
              <span className="text-xs text-[#77766F] block">Average Transaction</span>
              <span className="text-lg font-semibold tabular-nums text-[#292D2B]">
                {formatINR(comprehensiveReport.summary.averageAmount)}
              </span>
            </div>
          </div>

          {/* Detected Anomalies List */}
          <div>
            <h4 className="text-sm font-semibold text-[#292D2B] mb-3 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[#C77758]" />
              Detected Pattern Anomalies ({comprehensiveReport.anomalies.length})
            </h4>

            {comprehensiveReport.anomalies.length > 0 ? (
              <div className="space-y-3">
                {comprehensiveReport.anomalies.map((ano: any) => {
                  const badge = getRiskBadgeClasses(ano.severity);
                  return (
                    <div
                      key={ano.id}
                      className="p-4 rounded-xl border border-[#E6E0D6] bg-white hover:bg-[#FAF8F5] transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-[#292D2B]">{ano.title}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${badge.bg} ${badge.text} ${badge.border}`}>
                            {ano.severity.toUpperCase()}
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-[#77766F]">
                          Affected: {ano.affectedTxIds.join(', ')}
                        </span>
                      </div>
                      <p className="text-xs text-[#77766F] mb-2">{ano.description}</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs pt-2 border-t border-[#E6E0D6]/60">
                        <div>
                          <strong className="text-[#244A3D]">Evidence:</strong> {ano.evidence}
                        </div>
                        <div>
                          <strong className="text-[#C77758]">Recommendation:</strong> {ano.recommendation}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-[#F9FCF9] border border-[#BCE0C3] text-xs text-[#2E6F40] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>No critical anomalies or duplicate transactions detected across the current dataset.</span>
              </div>
            )}
          </div>

          {/* Strategic Next Steps */}
          <div className="p-4 rounded-lg bg-[#FAF7F2] border border-[#E8DCCB] space-y-2">
            <h5 className="text-xs font-semibold text-[#244A3D] uppercase tracking-wider">Recommended Strategic Next Steps</h5>
            <ul className="text-xs text-[#292D2B] space-y-1 list-disc list-inside">
              {comprehensiveReport.recommendations.map((rec: string, i: number) => (
                <li key={i}>{rec}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      <CsvImportModal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        onSuccess={() => {
          onRefresh();
          loadComprehensiveReport();
        }}
      />
    </div>
  );
};
