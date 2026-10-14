import React, { useState } from 'react';
import { X, Upload, Download, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { importTransactionsCsv } from '../../lib/api';
import { useToast } from '../common/Toast';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const SAMPLE_CSV = `date,amount,type,counterparty,category,description
2026-10-14,75000,credit,Wipro Digital,Client Invoicing,Q3 Cloud Migration Consulting
2026-10-14,18000,debit,Atlassian Australia,Operating Expense,Jira & Confluence annual enterprise seats
2026-10-15,450000,debit,Dell India Enterprise,Capital Expenditure,High-performance GPU developer workstations
2026-10-15,12500,debit,Swiggy Corporate,Operating Expense,Team client engagement luncheon`;

export const CsvImportModal: React.FC<CsvImportModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { showToast } = useToast();
  const [csvContent, setCsvContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDownloadSample = () => {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'finova_sample_transactions.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setCsvContent((event.target?.result as string) || '');
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!csvContent.trim()) {
      setError('Please select or paste CSV data to import');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await importTransactionsCsv(csvContent);
      showToast('CSV Imported', res.message, 'success');
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to import CSV');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl border border-[#E6E0D6] shadow-2xl max-w-xl w-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E6E0D6] flex items-center justify-between bg-[#F7F4EE]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#244A3D]/10 text-[#244A3D] flex items-center justify-center">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-base text-[#292D2B]">Import Financial Dataset (CSV)</h3>
          </div>
          <button onClick={onClose} className="text-[#77766F] hover:text-[#292D2B] p-1.5 rounded-md hover:bg-[#E8DCCB]/30">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#77766F]">
              Required Columns: <code className="bg-[#FAF8F5] px-1 py-0.5 border border-[#E6E0D6] rounded text-[#292D2B]">date, amount, type, counterparty</code>
            </span>
            <button
              onClick={handleDownloadSample}
              className="inline-flex items-center gap-1.5 text-xs text-[#244A3D] hover:underline font-medium"
            >
              <Download className="w-3.5 h-3.5" />
              Download Sample CSV
            </button>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-[#FCF7F7] border border-[#E8B6B6] text-xs text-[#A94442] flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Upload drop box */}
          <div className="border-2 border-dashed border-[#E6E0D6] rounded-xl p-5 text-center bg-[#FAF8F5] hover:bg-[#FAF7F2] transition-colors">
            <Upload className="w-7 h-7 text-[#77766F] mx-auto mb-2" />
            <p className="text-xs text-[#292D2B] font-medium mb-1">Upload CSV file or paste content below</p>
            <p className="text-[11px] text-[#77766F] mb-3">Accepts standard UTF-8 encoded .csv files</p>
            <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E6E0D6] rounded-md text-xs font-medium text-[#292D2B] hover:bg-gray-50 cursor-pointer shadow-xs">
              <span>Choose CSV File</span>
              <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#292D2B] mb-1">
              CSV Text Preview / Raw Input
            </label>
            <textarea
              rows={5}
              placeholder="Paste raw CSV content here..."
              value={csvContent}
              onChange={(e) => setCsvContent(e.target.value)}
              className="w-full text-xs font-mono p-3 rounded-md border border-[#E6E0D6] bg-white text-[#292D2B] focus:outline-none focus:border-[#244A3D]"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-[#E6E0D6] bg-[#F7F4EE] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-[#77766F] hover:text-[#292D2B]"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={loading}
            className="px-5 py-2 text-xs font-medium text-white bg-[#244A3D] hover:bg-[#1E3E33] rounded-md shadow-xs transition-colors disabled:opacity-50"
          >
            {loading ? 'Validating & Importing...' : 'Import Dataset'}
          </button>
        </div>
      </div>
    </div>
  );
};
