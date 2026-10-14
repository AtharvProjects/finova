import React, { useState, useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { Transaction } from '../../types';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  initialData?: Transaction | null;
}

const CATEGORIES = [
  'Client Invoicing',
  'Operating Expense',
  'Salary',
  'Vendor Payment',
  'Capital Expenditure',
  'Consulting',
  'Tax',
  'Cash Disbursement',
  'Transfer',
];

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: '',
    type: 'debit',
    category: 'Operating Expense',
    counterparty: '',
    description: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        date: initialData.date,
        amount: String(initialData.amount),
        type: initialData.type,
        category: initialData.category,
        counterparty: initialData.counterparty,
        description: initialData.description,
      });
    } else {
      setFormData({
        date: new Date().toISOString().split('T')[0],
        amount: '',
        type: 'debit',
        category: 'Operating Expense',
        counterparty: '',
        description: '',
      });
    }
    setError(null);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const amountNum = parseFloat(formData.amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Amount must be a positive number');
      return;
    }

    if (!formData.counterparty.trim()) {
      setError('Counterparty name is required');
      return;
    }

    if (!formData.description.trim() || formData.description.length < 3) {
      setError('Description must be at least 3 characters');
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        ...formData,
        amount: amountNum,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl border border-[#E6E0D6] shadow-2xl max-w-lg w-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E6E0D6] flex items-center justify-between bg-[#F7F4EE]">
          <h3 className="font-semibold text-base text-[#292D2B]">
            {initialData ? 'Edit Financial Transaction' : 'Record New Transaction'}
          </h3>
          <button onClick={onClose} className="text-[#77766F] hover:text-[#292D2B] p-1.5 rounded-md hover:bg-[#E8DCCB]/30">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Edit notice regarding verification invalidation */}
        {initialData && (
          <div className="px-6 py-2.5 bg-[#FAF0ED] border-b border-[#F2D0C5] text-xs text-[#C77758] flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              <strong>Integrity Notice:</strong> Updating transaction data will automatically mark any associated verified decision records as <em>Requires Re-analysis</em> to prevent stale proof preservation.
            </span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-[#FCF7F7] border border-[#E8B6B6] text-xs text-[#A94442]">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#292D2B] mb-1">
                Transaction Date *
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full text-xs px-3 py-2 rounded-md border border-[#E6E0D6] bg-white text-[#292D2B] focus:outline-none focus:border-[#244A3D]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#292D2B] mb-1">
                Transaction Type *
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full text-xs px-3 py-2 rounded-md border border-[#E6E0D6] bg-white text-[#292D2B] focus:outline-none focus:border-[#244A3D]"
              >
                <option value="debit">Debit (Outflow / Expense)</option>
                <option value="credit">Credit (Inflow / Revenue)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#292D2B] mb-1">
                Amount in INR (₹) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="e.g. 50000"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full text-xs px-3 py-2 rounded-md border border-[#E6E0D6] bg-white text-[#292D2B] focus:outline-none focus:border-[#244A3D]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#292D2B] mb-1">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
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
            <label className="block text-xs font-medium text-[#292D2B] mb-1">
              Counterparty or Institution *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Tata Consultancy Services Ltd"
              value={formData.counterparty}
              onChange={(e) => setFormData({ ...formData, counterparty: e.target.value })}
              className="w-full text-xs px-3 py-2 rounded-md border border-[#E6E0D6] bg-white text-[#292D2B] focus:outline-none focus:border-[#244A3D]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#292D2B] mb-1">
              Description & Audit Reference *
            </label>
            <textarea
              rows={3}
              required
              placeholder="e.g. Professional advisory retainer invoice #TCS-2026-09"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full text-xs px-3 py-2 rounded-md border border-[#E6E0D6] bg-white text-[#292D2B] focus:outline-none focus:border-[#244A3D]"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-[#E6E0D6] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-[#77766F] hover:text-[#292D2B] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-medium text-white bg-[#244A3D] hover:bg-[#1E3E33] rounded-md transition-colors shadow-xs disabled:opacity-50"
            >
              {loading ? 'Processing...' : initialData ? 'Update & Invalidate Proof' : 'Save & Evaluate Risk'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
