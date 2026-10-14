import React, { useState, useEffect } from 'react';
import {
  X,
  Volume2,
  Sparkles,
  Play,
  Square,
  Check,
  Sliders,
  Cpu,
  Info,
  Key,
  Eye,
  EyeOff,
  ExternalLink,
  Zap,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { NeuralVoicePersona, VoiceConfig, VoiceEngineType } from '../../types';
import { voiceManager } from '../../lib/voiceManager';
import {
  validateElevenLabsApiKey,
  saveElevenLabsApiKey,
  fetchVoicePersonas,
} from '../../lib/api';

interface VoiceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  personas?: NeuralVoicePersona[];
  onPlayPreview?: (persona: NeuralVoicePersona) => void;
}

export const VoiceSettingsModal: React.FC<VoiceSettingsModalProps> = ({
  isOpen,
  onClose,
  personas: propPersonas,
}) => {
  const [config, setConfig] = useState<VoiceConfig>(voiceManager.getConfig());
  const [azureVoices, setAzureVoices] = useState<NeuralVoicePersona[]>([]);
  const [elevenVoices, setElevenVoices] = useState<NeuralVoicePersona[]>([]);
  const [apiKeyInput, setApiKeyInput] = useState(config.elevenLabsApiKey || '');
  const [showKey, setShowKey] = useState(false);
  const [validatingKey, setValidatingKey] = useState(false);
  const [keyValidationResult, setKeyValidationResult] = useState<{
    valid: boolean;
    tier?: string;
    characterCount?: number;
    characterLimit?: number;
    error?: string;
  } | null>(null);
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'indian' | 'elevenlabs' | 'azure' | 'all'>('indian');
  const [testText, setTestText] = useState(
    'Net cash flow is positive at ₹4,50,000 across all verified institutional ledgers.'
  );

  // Load voices and existing API key status on open
  useEffect(() => {
    if (isOpen) {
      fetchVoicePersonas()
        .then((data) => {
          if (data.personas) setAzureVoices(data.personas);
          if (data.elevenLabsPersonas) setElevenVoices(data.elevenLabsPersonas);
          if (data.maskedKey && !apiKeyInput) {
            setKeyValidationResult({ valid: true, tier: 'Configured in backend' });
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleEngineChange = (engine: VoiceEngineType) => {
    let targetVoiceId = config.voiceId;
    if (engine === 'elevenlabs' && elevenVoices.length > 0) {
      if (!elevenVoices.some((v) => v.id === config.voiceId)) {
        targetVoiceId = elevenVoices[0].id;
      }
      setActiveTab('elevenlabs');
    } else if (engine === 'neural' && azureVoices.length > 0) {
      if (!azureVoices.some((v) => v.id === config.voiceId)) {
        targetVoiceId = azureVoices[0].id;
      }
      setActiveTab('azure');
    }

    const updated = { ...config, engine, voiceId: targetVoiceId };
    setConfig(updated);
    voiceManager.updateConfig(updated);
  };

  const handlePersonaSelect = (persona: NeuralVoicePersona) => {
    const updatedEngine: VoiceEngineType =
      persona.provider === 'elevenlabs' ? 'elevenlabs' : 'neural';
    const updated = {
      ...config,
      voiceId: persona.id,
      engine: updatedEngine,
    };
    setConfig(updated);
    voiceManager.updateConfig(updated);
  };

  const handleRateChange = (rateStr: string) => {
    const updated = { ...config, rate: rateStr };
    setConfig(updated);
    voiceManager.updateConfig(updated);
  };

  const handleAutoSpeakToggle = () => {
    const updated = { ...config, autoSpeak: !config.autoSpeak };
    setConfig(updated);
    voiceManager.updateConfig(updated);
  };

  const handleValidateAndSaveKey = async () => {
    if (!apiKeyInput.trim()) {
      setKeyValidationResult({ valid: false, error: 'Please enter an ElevenLabs API key' });
      return;
    }

    setValidatingKey(true);
    setKeyValidationResult(null);

    try {
      const res = await validateElevenLabsApiKey(apiKeyInput.trim());
      setKeyValidationResult(res);

      if (res.valid) {
        // Save to backend SQLite and client config
        await saveElevenLabsApiKey(apiKeyInput.trim());
        const updated = {
          ...config,
          elevenLabsApiKey: apiKeyInput.trim(),
          engine: 'elevenlabs' as VoiceEngineType,
        };
        setConfig(updated);
        voiceManager.updateConfig(updated);
      }
    } catch (err: any) {
      setKeyValidationResult({ valid: false, error: err.message || 'Validation request failed' });
    } finally {
      setValidatingKey(false);
    }
  };

  const handlePlayPreview = async (persona: NeuralVoicePersona) => {
    setPreviewingId(persona.id);
    const engine: VoiceEngineType =
      persona.provider === 'elevenlabs' ? 'elevenlabs' : 'neural';

    await voiceManager.speak(persona.sampleText, {
      engine,
      voiceId: persona.id,
      rate: config.rate,
      pitch: config.pitch,
      elevenLabsApiKey: apiKeyInput.trim() || config.elevenLabsApiKey,
    });
    setPreviewingId(null);
  };

  const handleTestCustom = async () => {
    setPreviewingId('custom');
    await voiceManager.speak(testText, {
      engine: config.engine,
      voiceId: config.voiceId,
      rate: config.rate,
      pitch: config.pitch,
      elevenLabsApiKey: apiKeyInput.trim() || config.elevenLabsApiKey,
    });
    setPreviewingId(null);
  };

  const handleStop = () => {
    voiceManager.stop();
    setPreviewingId(null);
  };

  // Combine or filter voices based on active tab
  const displayedVoices =
    activeTab === 'indian'
      ? azureVoices.filter((v) => v.locale.includes('-IN'))
      : activeTab === 'elevenlabs'
      ? elevenVoices
      : activeTab === 'azure'
      ? azureVoices
      : [...azureVoices, ...elevenVoices];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#0f172a] border border-[#1e293b] rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e293b] bg-[#131d31]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                Realistic Voice Engine Studio
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30 font-medium">
                  ElevenLabs AI & Neural Studio
                </span>
              </h2>
              <p className="text-xs text-gray-400">
                Choose between ElevenLabs Free Realistic Voice API or Azure Neural voices
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              handleStop();
              onClose();
            }}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Engine Selection Cards */}
          <div>
            <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider block mb-2">
              Select Voice Generation Engine
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* ElevenLabs Card */}
              <button
                type="button"
                onClick={() => handleEngineChange('elevenlabs')}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  config.engine === 'elevenlabs'
                    ? 'border-purple-500 bg-purple-500/15 text-white shadow-lg shadow-purple-500/10 ring-1 ring-purple-500/50'
                    : 'border-[#1e293b] bg-[#1e293b]/40 text-gray-300 hover:border-gray-600'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-purple-400" /> ElevenLabs AI
                    </span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-purple-400/20 text-purple-300 border border-purple-400/30">
                      Free Tier
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 leading-relaxed">
                    Hyper-realistic voices with emotional pacing, breathing, and human timbre.
                  </p>
                </div>
                {config.engine === 'elevenlabs' && (
                  <span className="mt-2 text-[10px] bg-purple-500 text-white font-semibold px-2 py-0.5 rounded-full inline-block w-fit">
                    Active Engine
                  </span>
                )}
              </button>

              {/* Azure / Edge Neural Card */}
              <button
                type="button"
                onClick={() => handleEngineChange('neural')}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  config.engine === 'neural'
                    ? 'border-[#D4AF37] bg-[#D4AF37]/15 text-white shadow-lg shadow-[#D4AF37]/10 ring-1 ring-[#D4AF37]/50'
                    : 'border-[#1e293b] bg-[#1e293b]/40 text-gray-300 hover:border-gray-600'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" /> Azure Neural
                    </span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Unlimited
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 leading-relaxed">
                    Natural AI speech. Free, instant, zero key required. Great for Indian Rupee ledgers.
                  </p>
                </div>
                {config.engine === 'neural' && (
                  <span className="mt-2 text-[10px] bg-[#D4AF37] text-black font-semibold px-2 py-0.5 rounded-full inline-block w-fit">
                    Active Engine
                  </span>
                )}
              </button>

              {/* Browser Speech API Card */}
              <button
                type="button"
                onClick={() => handleEngineChange('browser')}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  config.engine === 'browser'
                    ? 'border-[#38BDF8] bg-[#38BDF8]/15 text-white shadow-lg shadow-[#38BDF8]/10 ring-1 ring-[#38BDF8]/50'
                    : 'border-[#1e293b] bg-[#1e293b]/40 text-gray-300 hover:border-gray-600'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-[#38BDF8]" /> Browser Speech
                    </span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                      Local Offline
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 leading-relaxed">
                    Standard Web Speech API rendered entirely on your local operating system.
                  </p>
                </div>
                {config.engine === 'browser' && (
                  <span className="mt-2 text-[10px] bg-[#38BDF8] text-black font-semibold px-2 py-0.5 rounded-full inline-block w-fit">
                    Active Engine
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* ElevenLabs API Key Configuration Card */}
          <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/30 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-bold text-white">ElevenLabs Free API Key Setup</span>
              </div>
              <a
                href="https://elevenlabs.io"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-purple-300 hover:text-purple-200 underline flex items-center gap-1"
              >
                Get Free API Key (10,000 chars/mo) <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <p className="text-[11px] text-gray-300 leading-relaxed">
              ElevenLabs provides 10,000 characters free each month. Enter your key below or paste it in FINOVA's <code className="bg-black/40 px-1 py-0.5 rounded text-purple-300">.env</code> file.
              If no key is entered or quota runs out, FINOVA automatically falls back to Azure Neural so audio never stops.
            </p>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type={showKey ? 'text' : 'password'}
                  placeholder="Paste ElevenLabs xi-api-key (e.g. sk_...)"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  className="w-full pl-3 pr-10 py-2 rounded-lg bg-[#0f172a] border border-[#1e293b] text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-2.5 top-2.5 text-gray-400 hover:text-white"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <button
                type="button"
                onClick={handleValidateAndSaveKey}
                disabled={validatingKey}
                className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                {validatingKey ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Validating...
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" /> Validate & Save
                  </>
                )}
              </button>
            </div>

            {keyValidationResult && (
              <div
                className={`p-2.5 rounded-lg border text-xs flex items-center gap-2 ${
                  keyValidationResult.valid
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                    : 'bg-red-950/40 border-red-500/40 text-red-300'
                }`}
              >
                {keyValidationResult.valid ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>
                      Valid Key! Tier: <strong>{keyValidationResult.tier}</strong>
                      {keyValidationResult.characterLimit && (
                        <>
                          {' '}
                          • Usage: {keyValidationResult.characterCount?.toLocaleString()} /{' '}
                          {keyValidationResult.characterLimit.toLocaleString()} characters
                        </>
                      )}
                    </span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <span>{keyValidationResult.error || 'Invalid API key'}</span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Quick Indian & Bilingual Voice Preset Card */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-orange-500/15 via-emerald-500/10 to-transparent border border-orange-500/30 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">🇮🇳</span>
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  Bilingual Hindi & English Voices (Swara & Neerja)
                  <span className="text-[9px] bg-orange-500/20 text-orange-300 px-1.5 py-0.2 rounded-full border border-orange-500/30">
                    Hindi + English Fluent
                  </span>
                </h4>
                <p className="text-[11px] text-gray-300">
                  Natural bilingual speech with authentic Indian cadence, Lakhs & Crores numbers, and Hindi financial terminology.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const swara = azureVoices.find((v) => v.id === 'hi-IN-SwaraNeural');
                  if (swara) {
                    handlePersonaSelect(swara);
                    handlePlayPreview(swara);
                  }
                }}
                className="px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-400 text-black text-xs font-bold shrink-0 transition-colors shadow-xs"
              >
                Swara (Bilingual) 🇮🇳
              </button>
              <button
                type="button"
                onClick={() => {
                  const neerja = azureVoices.find((v) => v.id === 'en-IN-NeerjaExpressiveNeural') || azureVoices.find((v) => v.id === 'en-IN-NeerjaNeural');
                  if (neerja) {
                    handlePersonaSelect(neerja);
                    handlePlayPreview(neerja);
                  }
                }}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shrink-0 transition-colors shadow-xs"
              >
                Neerja (Indian Eng)
              </button>
            </div>
          </div>

          {/* Voice Personas Catalog */}
          <div>
            <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
              <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
                Select Persona ({displayedVoices.length} available)
              </label>

              {/* Tabs */}
              <div className="flex items-center gap-1 bg-black/40 p-1 rounded-lg border border-[#1e293b] text-[11px] flex-wrap">
                <button
                  type="button"
                  onClick={() => setActiveTab('indian')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    activeTab === 'indian'
                      ? 'bg-amber-500 text-black font-semibold'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  🇮🇳 Indian & Bilingual ({azureVoices.filter((v) => v.locale.includes('-IN')).length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('elevenlabs')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    activeTab === 'elevenlabs'
                      ? 'bg-purple-600 text-white font-semibold'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  ElevenLabs ({elevenVoices.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('azure')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    activeTab === 'azure'
                      ? 'bg-[#D4AF37] text-black font-semibold'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Azure Neural ({azureVoices.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('all')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    activeTab === 'all'
                      ? 'bg-white/20 text-white font-semibold'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  All ({elevenVoices.length + azureVoices.length})
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2.5 max-h-56 overflow-y-auto pr-1">
              {displayedVoices.map((persona) => {
                const isSelected = config.voiceId === persona.id;
                const isPlayingThis = previewingId === persona.id;
                const isEleven = persona.provider === 'elevenlabs';

                return (
                  <div
                    key={persona.id}
                    onClick={() => handlePersonaSelect(persona)}
                    className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                      isSelected
                        ? isEleven
                          ? 'border-purple-500/80 bg-purple-500/15 text-white ring-1 ring-purple-500/40'
                          : 'border-[#D4AF37]/80 bg-[#D4AF37]/15 text-white ring-1 ring-[#D4AF37]/40'
                        : 'border-[#1e293b] bg-[#131d31]/60 text-gray-300 hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs ${
                          isSelected
                            ? isEleven
                              ? 'bg-purple-500 text-white'
                              : 'bg-[#D4AF37] text-black'
                            : 'bg-[#1e293b] text-gray-300'
                        }`}
                      >
                        {persona.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">{persona.name}</span>
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded-full border ${
                              isEleven
                                ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                                : 'bg-[#D4AF37]/20 text-[#D4AF37] border-[#D4AF37]/30'
                            }`}
                          >
                            {isEleven ? 'ElevenLabs AI' : 'Azure Neural'}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-gray-300">
                            {persona.role}
                          </span>
                          {persona.isRecommended && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              Recommended
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-1">
                          {persona.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => (isPlayingThis ? handleStop() : handlePlayPreview(persona))}
                        title={isPlayingThis ? 'Stop' : 'Preview this voice'}
                        className={`p-2 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                          isPlayingThis
                            ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                            : 'bg-white/5 hover:bg-white/10 text-gray-200 border border-white/10'
                        }`}
                      >
                        {isPlayingThis ? (
                          <>
                            <Square className="w-3.5 h-3.5" /> Stop
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5" /> Preview
                          </>
                        )}
                      </button>

                      {isSelected && (
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center ${
                            isEleven ? 'bg-purple-500 text-white' : 'bg-[#D4AF37] text-black'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Voice Tuning Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#1e293b]">
            <div>
              <label className="text-xs font-semibold text-gray-300 block mb-1">
                Speech Cadence / Speed
              </label>
              <div className="flex items-center gap-2">
                {['-10%', '+0%', '+10%', '+20%'].map((rateVal) => (
                  <button
                    key={rateVal}
                    type="button"
                    onClick={() => handleRateChange(rateVal)}
                    className={`flex-1 py-1.5 text-xs rounded-lg border transition-all ${
                      config.rate === rateVal
                        ? 'border-purple-400 bg-purple-500/20 text-white font-semibold'
                        : 'border-[#1e293b] bg-black/20 text-gray-400 hover:text-white'
                    }`}
                  >
                    {rateVal === '+0%'
                      ? '1.0x Normal'
                      : rateVal === '-10%'
                      ? '0.9x Calm'
                      : rateVal === '+10%'
                      ? '1.1x Fast'
                      : '1.2x Rapid'}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col justify-center">
              <label className="text-xs font-semibold text-gray-300 block mb-1">
                Auto-Speak Responses
              </label>
              <button
                type="button"
                onClick={handleAutoSpeakToggle}
                className={`flex items-center justify-between px-3 py-2 rounded-lg border text-xs transition-colors ${
                  config.autoSpeak
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                    : 'border-[#1e293b] bg-black/20 text-gray-400'
                }`}
              >
                <span>Read assistant answers automatically</span>
                <span className="font-bold">{config.autoSpeak ? 'ENABLED' : 'MUTED'}</span>
              </button>
            </div>
          </div>

          {/* Live Test Phrase */}
          <div className="p-3.5 rounded-xl bg-black/40 border border-[#1e293b] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-purple-400" />
                Live Pronunciation Test Studio
              </span>
              <span className="text-[11px] text-gray-400">
                Active: {config.engine === 'elevenlabs' ? 'ElevenLabs AI' : 'Azure Neural'}
              </span>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={testText}
                onChange={(e) => setTestText(e.target.value)}
                placeholder="Type any financial phrase to speak..."
                className="flex-1 px-3 py-1.5 rounded-lg bg-[#0f172a] border border-[#1e293b] text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
              />
              <button
                type="button"
                onClick={previewingId === 'custom' ? handleStop : handleTestCustom}
                className="px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors"
              >
                {previewingId === 'custom' ? (
                  <>
                    <Square className="w-3.5 h-3.5" /> Stop
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" /> Speak Test
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-[#1e293b] bg-[#131d31] flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
            <Info className="w-3.5 h-3.5 text-gray-500" />
            <span>
              Supports ElevenLabs free tier (10k chars/mo) with automatic Azure Neural fallback.
            </span>
          </div>
          <button
            onClick={() => {
              handleStop();
              onClose();
            }}
            className="px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
