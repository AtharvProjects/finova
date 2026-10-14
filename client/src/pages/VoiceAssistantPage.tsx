import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Send,
  Volume2,
  VolumeX,
  Sparkles,
  Bot,
  User,
  RotateCcw,
  Sliders,
  Play,
  Square,
  ShieldCheck,
  Languages,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { queryVoiceAssistant, fetchVoicePersonas } from '../lib/api';
import { useToast } from '../components/common/Toast';
import { voiceManager } from '../lib/voiceManager';
import { AudioVisualizer } from '../components/common/AudioVisualizer';
import { VoiceSettingsModal } from '../components/common/VoiceSettingsModal';
import { NeuralVoicePersona } from '../types';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  visualData?: any;
  spokenTextHindi?: string;
  spokenTextEnglish?: string;
  language?: string;
}

const SUGGESTED_PROMPTS_BILINGUAL = [
  'आज का नेट कैश फ्लो कितना है?',
  'कौनसे transactions में high risk है?',
  'सबसे ज्यादा risk वाला transaction समझाइए',
  'Blockchain verification hash कैसे काम करता है?',
  'Salary और पेरोल का कुल खर्च बताओ',
];

const SUGGESTED_PROMPTS_EN = [
  "Summarize today's financial activity.",
  'Which transactions need attention?',
  'Explain the highest-risk transaction.',
  'What does the verification hash prove?',
  'Give me a summary of net cash flow.',
];

export const VoiceAssistantPage: React.FC = () => {
  const { showToast } = useToast();
  const [languageMode, setLanguageMode] = useState<'bilingual' | 'en'>('bilingual');
  const [showHindiMap, setShowHindiMap] = useState<Record<string, boolean>>({});

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome-1',
      sender: 'assistant',
      text: "Namaste! Main FINOVA ka AI Financial Voice Assistant hoon. Main aapke ledger ke transactions ka cash flow, high risk anomalies aur SHA-256 blockchain verification reports bilingual Hindi aur English dono me bata sakta hoon. Aap aaj kya dekhna chahenge?",
      spokenTextHindi: "नमस्ते! मैं फिनोवा का एआई वित्तीय वॉयस असिस्टेंट हूँ। मैं आपके बहीखाते के लेन-देन, कैश फ्लो, जोखिम विसंगतियों और ब्लॉकचेन सत्यापन की पूरी जानकारी हिंदी और अंग्रेज़ी दोनों में दे सकता हूँ। आप क्या जानना चाहेंगे?",
      spokenTextEnglish: "Hello! I'm FINOVA's financial intelligence voice assistant. I analyze transactions, explain risk anomalies, and verify cryptographic SHA-256 decision records directly grounded in your SQLite ledger. How can I assist your compliance review today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [personas, setPersonas] = useState<NeuralVoicePersona[]>([]);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [voiceState, setVoiceState] = useState(voiceManager.getState());

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Subscribe to VoiceManager for real-time audio playback status
  useEffect(() => {
    const unsub = voiceManager.subscribe((st) => {
      setVoiceState(st);
    });
    return () => unsub();
  }, []);

  // Set default voice to Swara (Hindi/English Bilingual) if starting in bilingual mode
  useEffect(() => {
    const currentCfg = voiceManager.getConfig();
    if (currentCfg.engine === 'neural' && !currentCfg.voiceId.includes('hi-IN') && !currentCfg.voiceId.includes('Neerja')) {
      voiceManager.updateConfig({
        voiceId: 'hi-IN-SwaraNeural',
      });
    }
  }, []);

  // Fetch available realistic neural personas (Azure + ElevenLabs) from backend
  useEffect(() => {
    fetchVoicePersonas()
      .then((data) => {
        const combined: NeuralVoicePersona[] = [
          ...(data.elevenLabsPersonas || []),
          ...(data.personas || []),
        ];
        setPersonas(combined);
      })
      .catch((err) => {
        console.warn('Could not load voice personas:', err);
      });
  }, []);

  // Initialize SpeechRecognition if available
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = languageMode === 'bilingual' ? 'hi-IN' : 'en-IN';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        setIsListening(false);
        handleSendQuery(transcript);
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        if (event.error !== 'no-speech') {
          showToast(
            'Speech Recognition Notice',
            `Voice input event: ${event.error}. You can also type below.`,
            'info'
          );
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      voiceManager.stop();
    };
  }, [languageMode]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, voiceState.isPlaying, isProcessing]);

  const speakText = async (text: string) => {
    try {
      await voiceManager.speak(text);
    } catch {
      showToast('Speech Notice', 'Playing audio using browser synthesis fallback', 'info');
    }
  };

  const stopSpeaking = () => {
    voiceManager.stop();
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      if (!recognitionRef.current) {
        showToast(
          'Speech Recognition Unavailable',
          'Web Speech API is not supported in this browser. Please use text input.',
          'warning'
        );
        return;
      }
      try {
        stopSpeaking();
        if (recognitionRef.current) {
          recognitionRef.current.lang = languageMode === 'bilingual' ? 'hi-IN' : 'en-IN';
          recognitionRef.current.start();
        }
      } catch {
        setIsListening(false);
      }
    }
  };

  const handleSendQuery = async (queryToSend?: string) => {
    const text = (queryToSend || inputText).trim();
    if (!text) return;

    stopSpeaking();
    setInputText('');

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsProcessing(true);

    try {
      const response = await queryVoiceAssistant(text, languageMode);

      const assistantMsg: Message = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: response.spokenText,
        spokenTextHindi: response.spokenTextHindi,
        spokenTextEnglish: response.spokenTextEnglish,
        language: response.language,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        visualData: response.visualData,
      };

      setMessages((prev) => [...prev, assistantMsg]);

      // Automatically speak if enabled in voice settings
      if (voiceManager.getConfig().autoSpeak) {
        speakText(response.spokenText);
      }
    } catch (err: any) {
      showToast('Error', err.message || 'Voice assistant query failed', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClearChat = () => {
    stopSpeaking();
    const isBi = languageMode === 'bilingual';
    setMessages([
      {
        id: 'welcome-reset',
        sender: 'assistant',
        text: isBi
          ? 'Conversation cleared. Main aapki compliance aur transaction review me kya sahayata karoon?'
          : 'Conversation cleared. How can I assist your compliance review?',
        spokenTextHindi: isBi
          ? 'बातचीत साफ़ कर दी गई है। मैं आपकी क्या सहायता कर सकता हूँ?'
          : undefined,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const toggleHindiTranslation = (msgId: string) => {
    setShowHindiMap((prev) => ({
      ...prev,
      [msgId]: !prev[msgId],
    }));
  };

  const currentPersona = personas.find((p) => p.id === voiceState.activePersonaId) || {
    name: 'Swara (Bilingual)',
    locale: 'hi-IN',
    role: 'Bilingual Financial Specialist',
  };

  const activePrompts = languageMode === 'bilingual' ? SUGGESTED_PROMPTS_BILINGUAL : SUGGESTED_PROMPTS_EN;

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col bg-white rounded-xl border border-[#E6E0D6] shadow-xs overflow-hidden relative">
      {/* Top Assistant Status Header */}
      <div className="px-6 py-3.5 border-b border-[#E6E0D6] bg-[#F7F4EE] flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#244A3D] text-[#E8DCCB] flex items-center justify-center shrink-0 shadow-xs">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-sm text-[#292D2B]">
                FINOVA Intelligence Voice Assistant
              </h3>

              {/* Language Switcher Pill */}
              <div className="flex items-center bg-[#E8DCCB]/50 p-0.5 rounded-full border border-[#D5C7B0]">
                <button
                  onClick={() => setLanguageMode('bilingual')}
                  className={`px-2.5 py-0.5 text-[11px] rounded-full font-semibold transition-all flex items-center gap-1 ${
                    languageMode === 'bilingual'
                      ? 'bg-[#244A3D] text-white shadow-2xs'
                      : 'text-[#5A5953] hover:text-[#292D2B]'
                  }`}
                  title="Bilingual Mode: Natural Hindi & English conversational intelligence"
                >
                  <span>🇮🇳</span>
                  <span>Bilingual (हिंदी / Eng)</span>
                </button>
                <button
                  onClick={() => setLanguageMode('en')}
                  className={`px-2.5 py-0.5 text-[11px] rounded-full font-semibold transition-all flex items-center gap-1 ${
                    languageMode === 'en'
                      ? 'bg-[#244A3D] text-white shadow-2xs'
                      : 'text-[#5A5953] hover:text-[#292D2B]'
                  }`}
                  title="English Mode: Standard financial English"
                >
                  <span>🇬🇧</span>
                  <span>English</span>
                </button>
              </div>

              <span className="text-[10px] bg-[#EDF6EE] text-[#2E6F40] px-2 py-0.5 rounded-full font-semibold border border-[#BCE0C3] flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Grounded to Ledger
              </span>

              {/* Engine / Persona Tag */}
              <button
                onClick={() => setIsVoiceModalOpen(true)}
                className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold border flex items-center gap-1.5 transition-colors ${
                  voiceState.engine === 'elevenlabs'
                    ? 'bg-purple-500/15 text-purple-700 hover:bg-purple-500/25 border-purple-500/40'
                    : 'bg-[#D4AF37]/15 text-[#916b0a] hover:bg-[#D4AF37]/25 border-[#D4AF37]/40'
                }`}
                title="Click to configure ElevenLabs AI or Azure Neural"
              >
                <Sparkles className={`w-3 h-3 ${voiceState.engine === 'elevenlabs' ? 'text-purple-600' : 'text-[#D4AF37]'}`} />
                <span>
                  {voiceState.engine === 'elevenlabs' ? '🎙️ ElevenLabs: ' : '⚡ Neural: '}
                  {currentPersona.name.replace(/ \(.*\)/, '')}
                </span>
              </button>

              {/* 1-Click Indian Local Voice Selectors */}
              <button
                onClick={() => {
                  voiceManager.updateConfig({
                    engine: 'neural',
                    voiceId: 'hi-IN-SwaraNeural',
                  });
                  voiceManager.speak('Namaste! Swara bilingual voice active hai. Main Hindi aur English dono me ledger audit samjha sakti hoon.');
                }}
                className="text-[10px] bg-gradient-to-r from-orange-500/15 to-emerald-500/15 hover:from-orange-500/25 hover:to-emerald-500/25 text-[#7c5409] px-2 py-0.5 rounded-full font-bold border border-orange-500/30 flex items-center gap-1 transition-all shadow-2xs"
                title="Switch to Swara (Bilingual Hindi & English Female)"
              >
                <span>🇮🇳</span>
                <span>Swara (Bilingual)</span>
              </button>

              <button
                onClick={() => {
                  voiceManager.updateConfig({
                    engine: 'neural',
                    voiceId: 'hi-IN-MadhurNeural',
                  });
                  voiceManager.speak('Namaste! Madhur bilingual risk auditor operational. Poochiye apna financial question.');
                }}
                className="text-[10px] bg-[#FAF7F2] hover:bg-[#E8DCCB]/40 text-[#244A3D] px-2 py-0.5 rounded-full font-bold border border-[#E6E0D6] flex items-center gap-1 transition-all shadow-2xs"
                title="Switch to Madhur (Bilingual Hindi & English Male)"
              >
                <span>🇮🇳</span>
                <span>Madhur (Male)</span>
              </button>
            </div>
            <p className="text-xs text-[#77766F] mt-0.5">
              Bilingual AI Financial Voice (Hindi & English) with Native Lakhs & Crores & ElevenLabs Studio
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {voiceState.isPlaying && (
            <button
              onClick={stopSpeaking}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#A94442] bg-[#FCF7F7] border border-[#E8B6B6] rounded-md hover:bg-red-50 transition-colors shadow-xs"
            >
              <VolumeX className="w-3.5 h-3.5" />
              <span>Stop Audio</span>
            </button>
          )}

          <button
            onClick={() => setIsVoiceModalOpen(true)}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[#244A3D] bg-white border border-[#E6E0D6] rounded-md hover:bg-[#FAF7F2] transition-colors shadow-2xs"
            title="Voice Persona & Synthesis Settings"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Voice Personas</span>
          </button>

          <button
            onClick={handleClearChat}
            className="p-1.5 text-[#77766F] hover:text-[#292D2B] rounded-md hover:bg-[#E8DCCB]/30 transition-colors"
            title="Clear Chat History"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Suggested Questions Bar */}
      <div className="px-6 py-2 bg-[#FAF8F5] border-b border-[#E6E0D6] overflow-x-auto flex items-center gap-2 shrink-0">
        <span className="text-[11px] text-[#77766F] font-medium whitespace-nowrap flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-[#244A3D]" />
          {languageMode === 'bilingual' ? 'सुझाए गए सवाल (Suggested):' : 'Suggested:'}
        </span>
        {activePrompts.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSendQuery(prompt)}
            className="px-2.5 py-1 text-xs rounded-full bg-white border border-[#E6E0D6] text-[#292D2B] hover:bg-[#FAF7F2] hover:border-[#244A3D] whitespace-nowrap transition-colors shadow-2xs"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-6 overflow-y-auto space-y-5 bg-[#FAF8F5]/30">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          const isCurrentlySpeakingThis =
            voiceState.isPlaying && voiceState.currentText === msg.text;
          const isHindiExpanded = Boolean(showHindiMap[msg.id]);

          return (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-3xl ${isUser ? 'ml-auto flex-row-reverse' : ''}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold ${
                  isUser
                    ? 'bg-[#244A3D] text-[#E8DCCB]'
                    : 'bg-[#FAF7F2] text-[#244A3D] border border-[#E8DCCB]'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div className="space-y-2 max-w-2xl">
                {/* Main Speech Bubble (Hinglish or English) */}
                <div
                  className={`p-4 rounded-xl text-xs leading-relaxed transition-all ${
                    isUser
                      ? 'bg-[#244A3D] text-white shadow-xs'
                      : isCurrentlySpeakingThis
                      ? 'bg-white border-2 border-[#D4AF37] text-[#292D2B] shadow-md'
                      : 'bg-white border border-[#E6E0D6] text-[#292D2B] shadow-xs'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>

                  {/* Bilingual Hindi Translation Accordion for Assistant Responses */}
                  {!isUser && msg.spokenTextHindi && (
                    <div className="mt-2.5 pt-2 border-t border-[#E6E0D6]/60">
                      <button
                        onClick={() => toggleHindiTranslation(msg.id)}
                        className="text-[11px] font-semibold text-[#8C6D1F] hover:text-[#705411] flex items-center gap-1 transition-colors"
                      >
                        <Languages className="w-3 h-3 text-[#D4AF37]" />
                        <span>{isHindiExpanded ? 'हिंदी अनुवाद छुपाएं' : '🇮🇳 हिंदी अनुवाद देखें (Devanagari Script)'}</span>
                        {isHindiExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>

                      {isHindiExpanded && (
                        <div className="mt-2 p-2.5 bg-[#FFF9EE] border border-[#F3E2B8] rounded-lg text-xs text-[#5C450C] leading-relaxed animate-in fade-in">
                          <p className="font-sans font-medium">{msg.spokenTextHindi}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Structured Visual Cards Grounded in Ledger */}
                {msg.visualData && (
                  <div className="p-4 bg-white rounded-xl border border-[#E6E0D6] shadow-xs space-y-3">
                    <div className="flex items-center justify-between border-b border-[#E6E0D6] pb-2">
                      <span className="text-xs font-semibold text-[#244A3D]">
                        {msg.visualData.title}
                      </span>
                      <span className="text-[10px] text-[#77766F] uppercase tracking-wider font-mono">
                        FINOVA Evidence
                      </span>
                    </div>

                    {msg.visualData.items && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {msg.visualData.items.map((item: any, idx: number) => (
                          <div
                            key={idx}
                            className="p-2.5 rounded-lg bg-[#FAF8F5] border border-[#E6E0D6]"
                          >
                            <span className="text-[#77766F] block text-[11px] mb-0.5">
                              {item.label}
                            </span>
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-[#292D2B] tabular-nums">
                                {item.value}
                              </span>
                              {item.badge && (
                                <span className="text-[10px] px-2 py-0.2 rounded-full font-medium bg-[#E8DCCB] text-[#244A3D]">
                                  {item.badge}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div
                  className={`flex items-center gap-2 text-[10px] text-[#9C9A93] ${
                    isUser ? 'justify-end' : ''
                  }`}
                >
                  <span>{msg.timestamp}</span>
                  {!isUser && (
                    <button
                      onClick={() =>
                        isCurrentlySpeakingThis ? stopSpeaking() : speakText(msg.text)
                      }
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded transition-colors ${
                        isCurrentlySpeakingThis
                          ? 'bg-[#D4AF37]/20 text-[#84630e] font-semibold'
                          : 'hover:text-[#244A3D] hover:bg-[#FAF7F2]'
                      }`}
                      title={isCurrentlySpeakingThis ? 'Stop speaking' : 'Listen with Neural Voice'}
                    >
                      {isCurrentlySpeakingThis ? (
                        <>
                          <Square className="w-3 h-3 fill-current" />
                          <span>Stop</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>Listen (Realistic Voice)</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Processing Indicator */}
        {isProcessing && (
          <div className="flex gap-3 max-w-xl">
            <div className="w-8 h-8 rounded-full bg-[#FAF7F2] text-[#244A3D] border border-[#E8DCCB] flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-3.5 bg-white border border-[#E6E0D6] rounded-xl flex items-center gap-2 text-xs text-[#77766F] shadow-xs">
              <div className="w-3 h-3 border-2 border-[#244A3D] border-t-transparent rounded-full animate-spin" />
              <span>
                {languageMode === 'bilingual'
                  ? 'SQLite डेटाबेस और वित्तीय मैट्रिक्स का विश्लेषण किया जा रहा है...'
                  : 'Querying local SQLite database & evaluating metrics...'}
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Real-time Dynamic Audio Visualizer Bar */}
      <AudioVisualizer
        personas={personas}
        onOpenSettings={() => setIsVoiceModalOpen(true)}
        className="mx-4 mb-2"
      />

      {/* Voice Animation Waveform Bar when listening */}
      {isListening && (
        <div className="px-6 py-2.5 bg-red-50/80 border-t border-red-200 flex items-center justify-between text-xs text-red-700 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 h-5">
              <span className="w-1 bg-red-600 rounded-full animate-bounce" />
              <span className="w-1 bg-red-600 rounded-full animate-bounce delay-100" />
              <span className="w-1 bg-red-600 rounded-full animate-bounce delay-200" />
            </div>
            <span className="font-semibold">
              {languageMode === 'bilingual'
                ? 'आपका वित्तीय सवाल सुना जा रहा है... (हिंदी या English में बोलिए)'
                : 'Listening for your financial question... (Speak now in English)'}
            </span>
          </div>
          <button
            onClick={() => {
              recognitionRef.current?.stop();
              setIsListening(false);
            }}
            className="text-xs text-red-800 underline font-medium"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Input Bar */}
      <div className="p-4 border-t border-[#E6E0D6] bg-white">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendQuery();
          }}
          className="flex items-center gap-2"
        >
          {/* Microphone toggle */}
          <button
            type="button"
            onClick={toggleListening}
            className={`p-2.5 rounded-lg border transition-all ${
              isListening
                ? 'bg-red-500 text-white border-red-600 animate-pulse shadow-md'
                : 'bg-[#F7F4EE] text-[#244A3D] border-[#E6E0D6] hover:bg-[#E8DCCB]/40'
            }`}
            title={
              isListening
                ? 'Stop Listening'
                : languageMode === 'bilingual'
                ? 'Speak in Hindi or English (माइक दबाकर बोलिए)'
                : 'Speak Question with Microphone'
            }
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          {/* Text Input */}
          <input
            type="text"
            placeholder={
              languageMode === 'bilingual'
                ? 'अपना सवाल हिंदी, Hinglish या English में लिखें (या माइक दबाकर बोलें)...'
                : 'Type your question or click the microphone to speak...'
            }
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 text-xs px-3.5 py-2.5 rounded-lg border border-[#E6E0D6] bg-white text-[#292D2B] focus:outline-none focus:border-[#244A3D]"
          />

          {/* Send button */}
          <button
            type="submit"
            disabled={!inputText.trim() || isProcessing}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-white bg-[#244A3D] hover:bg-[#1E3E33] rounded-lg transition-colors shadow-xs disabled:opacity-40"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send</span>
          </button>
        </form>
      </div>

      {/* Voice Settings & Persona Catalog Modal */}
      <VoiceSettingsModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        personas={personas}
      />
    </div>
  );
};
