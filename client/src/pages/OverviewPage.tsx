import React, { useEffect, useState } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import {
  Wallet,
  Receipt,
  AlertTriangle,
  ShieldCheck,
  ArrowUpRight,
  ArrowDownLeft,
  Activity,
  Server,
  Cpu,
  Mic,
  ChevronRight,
  TrendingUp,
  FileCheck2,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { fetchDashboardStats, resetDemoData } from '../lib/api';
import { formatINR, formatDate, truncateHash, getRiskBadgeClasses } from '../lib/formatters';
import { DashboardStats } from '../types';
import { useToast } from '../components/common/Toast';

export const OverviewPage: React.FC = () => {
  const { refreshTrigger, onRefresh } = useOutletContext<{ refreshTrigger: number; onRefresh: () => void }>();
  const { showToast } = useToast();
  const [data, setData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const stats = await fetchDashboardStats();
      setData(stats);
    } catch (err: any) {
      showToast('Error', 'Failed to load dashboard metrics', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [refreshTrigger]);

  const handleSeedFromEmpty = async () => {
    try {
      const res = await resetDemoData();
      showToast('Demo Loaded', res.message, 'success');
      onRefresh();
    } catch (err: any) {
      showToast('Error', err.message, 'error');
    }
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-[#244A3D] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-[#77766F]">Loading financial metrics & cryptographic registry...</p>
        </div>
      </div>
    );
  }

  // Empty State handling
  if (!data || data.metrics.totalTransactions === 0) {
    return (
      <div className="p-12 text-center bg-white rounded-2xl border border-[#E6E0D6] shadow-xs max-w-2xl mx-auto my-12">
        <div className="w-14 h-14 rounded-2xl bg-[#F7F4EE] border border-[#E6E0D6] text-[#244A3D] flex items-center justify-center mx-auto mb-4">
          <Receipt className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-semibold text-[#292D2B] mb-2">No Transactions in Current Ledger</h3>
        <p className="text-sm text-[#77766F] max-w-md mx-auto mb-6 leading-relaxed">
          The local SQLite ledger is empty. Populate it with the curated Indian fintech academic demo dataset to explore transaction analysis, risk scoring, and SHA-256 verification.
        </p>
        <button
          onClick={handleSeedFromEmpty}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#244A3D] hover:bg-[#1E3E33] text-white text-xs font-medium rounded-lg shadow-xs transition-colors"
        >
          <span>Load Demonstration Dataset</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  const { metrics, volumeChart, riskDistribution, recentTransactions, recentDecisions, insights, systemStatus } = data;

  return (
    <div className="space-y-6">
      {/* 4 Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white p-5 rounded-xl border border-[#E6E0D6] shadow-xs transition-all hover:border-[#D5CEBF]">
          <div className="flex items-center justify-between text-[#77766F] mb-3">
            <span className="text-xs font-medium">Total Transaction Value</span>
            <div className="p-2 rounded-lg bg-[#FAF7F2] text-[#244A3D] border border-[#E8DCCB]">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-semibold tabular-nums text-[#292D2B]">
            {formatINR(metrics.totalTransactionValue)}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-[#77766F]">
            <span className="text-[#2E6F40] font-medium flex items-center gap-0.5">
              <TrendingUp className="w-3.5 h-3.5" />
              {metrics.totalTransactions} Total
            </span>
            <span>across ledger</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-5 rounded-xl border border-[#E6E0D6] shadow-xs transition-all hover:border-[#D5CEBF]">
          <div className="flex items-center justify-between text-[#77766F] mb-3">
            <span className="text-xs font-medium">Transactions Analysed</span>
            <div className="p-2 rounded-lg bg-[#EDF6EE] text-[#2E6F40] border border-[#BCE0C3]">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-semibold tabular-nums text-[#292D2B]">
            {metrics.transactionsAnalysed}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-[#77766F]">
            <span className="text-[#2E6F40] font-medium">100% Deterministic</span>
            <span>rule coverage</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-5 rounded-xl border border-[#E6E0D6] shadow-xs transition-all hover:border-[#D5CEBF]">
          <div className="flex items-center justify-between text-[#77766F] mb-3">
            <span className="text-xs font-medium">High-Risk Transactions</span>
            <div className="p-2 rounded-lg bg-[#FAF0ED] text-[#C77758] border border-[#F2D0C5]">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-semibold tabular-nums text-[#C77758]">
            {metrics.highRiskCount + metrics.criticalRiskCount}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-[#77766F]">
            <span className="text-[#C77758] font-medium">{metrics.criticalRiskCount} Critical</span>
            <span>require escalation</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white p-5 rounded-xl border border-[#E6E0D6] shadow-xs transition-all hover:border-[#D5CEBF]">
          <div className="flex items-center justify-between text-[#77766F] mb-3">
            <span className="text-xs font-medium">Verified Decision Records</span>
            <div className="p-2 rounded-lg bg-[#EDF6EE] text-[#2E6F40] border border-[#BCE0C3]">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-semibold tabular-nums text-[#244A3D]">
            {metrics.verifiedDecisionsCount}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-[#77766F]">
            <span className="text-[#2E6F40] font-medium">SHA-256 Anchored</span>
            <span>tamper-verified</span>
          </div>
        </div>
      </div>

      {/* Charts Section: 7-Day Volume & Risk Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 7-Day Volume Trend Area Chart */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-[#E6E0D6] shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-[#292D2B]">Transaction Volume Trend</h3>
              <p className="text-xs text-[#77766F]">Daily Credit and Debit movements in INR</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5 text-[#244A3D]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#244A3D]" /> Credits
              </span>
              <span className="flex items-center gap-1.5 text-[#C77758]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#C77758]" /> Debits
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={volumeChart} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCredit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#244A3D" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#244A3D" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorDebit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C77758" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#C77758" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#77766F' }} tickFormatter={(d) => d.slice(5)} />
                <YAxis
                  tick={{ fontSize: 11, fill: '#77766F' }}
                  tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`}
                />
                <Tooltip
                  formatter={(val: any) => formatINR(Number(val))}
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E6E0D6', borderRadius: '8px', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="credit" stroke="#244A3D" strokeWidth={2} fillOpacity={1} fill="url(#colorCredit)" />
                <Area type="monotone" dataKey="debit" stroke="#C77758" strokeWidth={2} fillOpacity={1} fill="url(#colorDebit)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Distribution Donut */}
        <div className="bg-white p-5 rounded-xl border border-[#E6E0D6] shadow-xs flex flex-col">
          <div className="mb-2">
            <h3 className="text-sm font-semibold text-[#292D2B]">Risk Distribution</h3>
            <p className="text-xs text-[#77766F]">Categorization across scoring bands</p>
          </div>

          <div className="flex-1 h-56 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {riskDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v: any, name: any) => [`${v} transactions`, name]}
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E6E0D6', borderRadius: '8px', fontSize: '12px' }}
                />
                <Legend
                  formatter={(val) => <span className="text-xs text-[#292D2B]">{val}</span>}
                  wrapperStyle={{ fontSize: '11px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Transactions & Verified Decisions Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions Table */}
        <div className="bg-white p-5 rounded-xl border border-[#E6E0D6] shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-[#292D2B]">Recent Transactions</h3>
              <p className="text-xs text-[#77766F]">Latest movements recorded in SQLite</p>
            </div>
            <Link
              to="/transactions"
              className="text-xs text-[#244A3D] hover:underline font-medium flex items-center gap-1"
            >
              View All <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-[#E6E0D6] text-[#77766F] font-medium">
                  <th className="pb-2">Ref ID</th>
                  <th className="pb-2">Counterparty</th>
                  <th className="pb-2 text-right">Amount (INR)</th>
                  <th className="pb-2 text-right">Risk Level</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6E0D6]/50">
                {recentTransactions.map((tx) => {
                  const badge = getRiskBadgeClasses(tx.risk_level);
                  return (
                    <tr key={tx.id} className="hover:bg-[#FAF8F5] transition-colors">
                      <td className="py-2.5 font-mono text-[11px] text-[#244A3D] font-medium">{tx.id}</td>
                      <td className="py-2.5 text-[#292D2B] truncate max-w-[150px]">{tx.counterparty}</td>
                      <td className="py-2.5 text-right font-medium tabular-nums text-[#292D2B]">
                        {formatINR(tx.amount)}
                      </td>
                      <td className="py-2.5 text-right">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium border ${badge.bg} ${badge.text} ${badge.border}`}>
                          {tx.risk_level.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Verified Decision Records */}
        <div className="bg-white p-5 rounded-xl border border-[#E6E0D6] shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-[#292D2B]">Verified Decision Proofs</h3>
              <p className="text-xs text-[#77766F]">Cryptographically hashed certificates</p>
            </div>
            <Link
              to="/decisions"
              className="text-xs text-[#244A3D] hover:underline font-medium flex items-center gap-1"
            >
              Open Registry <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {recentDecisions.map((dec) => (
              <div
                key={dec.id}
                className="p-3 rounded-lg border border-[#E6E0D6] bg-[#FAF8F5] hover:bg-[#FAF7F2] transition-colors flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-semibold text-[#244A3D]">{dec.id}</span>
                    <span className="text-[11px] text-[#77766F]">Ref: {dec.transaction_ref}</span>
                  </div>
                  <div className="font-mono text-[11px] text-[#77766F] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2E6F40]" />
                    <span>SHA-256: {truncateHash(dec.canonical_hash, 10, 8)}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-medium text-[#2E6F40] bg-[#EDF6EE] px-2 py-0.5 rounded-md border border-[#BCE0C3]">
                    Valid Digest
                  </span>
                  <span className="block text-[10px] text-[#77766F] mt-1">{formatDate(dec.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Insights & System Status Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Dynamic Financial Insights */}
        <div className="lg:col-span-2 bg-[#FAF7F2] p-5 rounded-xl border border-[#E8DCCB] shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 bg-[#244A3D] text-white rounded-md">
              <Activity className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-[#244A3D]">Deterministic Financial Insights</h3>
          </div>
          <div className="space-y-2">
            {insights.map((insight, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs text-[#292D2B] bg-white p-3 rounded-lg border border-[#E6E0D6]">
                <span className="text-[#C77758] font-bold mt-0.5">•</span>
                <p className="leading-relaxed">{insight}</p>
              </div>
            ))}
          </div>
        </div>

        {/* System Status Panel */}
        <div className="bg-white p-5 rounded-xl border border-[#E6E0D6] shadow-xs space-y-3">
          <h3 className="text-sm font-semibold text-[#292D2B] mb-2">System Status Panel</h3>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2 rounded-lg bg-[#FAF8F5] border border-[#E6E0D6]">
              <span className="flex items-center gap-2 text-[#77766F]">
                <Cpu className="w-3.5 h-3.5 text-[#244A3D]" /> Analysis Engine
              </span>
              <span className="font-medium text-[#2E6F40]">{systemStatus.analysisEngine.status}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-[#FAF8F5] border border-[#E6E0D6]">
              <span className="flex items-center gap-2 text-[#77766F]">
                <Server className="w-3.5 h-3.5 text-[#244A3D]" /> Local Database
              </span>
              <span className="font-medium text-[#2E6F40]">{systemStatus.localDatabase.status}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-[#FAF8F5] border border-[#E6E0D6]">
              <span className="flex items-center gap-2 text-[#77766F]">
                <ShieldCheck className="w-3.5 h-3.5 text-[#244A3D]" /> Hash Verification
              </span>
              <span className="font-medium text-[#2E6F40]">{systemStatus.hashVerification.status}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-[#FAF8F5] border border-[#E6E0D6]">
              <span className="flex items-center gap-2 text-[#77766F]">
                <Mic className="w-3.5 h-3.5 text-[#244A3D]" /> Voice Assistant
              </span>
              <span className="font-medium text-[#2E6F40]">{systemStatus.voiceAssistant.status}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
