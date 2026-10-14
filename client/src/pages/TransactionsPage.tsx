import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Search,
  Filter,
  Download,
  Upload,
  Plus,
  Eye,
  Edit2,
  Trash2,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import {
  fetchTransactions,
  deleteTransaction,
  generateDecision,
  updateTransaction,
  createTransaction,
} from '../lib/api';
import { formatINR, formatDate, getRiskBadgeClasses } from '../lib/formatters';
import { Transaction, DecisionRecord } from '../types';
import { useToast } from '../components/common/Toast';
import { TransactionDrawer } from '../components/transactions/TransactionDrawer';
import { TransactionModal } from '../components/transactions/TransactionModal';
import { CsvImportModal } from '../components/transactions/CsvImportModal';

export const TransactionsPage: React.FC = () => {
  const { refreshTrigger, onRefresh } = useOutletContext<{ refreshTrigger: number; onRefresh: () => void }>();
  const { showToast } = useToast();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const limit = 10;

  // Modals & Drawers
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [linkedDecision, setLinkedDecision] = useState<DecisionRecord | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [deleteConfirmTx, setDeleteConfirmTx] = useState<Transaction | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchTransactions({
        search,
        type: typeFilter,
        category: categoryFilter,
        risk_level: riskFilter,
        sort_by: sortBy,
        sort_order: sortOrder,
        limit,
        offset: (page - 1) * limit,
      });
      setTransactions(data.transactions);
      setTotalCount(data.pagination.total);
    } catch (err: any) {
      showToast('Error', err.message || 'Failed to fetch transactions', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, typeFilter, categoryFilter, riskFilter, sortBy, sortOrder, page, refreshTrigger]);

  const handleInspect = async (tx: Transaction) => {
    setSelectedTx(tx);
    try {
      const res = await fetch(`/api/transactions/${tx.id}`);
      const data = await res.json();
      setLinkedDecision(data.decision);
    } catch {
      setLinkedDecision(null);
    }
    setIsDrawerOpen(true);
  };

  const handleGenerateDecision = async (txId: string) => {
    try {
      const res = await generateDecision(txId);
      showToast('Decision Created', `Generated & hashed canonical record ${res.decision.id}`, 'success');
      onRefresh();
      loadData();
      if (selectedTx && selectedTx.id === txId) {
        setLinkedDecision(res.decision);
      }
    } catch (err: any) {
      showToast('Error', err.message || 'Failed to create decision', 'error');
    }
  };

  const handleSaveModal = async (data: any) => {
    if (editingTx) {
      const res = await updateTransaction(editingTx.id, data);
      showToast('Updated', res.message, 'success');
      if (res.invalidatedDecision) {
        showToast('Decision Invalidated', `Linked decision ${res.invalidatedDecision} flagged as requiring re-analysis`, 'warning');
      }
    } else {
      const res = await createTransaction(data);
      showToast('Created', `Recorded new transaction ${res.transaction.id}`, 'success');
    }
    onRefresh();
    loadData();
  };

  const handleDelete = async () => {
    if (!deleteConfirmTx) return;
    try {
      await deleteTransaction(deleteConfirmTx.id);
      showToast('Deleted', `Transaction ${deleteConfirmTx.id} removed from ledger`, 'info');
      setDeleteConfirmTx(null);
      if (selectedTx?.id === deleteConfirmTx.id) {
        setIsDrawerOpen(false);
      }
      onRefresh();
      loadData();
    } catch (err: any) {
      showToast('Error', err.message || 'Failed to delete transaction', 'error');
    }
  };

  const handleExportCsv = () => {
    window.open('/api/transactions/export-csv', '_blank');
    showToast('Export Initiated', 'Downloading finova_transactions.csv', 'info');
  };

  const totalPages = Math.ceil(totalCount / limit) || 1;

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-[#292D2B]">Transaction Ledger</h2>
          <p className="text-xs text-[#77766F]">
            Displaying {totalCount} records with multi-factor risk categorization
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCsvModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#292D2B] bg-white border border-[#E6E0D6] rounded-md hover:bg-[#FAF8F5] transition-colors shadow-xs"
          >
            <Upload className="w-3.5 h-3.5" />
            Import CSV
          </button>
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#292D2B] bg-white border border-[#E6E0D6] rounded-md hover:bg-[#FAF8F5] transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
          <button
            onClick={() => {
              setEditingTx(null);
              setIsEditModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-[#244A3D] hover:bg-[#1E3E33] rounded-md transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            New Transaction
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-[#E6E0D6] shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#77766F] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by Ref ID, counterparty, or narrative..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-md border border-[#E6E0D6] bg-white text-[#292D2B] focus:outline-none focus:border-[#244A3D]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Type filter */}
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs px-2.5 py-2 rounded-md border border-[#E6E0D6] bg-white text-[#292D2B] focus:outline-none focus:border-[#244A3D]"
          >
            <option value="all">All Types</option>
            <option value="credit">Credits Only</option>
            <option value="debit">Debits Only</option>
          </select>

          {/* Risk Level filter */}
          <select
            value={riskFilter}
            onChange={(e) => {
              setRiskFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs px-2.5 py-2 rounded-md border border-[#E6E0D6] bg-white text-[#292D2B] focus:outline-none focus:border-[#244A3D]"
          >
            <option value="all">All Risk Levels</option>
            <option value="low">Low Risk (0-29)</option>
            <option value="moderate">Moderate (30-59)</option>
            <option value="high">High Risk (60-79)</option>
            <option value="critical">Critical (80-100)</option>
          </select>

          {/* Sort By */}
          <select
            value={`${sortBy}_${sortOrder}`}
            onChange={(e) => {
              const [sb, so] = e.target.value.split('_');
              setSortBy(sb);
              setSortOrder(so);
            }}
            className="text-xs px-2.5 py-2 rounded-md border border-[#E6E0D6] bg-white text-[#292D2B] focus:outline-none focus:border-[#244A3D]"
          >
            <option value="date_desc">Newest Date First</option>
            <option value="date_asc">Oldest Date First</option>
            <option value="amount_desc">Highest Amount First</option>
            <option value="amount_asc">Lowest Amount First</option>
            <option value="risk_score_desc">Highest Risk First</option>
          </select>
        </div>
      </div>

      {/* Transactions Data Table */}
      <div className="bg-white rounded-xl border border-[#E6E0D6] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-[#FAF8F5] border-b border-[#E6E0D6] text-[#77766F] font-medium">
                <th className="py-3 px-4">Reference</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-4">Counterparty / Institution</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-4 text-right">Amount (INR)</th>
                <th className="py-3 px-3 text-center">Type</th>
                <th className="py-3 px-3 text-center">Risk Score</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6E0D6]/60">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[#77766F]">
                    <div className="w-6 h-6 border-2 border-[#244A3D] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Fetching ledger records...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[#77766F]">
                    No transactions match current filters.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => {
                  const riskBadge = getRiskBadgeClasses(tx.risk_level);
                  const isCredit = tx.type === 'credit';
                  return (
                    <tr key={tx.id} className="hover:bg-[#FAF8F5] transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-[#244A3D]">
                        {tx.id}
                      </td>
                      <td className="py-3 px-3 text-[#77766F] whitespace-nowrap">
                        {formatDate(tx.date)}
                      </td>
                      <td className="py-3 px-4 text-[#292D2B] font-medium max-w-[200px] truncate">
                        {tx.counterparty}
                        <span className="block text-[11px] text-[#77766F] font-normal truncate">
                          {tx.description}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-[#77766F] whitespace-nowrap">
                        {tx.category}
                      </td>
                      <td className="py-3 px-4 text-right font-medium tabular-nums text-[#292D2B]">
                        {formatINR(tx.amount)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium ${
                            isCredit
                              ? 'bg-[#EDF6EE] text-[#2E6F40] border border-[#BCE0C3]'
                              : 'bg-[#FAF0ED] text-[#C77758] border border-[#F2D0C5]'
                          }`}
                        >
                          {isCredit ? 'Credit' : 'Debit'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border ${riskBadge.bg} ${riskBadge.text} ${riskBadge.border}`}
                        >
                          {tx.risk_score} / 100 ({tx.risk_level.slice(0, 3).toUpperCase()})
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="text-[11px] capitalize text-[#77766F]">
                          {tx.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleInspect(tx)}
                            className="p-1.5 text-[#77766F] hover:text-[#244A3D] hover:bg-[#E8DCCB]/30 rounded transition-colors"
                            title="Inspect Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingTx(tx);
                              setIsEditModalOpen(true);
                            }}
                            className="p-1.5 text-[#77766F] hover:text-[#244A3D] hover:bg-[#E8DCCB]/30 rounded transition-colors"
                            title="Edit Transaction"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmTx(tx)}
                            className="p-1.5 text-[#77766F] hover:text-[#A94442] hover:bg-red-50 rounded transition-colors"
                            title="Delete Transaction"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="px-4 py-3 bg-[#FAF8F5] border-t border-[#E6E0D6] flex items-center justify-between text-xs text-[#77766F]">
          <span>
            Showing Page <strong>{page}</strong> of <strong>{totalPages}</strong> ({totalCount} items)
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1 rounded border border-[#E6E0D6] bg-white text-[#292D2B] disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1 rounded border border-[#E6E0D6] bg-white text-[#292D2B] disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Transaction Inspection Drawer */}
      <TransactionDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        transaction={selectedTx}
        decision={linkedDecision}
        onGenerateDecision={handleGenerateDecision}
        onEdit={(tx) => {
          setIsDrawerOpen(false);
          setEditingTx(tx);
          setIsEditModalOpen(true);
        }}
      />

      {/* Transaction Create / Edit Modal */}
      <TransactionModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        initialData={editingTx}
        onSubmit={handleSaveModal}
      />

      {/* CSV Import Modal */}
      <CsvImportModal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        onSuccess={() => {
          onRefresh();
          loadData();
        }}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirmTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl border border-[#E6E0D6] shadow-xl max-w-sm w-full p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-red-100 text-[#A94442] shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-[#292D2B]">Confirm Deletion</h4>
                <p className="text-xs text-[#77766F] mt-1">
                  Are you sure you want to delete transaction <strong>{deleteConfirmTx.id}</strong> ({deleteConfirmTx.counterparty})? This will also remove any linked decision record and log an audit event.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E6E0D6]">
              <button
                onClick={() => setDeleteConfirmTx(null)}
                className="px-3 py-1.5 text-xs font-medium text-[#77766F] hover:text-[#292D2B]"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-1.5 text-xs font-medium text-white bg-[#A94442] hover:bg-[#913b39] rounded-md transition-colors"
              >
                Delete Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
