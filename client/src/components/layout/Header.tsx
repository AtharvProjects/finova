import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Bell,
  RefreshCw,
  Sparkles,
  User,
  CheckCircle2,
  AlertTriangle,
  Shield,
  Check,
  Globe,
  Share2,
  Copy,
  X,
  QrCode,
  ExternalLink,
} from 'lucide-react';
import { resetDemoData, fetchAuditTrail } from '../../lib/api';
import { useToast } from '../common/Toast';
import { AuditEvent } from '../../types';

interface HeaderProps {
  onRefreshData: () => void;
  onOpenTour: () => void;
}

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  '/': { title: 'Executive Overview', subtitle: 'Live Financial Metrics & Cryptographic Verification Health' },
  '/analysis': { title: 'Financial Intelligence & Analysis', subtitle: 'Deterministic Anomaly Detection & Cash Flow Reconciliation' },
  '/transactions': { title: 'Transaction Ledger Management', subtitle: 'Multi-criteria Sorting, Filters, and Cryptographic Invalidation Triggers' },
  '/risk': { title: 'Explainable Risk Engine', subtitle: 'Transparent Mathematical Scoring & Rule-based Evidence Inspector' },
  '/decisions': { title: 'Verified Decision Certificates', subtitle: 'Canonical SHA-256 Digest Verification & Interactive Tamper Lab' },
  '/voice': { title: 'AI Voice Financial Assistant', subtitle: 'Speech Recognition & Native Synthesis Grounded in SQLite Ledger' },
  '/audit': { title: 'Append-Only Audit Trail', subtitle: 'Chronological Cryptographic Events & Administrative System Logs' },
  '/settings': { title: 'Platform Configuration', subtitle: 'Risk Thresholds, Ethereum Testnet Smart Contract & Demo Controls' },
};

export const Header: React.FC<HeaderProps> = ({ onRefreshData, onOpenTour }) => {
  const location = useLocation();
  const { showToast } = useToast();
  const [resetting, setResetting] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [recentAudits, setRecentAudits] = useState<AuditEvent[]>([]);

  const publicUrl =
    typeof window !== 'undefined' && window.location.origin.includes('localhost')
      ? 'https://trailer-fourth-instrument-beautiful.trycloudflare.com'
      : typeof window !== 'undefined'
      ? window.location.origin
      : 'https://trailer-fourth-instrument-beautiful.trycloudflare.com';

  const pageInfo = PAGE_TITLES[location.pathname] || {
    title: 'Financial Intelligence',
    subtitle: 'FINOVA Platform',
  };

  const loadNotifications = async () => {
    try {
      const data = await fetchAuditTrail();
      setRecentAudits(data.events.slice(0, 6));
    } catch {
      // fallback
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [location.pathname]);

  const handleResetDemo = async () => {
    setResetting(true);
    try {
      const res = await resetDemoData();
      showToast('Demo Dataset Loaded', res.message, 'success');
      onRefreshData();
      loadNotifications();
    } catch (err: any) {
      showToast('Error', err.message || 'Failed to load demo data', 'error');
    } finally {
      setResetting(false);
    }
  };

  return (
    <header className="h-16 px-6 bg-white border-b border-[#E6E0D6] flex items-center justify-between z-20 shrink-0">
      {/* Title & Breadcrumb */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-base font-semibold text-[#292D2B] leading-none">{pageInfo.title}</h1>
          <span className="text-xs text-[#9C9A93]">/</span>
          <span className="text-xs font-medium text-[#77766F]">FINOVA Core</span>
        </div>
        <p className="text-xs text-[#77766F] mt-1 hidden sm:block">{pageInfo.subtitle}</p>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Public Cloudflare Link / Share Modal */}
        <button
          onClick={() => setShowShareModal(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-[#244A3D] to-[#1E3E33] hover:from-[#1E3E33] hover:to-[#173027] rounded-lg transition-all shadow-xs border border-[#173027]"
          title="Access FINOVA from any smartphone, tablet, or external PC"
        >
          <Globe className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden sm:inline">Access Anywhere</span>
          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-mono">Live</span>
        </button>

        {/* Academic Demo Environment Indicator */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FAF7F2] border border-[#E8DCCB] text-[11px] text-[#244A3D] font-medium">
          <span className="w-2 h-2 rounded-full bg-[#2E6F40]" />
          <span>Demo Sandbox</span>
        </div>

        {/* Load Demo Data Action */}
        <button
          onClick={handleResetDemo}
          disabled={resetting}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium text-[#244A3D] bg-[#E8DCCB]/40 hover:bg-[#E8DCCB]/70 border border-[#E8DCCB] rounded-lg transition-colors shadow-xs disabled:opacity-50"
          title="Reload baseline 10 transactions and 2 verified decisions"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin' : ''}`} />
          <span>Load Demo Data</span>
        </button>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-[#77766F] hover:text-[#292D2B] rounded-lg hover:bg-[#F7F4EE] transition-colors relative"
            title="System Audit Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#C77758] rounded-full" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl border border-[#E6E0D6] shadow-xl py-2 z-50">
              <div className="px-4 py-2 border-b border-[#E6E0D6] flex items-center justify-between">
                <span className="text-xs font-semibold text-[#292D2B]">Recent Audit Events</span>
                <span className="text-[10px] text-[#77766F]">Local Ledger</span>
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-[#E6E0D6]/50">
                {recentAudits.length > 0 ? (
                  recentAudits.map((a) => (
                    <div key={a.id} className="p-3 hover:bg-[#FAF8F5] transition-colors">
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="font-mono font-medium text-[#244A3D]">{a.event_type}</span>
                        <span className="text-[#9C9A93]">{a.timestamp.slice(11, 19)}</span>
                      </div>
                      <p className="text-xs text-[#77766F] truncate">
                        {typeof a.details === 'string' ? a.details : JSON.stringify(a.details)}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-xs text-[#77766F]">No recent audit logs</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-2 pl-2 border-l border-[#E6E0D6]">
          <div className="w-8 h-8 rounded-full bg-[#244A3D] text-[#E8DCCB] flex items-center justify-center font-medium text-xs shadow-xs">
            A
          </div>
          <div className="hidden md:block leading-tight text-left">
            <span className="block text-xs font-medium text-[#292D2B]">Ashitosh</span>
            <span className="block text-[10px] text-[#77766F]">Compliance Officer</span>
          </div>
        </div>
      </div>

      {/* Share / Public Access Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-2xl border border-[#E6E0D6] shadow-2xl overflow-hidden animate-in zoom-in-95">
            {/* Header */}
            <div className="px-6 py-4 bg-[#F7F4EE] border-b border-[#E6E0D6] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#244A3D] text-white flex items-center justify-center">
                  <Globe className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#292D2B]">Accessible From Anywhere</h3>
                  <p className="text-[11px] text-[#77766F]">Cloudflare Global Edge Deployment</p>
                </div>
              </div>
              <button
                onClick={() => setShowShareModal(false)}
                className="p-1 rounded-lg text-[#77766F] hover:text-[#292D2B] hover:bg-[#E8DCCB]/30"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              <p className="text-xs text-[#5A5953] leading-relaxed">
                FINOVA is deployed live on Cloudflare’s worldwide edge network with end-to-end SSL encryption. Open this link on any mobile phone, tablet, or remote laptop:
              </p>

              {/* URL Box */}
              <div className="flex items-center gap-2 p-2.5 bg-[#FAF8F5] border border-[#E6E0D6] rounded-xl">
                <input
                  type="text"
                  readOnly
                  value={publicUrl}
                  className="flex-1 bg-transparent text-xs font-mono text-[#244A3D] select-all outline-none"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(publicUrl);
                    setCopiedLink(true);
                    showToast('Link Copied!', 'Cloudflare public link copied to clipboard', 'success');
                    setTimeout(() => setCopiedLink(false), 2500);
                  }}
                  className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                    copiedLink
                      ? 'bg-emerald-600 text-white'
                      : 'bg-[#244A3D] text-white hover:bg-[#1E3E33]'
                  }`}
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>

              {/* QR Code Container */}
              <div className="p-4 bg-[#FAF8F5] border border-[#E6E0D6] rounded-xl flex flex-col items-center justify-center text-center">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(
                    publicUrl
                  )}`}
                  alt="QR Code for Mobile Access"
                  className="w-36 h-36 rounded-lg border border-[#E6E0D6] shadow-xs bg-white p-1.5"
                />
                <p className="text-[11px] font-medium text-[#292D2B] mt-2.5 flex items-center gap-1.5">
                  <QrCode className="w-3.5 h-3.5 text-[#244A3D]" />
                  <span>Scan with your phone's camera</span>
                </p>
                <span className="text-[10px] text-[#77766F]">
                  Works instantly on iOS & Android browsers
                </span>
              </div>

              {/* Features List */}
              <div className="space-y-1.5 text-[11px] text-[#5A5953] bg-emerald-50/60 border border-emerald-200/60 p-3 rounded-xl">
                <div className="flex items-center gap-2 text-emerald-800 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Cloudflare SSL/TLS Encryption active</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-800 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Bilingual Hindi & English Voice Assistant fully enabled</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-800 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Real-time SHA-256 blockchain verification & Tamper Lab online</span>
                </div>
              </div>

              {/* Open in New Tab Button */}
              <a
                href={publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 text-xs font-semibold text-center text-[#244A3D] bg-[#E8DCCB]/40 hover:bg-[#E8DCCB]/70 border border-[#E8DCCB] rounded-xl transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Open in New Browser Window</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
