import React, { useEffect, useState, useRef } from 'react';
import { Volume2, VolumeX, Sparkles, Sliders } from 'lucide-react';
import { voiceManager } from '../../lib/voiceManager';
import { NeuralVoicePersona } from '../../types';

interface AudioVisualizerProps {
  personas: NeuralVoicePersona[];
  onOpenSettings?: () => void;
  className?: string;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  personas,
  onOpenSettings,
  className = '',
}) => {
  const [voiceState, setVoiceState] = useState(voiceManager.getState());
  const [bars, setBars] = useState<number[]>([20, 45, 70, 90, 60, 30, 75, 40, 85, 50, 25, 65]);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const unsubscribe = voiceManager.subscribe((st) => {
      setVoiceState(st);
    });
    return () => unsubscribe();
  }, []);

  // Animate frequency bars during playback
  useEffect(() => {
    if (!voiceState.isPlaying || voiceState.isPaused) {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      setBars([15, 20, 25, 20, 15, 20, 25, 20, 15, 20, 25, 20]);
      return;
    }

    const analyser = voiceManager.getAnalyser();
    const dataArray = analyser ? new Uint8Array(analyser.frequencyBinCount) : null;

    const updateBars = () => {
      if (analyser && dataArray) {
        analyser.getByteFrequencyData(dataArray);
        // Sample 12 frequencies
        const step = Math.floor(dataArray.length / 12) || 1;
        const newBars: number[] = [];
        for (let i = 0; i < 12; i++) {
          const val = dataArray[i * step] || 0;
          // Scale 0-255 to percentage 15% - 100%
          const pct = Math.max(15, Math.min(100, (val / 255) * 100));
          newBars.push(pct);
        }
        setBars(newBars);
      } else {
        // Fallback rhythmic wave animation
        const now = Date.now() / 150;
        const fallbackBars = Array.from({ length: 12 }, (_, i) => {
          const wave = Math.sin(now + i * 0.6) * 35 + 50;
          return Math.max(15, Math.min(100, wave + (Math.random() * 15 - 7.5)));
        });
        setBars(fallbackBars);
      }

      animationRef.current = requestAnimationFrame(updateBars);
    };

    animationRef.current = requestAnimationFrame(updateBars);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [voiceState.isPlaying, voiceState.isPaused]);

  if (!voiceState.isPlaying && !voiceState.isPaused) {
    return null;
  }

  const activePersona = personas.find((p) => p.id === voiceState.activePersonaId);

  return (
    <div
      className={`bg-[#0d1424]/95 border border-[#1e293b] rounded-xl px-4 py-3 shadow-2xl backdrop-blur-md flex items-center justify-between gap-4 transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 ${className}`}
    >
      <div className="flex items-center gap-3">
        <div className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37]">
          <Volume2 className="w-5 h-5 animate-pulse" />
          <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#10B981]"></span>
          </span>
        </div>

        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-white tracking-wide">
              {activePersona ? activePersona.name : 'FINOVA Realistic Voice'}
            </span>
            <span
              className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                voiceState.engine === 'elevenlabs'
                  ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                  : voiceState.engine === 'neural'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-sky-500/10 text-sky-400 border-sky-500/20'
              }`}
            >
              <Sparkles className="w-2.5 h-2.5" />
              {voiceState.engine === 'elevenlabs'
                ? 'ElevenLabs AI'
                : voiceState.engine === 'neural'
                ? 'Azure Neural Studio'
                : 'Enhanced Speech API'}
            </span>
            <span className="text-[10px] text-gray-400 font-mono hidden sm:inline">
              {activePersona ? activePersona.locale : 'en-IN'}
            </span>
          </div>
          <p className="text-[11px] text-gray-400 truncate max-w-xs sm:max-w-md">
            {voiceState.currentText || 'Speaking verified financial metrics...'}
          </p>
        </div>
      </div>

      {/* Real-time Dynamic EQ Visualizer bars */}
      <div className="flex items-center gap-3">
        <div className="flex items-end gap-1 h-7 px-2 py-1 bg-black/40 rounded-lg border border-white/5">
          {bars.map((h, idx) => (
            <div
              key={idx}
              className="w-1 rounded-full transition-all duration-75"
              style={{
                height: `${h}%`,
                background:
                  idx % 3 === 0
                    ? '#D4AF37'
                    : idx % 3 === 1
                    ? '#38BDF8'
                    : '#10B981',
              }}
            />
          ))}
        </div>

        {/* Quick controls */}
        <div className="flex items-center gap-1">
          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              title="Voice Settings & Personas"
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <Sliders className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => voiceManager.stop()}
            title="Stop Speaking"
            className="p-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
          >
            <VolumeX className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
