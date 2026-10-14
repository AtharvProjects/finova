import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  History,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronUp,
  Download,
  RotateCcw,
} from 'lucide-react';
import { fetchAuditTrail } from '../lib/api';
import { formatDateTime } from '../lib/formatters';
import { AuditEvent } from '../types';
import { useToast } from '../components/common/Toast';

const EVENT_TYPES = [
  'ALL',
  'TX_CREATED',
  'TX_UPDATED',
  'TX_DELETED',
  'CSV_IMPORTED',
  'ANALYSIS_EXECUTED',
  'DECISION_CREATED',
  'HASH_GENERATED',
  'INTEGRITY_VERIFIED',
  'INTEGRITY_FAILED',
  'TAMPER_DEMO_RUN',
  'DATA_RESET',
  'DEMO_DATA_LOADED',
];

export const AuditTrailPage: React.FC = () => {
  const { refreshTrigger } = useOutletContext<{ refreshTrigger: number }>();
  const { showToast } = useToast();

  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [selectedType, setSelectedType] = useState('ALL');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchAuditTrail(selectedType);
      setEvents(data.events);
    } catch (err: any) {
      showToast('Error', err.message || 'Failed to fetch audit trail', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedType, refreshTrigger]);

  const filteredEvents = events.filter((ev) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      ev.id.toLowerCase().includes(term) ||
      ev.entity_id.toLowerCase().includes(term) ||
      ev.event_type.toLowerCase().includes(term) ||
      ev.actor.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-[#292D2B]">Append-Only Audit Trail</h2>
          <p className="text-xs text-[#77766F]">
            Chronological cryptographic events, data modifications, and integrity checks
          </p>
        </div>
        <div className="text-xs text-[#77766F] bg-white px-3 py-1.5 rounded-md border border-[#E6E0D6] shadow-xs">
          Captured Events: <strong className="text-[#244A3D]">{filteredEvents.length}</strong>
        </div>
      </div>

      {/* Notice regarding distributed ledger vs local log */}
      <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#E8DCCB] shadow-xs flex items-start gap-3">
        <Info className="w-5 h-5 text-[#C77758] shrink-0 mt-0.5" />
        <div className="text-xs text-[#77766F] leading-relaxed">
          <strong className="text-[#292D2B]">Audit Ledger Scope:</strong>{' '}
          This audit log operates with append-only database semantics inside local SQLite storage for prototype provenance tracking. It provides complete transparency over application events, but is not an externally consensus-backed distributed ledger.
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-[#E6E0D6] shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#77766F] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by event ID, entity ID, or actor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-md border border-[#E6E0D6] bg-white text-[#292D2B] focus:outline-none focus:border-[#244A3D]"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#77766F]" />
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="text-xs px-3 py-2 rounded-md border border-[#E6E0D6] bg-white text-[#292D2B] focus:outline-none focus:border-[#244A3D]"
          >
            {EVENT_TYPES.map((type) => (
              <option key={type} value={type}>
                {type === 'ALL' ? 'All Event Types' : type}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Events Table */}
      <div className="bg-white rounded-xl border border-[#E6E0D6] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-[#FAF8F5] border-b border-[#E6E0D6] text-[#77766F] font-medium">
                <th className="py-3 px-4">Event ID</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Event Type</th>
                <th className="py-3 px-4">Target Entity</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6E0D6]/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#77766F]">
                    <div className="w-6 h-6 border-2 border-[#244A3D] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Fetching audit trail...
                  </td>
                </tr>
              ) : filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#77766F]">
                    No audit records found matching current query.
                  </td>
                </tr>
              ) : (
                filteredEvents.map((ev) => {
                  const isExpanded = expandedId === ev.id;
                  let statusBg = 'bg-[#EDF6EE] text-[#2E6F40] border-[#BCE0C3]';
                  if (ev.status === 'alert') {
                    statusBg = 'bg-[#FCF7F7] text-[#A94442] border-[#E8B6B6]';
                  } else if (ev.status === 'warning') {
                    statusBg = 'bg-[#FDF6E9] text-[#B47D28] border-[#F0DCBA]';
                  }

                  return (
                    <React.Fragment key={ev.id}>
                      <tr className="hover:bg-[#FAF8F5] transition-colors">
                        <td className="py-3 px-4 font-mono font-medium text-[#244A3D]">{ev.id}</td>
                        <td className="py-3 px-4 text-[#77766F] whitespace-nowrap">{formatDateTime(ev.timestamp)}</td>
                        <td className="py-3 px-4 font-medium text-[#292D2B]">
                          <span className="font-mono bg-[#FAF8F5] px-2 py-0.5 rounded border border-[#E6E0D6]">
                            {ev.event_type}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-[#77766F]">{ev.entity_id}</td>
                        <td className="py-3 px-4 text-[#292D2B]">{ev.actor}</td>
                        <td className="py-3 px-3 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium border ${statusBg}`}>
                            {ev.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : ev.id)}
                            className="inline-flex items-center gap-1 text-xs text-[#244A3D] hover:underline font-medium"
                          >
                            <span>{isExpanded ? 'Hide' : 'Inspect'}</span>
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                        </td>
                      </tr>

                      {/* Expandable Details Row */}
                      {isExpanded && (
                        <tr className="bg-[#FAF8F5]">
                          <td colSpan={7} className="p-4 border-b border-[#E6E0D6]">
                            <div className="bg-white p-3.5 rounded-lg border border-[#E6E0D6] space-y-2">
                              <span className="text-[11px] font-semibold text-[#77766F] uppercase tracking-wider block">
                                Event Payload Details
                              </span>
                              <pre className="font-mono text-xs text-[#292D2B] bg-[#FAF8F5] p-3 rounded border border-[#E6E0D6] overflow-x-auto leading-relaxed">
                                {JSON.stringify(ev.details, null, 2)}
                              </pre>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
