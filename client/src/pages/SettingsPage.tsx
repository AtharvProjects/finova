import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Settings as SettingsIcon,
  Save,
  RotateCcw,
  Trash2,
  Cpu,
  Layers,
  Volume2,
  Copy,
  Check,
  Code,
  Shield,
  AlertTriangle,
  Sparkles,
  Sliders,
} from 'lucide-react';
import { fetchSettings, updateSettings, resetDemoData, clearAllData, fetchVoicePersonas } from '../lib/api';
import { useToast } from '../components/common/Toast';
import { voiceManager } from '../lib/voiceManager';
import { VoiceSettingsModal } from '../components/common/VoiceSettingsModal';
import { NeuralVoicePersona } from '../types';

const SAMPLE_SOLIDITY = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract FinovaDecisionRegistry {
    struct DecisionProof {
        bytes32 canonicalHash;
        string transactionRef;
        uint256 riskScore;
        string riskCategory;
        uint256 timestamp;
        address recordedBy;
    }

    mapping(string => DecisionProof) private _registry;
    event DecisionAnchored(string indexed decisionId, bytes32 indexed canonicalHash, uint256 riskScore);

    function recordDecision(string calldata decisionId, bytes32 canonicalHash, string calldata transactionRef, uint256 riskScore, string calldata riskCategory) external {
        _registry[decisionId] = DecisionProof(canonicalHash, transactionRef, riskScore, riskCategory, block.timestamp, msg.sender);
        emit DecisionAnchored(decisionId, canonicalHash, riskScore);
    }
}`;

export const SettingsPage: React.FC = () => {
  const { onRefresh } = useOutletContext<{ onRefresh: () => void }>();
  const { showToast } = useToast();

  const [settings, setSettings] = useState<Record<string, string>>({
    high_risk_threshold: '60',
    critical_risk_threshold: '80',
    large_tx_threshold: '500000',
    duplicate_window_hours: '24',
    blockchain_network: 'Ethereum Sepolia Testnet (EIP-712 / SHA-256 Mock)',
    contract_address: '0x8fB918A033a2510A145C334dF25B50A7E30a47Fe',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copiedContract, setCopiedContract] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [personas, setPersonas] = useState<NeuralVoicePersona[]>([]);
  const [voiceConfig, setVoiceConfig] = useState(voiceManager.getConfig());
  const [isPlayingTest, setIsPlayingTest] = useState(false);

  useEffect(() => {
    fetchSettings()
      .then((data) => {
        if (data.settings) setSettings(data.settings);
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    fetchVoicePersonas()
      .then((data) => {
        const combined = [...(data.elevenLabsPersonas || []), ...(data.personas || [])];
        setPersonas(combined);
      })
      .catch(() => {});

    const unsub = voiceManager.subscribe((st) => {
      setIsPlayingTest(st.isPlaying);
      setVoiceConfig(voiceManager.getConfig());
    });
    return () => unsub();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateSettings(settings);
      showToast('Settings Saved', 'Risk engine thresholds and configuration updated', 'success');
      onRefresh();
    } catch (err: any) {
      showToast('Error', err.message || 'Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleTestVoice = async () => {
    if (isPlayingTest) {
      voiceManager.stop();
      return;
    }
    showToast('Testing Voice', 'Playing ultra-realistic neural speech sample', 'info');
    try {
      await voiceManager.speak(
        'FINOVA neural voice synthesis engine active. All transaction indicators and risk scores are verified against local cryptographic SHA-256 state.'
      );
    } catch (err: any) {
      showToast('Speech Fallback', 'Falling back to local speech synthesis', 'info');
    }
  };

  const handleResetData = async () => {
    try {
      const res = await resetDemoData();
      showToast('Dataset Initialized', res.message, 'success');
      setShowResetConfirm(false);
      onRefresh();
    } catch (err: any) {
      showToast('Error', err.message, 'error');
    }
  };

  const handleClearData = async () => {
    try {
      const res = await clearAllData();
      showToast('Database Cleared', res.message, 'info');
      setShowClearConfirm(false);
      onRefresh();
    } catch (err: any) {
      showToast('Error', err.message, 'error');
    }
  };

  const handleCopySolidity = () => {
    navigator.clipboard.writeText(SAMPLE_SOLIDITY);
    setCopiedContract(true);
    setTimeout(() => setCopiedContract(false), 2000);
    showToast('Copied', 'Solidity contract code copied to clipboard', 'info');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-6 h-6 border-2 border-[#244A3D] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h2 className="text-lg font-semibold text-[#292D2B]">System Configuration & Architecture</h2>
        <p className="text-xs text-[#77766F]">
          Adjust configurable risk thresholds, inspect Ethereum smart contract architecture, and manage demo datasets
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Risk Thresholds Panel */}
        <div className="bg-white p-6 rounded-xl border border-[#E6E0D6] shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[#E6E0D6]">
            <Cpu className="w-4 h-4 text-[#244A3D]" />
            <h3 className="text-sm font-semibold text-[#292D2B]">Configurable Risk Engine Parameters</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-medium text-[#292D2B] mb-1">
                Elevated Outlier Threshold (INR ₹)
              </label>
              <input
                type="number"
                value={settings.large_tx_threshold || '500000'}
                onChange={(e) => setSettings({ ...settings, large_tx_threshold: e.target.value })}
                className="w-full px-3 py-2 rounded-md border border-[#E6E0D6] bg-white text-[#292D2B] focus:outline-none focus:border-[#244A3D]"
              />
              <span className="text-[11px] text-[#77766F] mt-1 block">Default: ₹5,00,000 (5 Lakhs)</span>
            </div>

            <div>
              <label className="block font-medium text-[#292D2B] mb-1">
                Duplicate Matching Window (Hours)
              </label>
              <input
                type="number"
                value={settings.duplicate_window_hours || '24'}
                onChange={(e) => setSettings({ ...settings, duplicate_window_hours: e.target.value })}
                className="w-full px-3 py-2 rounded-md border border-[#E6E0D6] bg-white text-[#292D2B] focus:outline-none focus:border-[#244A3D]"
              />
              <span className="text-[11px] text-[#77766F] mt-1 block">Default: 24 Hours</span>
            </div>

            <div>
              <label className="block font-medium text-[#292D2B] mb-1">
                High-Risk Cutoff (Points / 100)
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={settings.high_risk_threshold || '60'}
                onChange={(e) => setSettings({ ...settings, high_risk_threshold: e.target.value })}
                className="w-full px-3 py-2 rounded-md border border-[#E6E0D6] bg-white text-[#292D2B] focus:outline-none focus:border-[#244A3D]"
              />
              <span className="text-[11px] text-[#77766F] mt-1 block">Bands: Low (0-29), Mod (30-59), High (60+)</span>
            </div>

            <div>
              <label className="block font-medium text-[#292D2B] mb-1">
                Critical-Risk Cutoff (Points / 100)
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={settings.critical_risk_threshold || '80'}
                onChange={(e) => setSettings({ ...settings, critical_risk_threshold: e.target.value })}
                className="w-full px-3 py-2 rounded-md border border-[#E6E0D6] bg-white text-[#292D2B] focus:outline-none focus:border-[#244A3D]"
              />
              <span className="text-[11px] text-[#77766F] mt-1 block">Immediate executive compliance hold trigger</span>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#244A3D] hover:bg-[#1E3E33] rounded-md transition-colors shadow-xs disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Saving...' : 'Update Risk Rules'}</span>
            </button>
          </div>
        </div>

        {/* Blockchain Trust Layer Architecture */}
        <div className="bg-white p-6 rounded-xl border border-[#E6E0D6] shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E6E0D6]">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#244A3D]" />
              <h3 className="text-sm font-semibold text-[#292D2B]">Blockchain Trust Layer & Smart Contract Readiness</h3>
            </div>
            <span className="text-[11px] bg-[#EDF6EE] text-[#2E6F40] px-2.5 py-0.5 rounded-full font-semibold border border-[#BCE0C3]">
              Solidity 0.8.20 Ready
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-medium text-[#292D2B] mb-1">Simulated Network Target</label>
              <input
                type="text"
                value={settings.blockchain_network || ''}
                disabled
                className="w-full px-3 py-2 rounded-md border border-[#E6E0D6] bg-[#FAF8F5] text-[#77766F]"
              />
            </div>
            <div>
              <label className="block font-medium text-[#292D2B] mb-1">Deployed Contract Address</label>
              <input
                type="text"
                value={settings.contract_address || ''}
                disabled
                className="w-full px-3 py-2 rounded-md border border-[#E6E0D6] bg-[#FAF8F5] font-mono text-[#77766F]"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-[#292D2B]">
                Solidity Contract Architecture (<code>FinovaDecisionRegistry.sol</code>)
              </span>
              <button
                type="button"
                onClick={handleCopySolidity}
                className="inline-flex items-center gap-1 text-xs text-[#244A3D] hover:underline"
              >
                {copiedContract ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedContract ? 'Copied' : 'Copy Code'}</span>
              </button>
            </div>
            <pre className="p-3.5 rounded-lg bg-[#1E2522] text-[#E8DCCB] font-mono text-xs overflow-x-auto max-h-48 leading-relaxed">
              {SAMPLE_SOLIDITY}
            </pre>
          </div>
        </div>

        {/* Voice Assistant Testing */}
        <div className="bg-white p-6 rounded-xl border border-[#E6E0D6] shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E6E0D6] flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-[#244A3D]" />
              <h3 className="text-sm font-semibold text-[#292D2B]">
                Realistic Voice Engine & Synthesis Diagnostic
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                  voiceConfig.engine === 'elevenlabs'
                    ? 'bg-purple-500/15 text-purple-700 border-purple-500/30'
                    : 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20'
                }`}
              >
                <Sparkles className="w-2.5 h-2.5 text-[#D4AF37]" />
                {voiceConfig.engine === 'elevenlabs'
                  ? 'ElevenLabs AI Studio'
                  : voiceConfig.engine === 'neural'
                  ? 'Azure Neural Studio'
                  : 'Browser Speech API'}
              </span>
              <span className="text-[10px] font-mono text-[#77766F] bg-[#FAF8F5] px-2 py-0.5 rounded-md border border-[#E6E0D6]">
                {personas.find((p) => p.id === voiceConfig.voiceId)?.name || 'Rachel (ElevenLabs)'}
              </span>
            </div>
          </div>
          <p className="text-xs text-[#77766F] leading-relaxed">
            FINOVA supports ElevenLabs Hyper-Realistic Voice AI (Free Tier 10k chars/mo) alongside Microsoft Azure Neural TTS with financial phonetic normalizers (converts Indian Rupees,
            lakhs, crores, transaction hashes, and fintech acronyms into natural human speech).
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={handleTestVoice}
              className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors shadow-xs ${
                isPlayingTest
                  ? 'bg-red-50 text-red-700 border border-red-300'
                  : 'bg-[#244A3D] text-white hover:bg-[#1E3E33]'
              }`}
            >
              <Volume2 className={`w-4 h-4 ${isPlayingTest ? 'animate-pulse' : ''}`} />
              <span>{isPlayingTest ? 'Stop Test Speech' : 'Play Ultra-Realistic Neural Speech Test'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsVoiceModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-[#292D2B] bg-[#F7F4EE] hover:bg-[#E8DCCB]/40 border border-[#E6E0D6] rounded-lg transition-colors shadow-2xs"
            >
              <Sliders className="w-4 h-4 text-[#D4AF37]" />
              <span>Configure Personas & Speech Engine</span>
            </button>
          </div>
        </div>

        {/* Demo Dataset Controls */}
        <div className="bg-white p-6 rounded-xl border border-[#E6E0D6] shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[#E6E0D6]">
            <RotateCcw className="w-4 h-4 text-[#244A3D]" />
            <h3 className="text-sm font-semibold text-[#292D2B]">Demonstration State & Ledger Management</h3>
          </div>
          <p className="text-xs text-[#77766F]">
            Reset to the curated demonstration dataset or clear all records to test empty states and validation boundaries.
          </p>
          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={() => setShowResetConfirm(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-[#244A3D] bg-[#E8DCCB]/40 hover:bg-[#E8DCCB]/70 border border-[#E8DCCB] rounded-md transition-colors shadow-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Demo Dataset</span>
            </button>
            <button
              type="button"
              onClick={() => setShowClearConfirm(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-[#A94442] bg-[#FCF7F7] hover:bg-red-50 border border-[#E8B6B6] rounded-md transition-colors shadow-xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Ledger (Empty State Test)</span>
            </button>
          </div>
        </div>
      </form>

      {/* Confirmation Modals */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl border border-[#E6E0D6] shadow-xl max-w-sm w-full p-5 space-y-4">
            <h4 className="text-sm font-semibold text-[#292D2B]">Reset Demo Dataset?</h4>
            <p className="text-xs text-[#77766F]">
              This will overwrite the current database with the 10 standard demonstration transactions and 2 verified decision records.
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-[#E6E0D6]">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-3 py-1.5 text-xs font-medium text-[#77766F] hover:text-[#292D2B]"
              >
                Cancel
              </button>
              <button
                onClick={handleResetData}
                className="px-4 py-1.5 text-xs font-medium text-white bg-[#244A3D] hover:bg-[#1E3E33] rounded-md transition-colors"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl border border-[#E6E0D6] shadow-xl max-w-sm w-full p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-red-100 text-[#A94442] shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-[#292D2B]">Clear Entire Ledger?</h4>
                <p className="text-xs text-[#77766F] mt-1">
                  All transactions, decisions, and audit events will be wiped to test empty application states.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-[#E6E0D6]">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-3 py-1.5 text-xs font-medium text-[#77766F] hover:text-[#292D2B]"
              >
                Cancel
              </button>
              <button
                onClick={handleClearData}
                className="px-4 py-1.5 text-xs font-medium text-white bg-[#A94442] hover:bg-[#913b39] rounded-md transition-colors"
              >
                Confirm Wipe
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Voice Settings & Persona Catalog Modal */}
      <VoiceSettingsModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        personas={personas}
      />
    </div>
  );
};

