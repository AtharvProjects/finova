import { getNeuralAudioUrl } from './api';
import { VoiceConfig, VoiceEngineType } from '../types';

export const DEFAULT_VOICE_CONFIG: VoiceConfig = {
  engine: 'elevenlabs',
  voiceId: 'EXAVITQu4vr4xnSDxMaL', // Sarah (ElevenLabs)
  rate: '+0%',
  pitch: '+0Hz',
  autoSpeak: true,
  elevenLabsApiKey: 'sk_35c086d1dafdd97e77cad8f601281d8c5b081fdf5b82348d',
};

type VoiceStateListener = (state: {
  isPlaying: boolean;
  isPaused: boolean;
  currentText: string;
  activePersonaId: string;
  engine: VoiceEngineType;
}) => void;

class VoiceManager {
  private audioElement: HTMLAudioElement | null = null;
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private listeners: Set<VoiceStateListener> = new Set();
  private isPlaying = false;
  private isPaused = false;
  private currentText = '';
  private currentEngine: VoiceEngineType = 'neural';
  private config: VoiceConfig = DEFAULT_VOICE_CONFIG;

  constructor() {
    this.loadSavedConfig();
  }

  private loadSavedConfig() {
    try {
      const saved = localStorage.getItem('finova_voice_config');
      if (saved) {
        this.config = { ...DEFAULT_VOICE_CONFIG, ...JSON.parse(saved) };
      }
    } catch {
      this.config = DEFAULT_VOICE_CONFIG;
    }
  }

  public getConfig(): VoiceConfig {
    return { ...this.config };
  }

  public updateConfig(newConfig: Partial<VoiceConfig>) {
    this.config = { ...this.config, ...newConfig };
    try {
      localStorage.setItem('finova_voice_config', JSON.stringify(this.config));
    } catch {
      // Ignore storage errors
    }
    this.notify();
  }

  public subscribe(listener: VoiceStateListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getState() {
    return {
      isPlaying: this.isPlaying,
      isPaused: this.isPaused,
      currentText: this.currentText,
      activePersonaId: this.config.voiceId,
      engine: this.currentEngine,
    };
  }

  private notify() {
    const state = this.getState();
    this.listeners.forEach((l) => l(state));
  }

  private initAudio() {
    if (!this.audioElement) {
      this.audioElement = new Audio();
      this.audioElement.crossOrigin = 'anonymous';

      this.audioElement.onplay = () => {
        this.isPlaying = true;
        this.isPaused = false;
        this.notify();
      };

      this.audioElement.onpause = () => {
        if (this.audioElement && !this.audioElement.ended) {
          this.isPaused = true;
          this.notify();
        }
      };

      this.audioElement.onended = () => {
        this.isPlaying = false;
        this.isPaused = false;
        this.currentText = '';
        this.notify();
      };

      this.audioElement.onerror = () => {
        console.warn('Audio streaming error, activating local browser speech synthesis fallback...');
        this.isPlaying = false;
        this.isPaused = false;
        this.notify();
        if (this.currentText) {
          this.speakWithBrowser(this.currentText);
        }
      };
    }

    try {
      if (!this.audioCtx && (window.AudioContext || (window as any).webkitAudioContext)) {
        const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
        this.audioCtx = new AudioCtxClass();
        this.analyser = this.audioCtx.createAnalyser();
        this.analyser.fftSize = 64;

        if (this.audioElement && !this.sourceNode) {
          try {
            this.sourceNode = this.audioCtx.createMediaElementSource(this.audioElement);
            this.sourceNode.connect(this.analyser);
            this.analyser.connect(this.audioCtx.destination);
          } catch {
            // Some browsers restrict media source connection
          }
        }
      }
    } catch {
      // AudioContext init not critical
    }
  }

  public getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  public async speak(text: string, overrideConfig?: Partial<VoiceConfig>): Promise<void> {
    const cfg = { ...this.config, ...overrideConfig };
    this.stop();

    if (!text || !text.trim()) return;

    this.currentText = text;
    this.currentEngine = cfg.engine;

    if (cfg.engine === 'neural' || cfg.engine === 'elevenlabs') {
      try {
        this.initAudio();
        if (this.audioCtx && this.audioCtx.state === 'suspended') {
          await this.audioCtx.resume().catch(() => {});
        }

        // Direct stream URL with engine and optional key
        const streamUrl = getNeuralAudioUrl(
          text,
          cfg.voiceId,
          cfg.rate,
          cfg.pitch,
          cfg.engine,
          cfg.elevenLabsApiKey
        );
        if (this.audioElement) {
          this.audioElement.src = streamUrl;
          await this.audioElement.play();
        }
      } catch (err) {
        console.warn('Server TTS stream failed, falling back to local speech synthesis:', err);
        this.speakWithBrowser(text);
      }
    } else {
      this.speakWithBrowser(text);
    }
  }

  public speakWithBrowser(text: string) {
    if (!('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();
    this.currentEngine = 'browser';
    this.isPlaying = true;
    this.isPaused = false;
    this.notify();

    const utterance = new SpeechSynthesisUtterance(text);

    // Intelligently select best available local voice
    const voices = window.speechSynthesis.getVoices();
    const rankedVoice =
      voices.find(
        (v) =>
          v.lang.includes('en-IN') &&
          (v.name.includes('Natural') || v.name.includes('Enhanced'))
      ) ||
      voices.find((v) => v.name.includes('Google') && v.lang.includes('en')) ||
      voices.find(
        (v) =>
          v.name.includes('Samantha') ||
          v.name.includes('Ava') ||
          v.name.includes('Siri')
      ) ||
      voices.find((v) => v.lang.includes('en-IN')) ||
      voices.find((v) => v.lang.includes('en-US')) ||
      voices.find((v) => v.lang.includes('en'));

    if (rankedVoice) {
      utterance.voice = rankedVoice;
    }

    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      this.isPlaying = true;
      this.notify();
    };

    utterance.onend = () => {
      this.isPlaying = false;
      this.isPaused = false;
      this.currentText = '';
      this.notify();
    };

    utterance.onerror = () => {
      this.isPlaying = false;
      this.isPaused = false;
      this.notify();
    };

    window.speechSynthesis.speak(utterance);
  }

  public stop() {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.currentTime = 0;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.isPlaying = false;
    this.isPaused = false;
    this.currentText = '';
    this.notify();
  }

  public pause() {
    if (this.audioElement && this.isPlaying && !this.isPaused) {
      this.audioElement.pause();
      this.isPaused = true;
      this.notify();
    }
  }

  public resume() {
    if (this.audioElement && this.isPaused) {
      this.audioElement.play().catch(() => {});
      this.isPaused = false;
      this.notify();
    }
  }
}

export const voiceManager = new VoiceManager();
