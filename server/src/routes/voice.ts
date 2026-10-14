import { Router, Request, Response } from 'express';
import { handleVoiceQuery } from '../voiceAssistant';
import {
  NEURAL_VOICE_PERSONAS,
  ELEVENLABS_VOICES,
  normalizeFinancialText,
  synthesizeUnifiedSpeech,
  validateElevenLabsKey,
  getElevenLabsApiKey,
} from '../ttsService';
import { db } from '../db';

const router = Router();

// GET /api/voice/personas - returns all realistic personas (Azure Neural + ElevenLabs)
router.get('/personas', async (_req: Request, res: Response) => {
  const currentKey = getElevenLabsApiKey();
  const maskedKey = currentKey
    ? `${currentKey.slice(0, 4)}...${currentKey.slice(-4)}`
    : null;

  res.json({
    personas: NEURAL_VOICE_PERSONAS,
    elevenLabsPersonas: ELEVENLABS_VOICES,
    defaultVoice: 'en-IN-NeerjaNeural',
    elevenLabsDefaultVoice: 'EXAVITQu4vr4xnSDxMaL',
    hasElevenLabsKey: Boolean(currentKey),
    maskedKey,
    engines: [
      { id: 'elevenlabs', name: 'ElevenLabs AI', subtitle: 'Hyper-Realistic Studio Voice (Free Tier / Custom API)' },
      { id: 'neural', name: 'Azure Neural Studio', subtitle: 'Natural AI Voice (Free, Unlimited, No Key Required)' },
      { id: 'browser', name: 'Browser Speech API', subtitle: 'Local Device Speech Engine (Offline)' },
    ],
  });
});

// POST /api/voice/validate-key - tests an ElevenLabs API key and returns remaining quota
router.post('/validate-key', async (req: Request, res: Response) => {
  const { apiKey } = req.body;
  const result = await validateElevenLabsKey(apiKey);
  res.json(result);
});

// POST /api/voice/save-key - stores ElevenLabs API key in SQLite system_settings
router.post('/save-key', (req: Request, res: Response) => {
  try {
    const { apiKey } = req.body;
    if (typeof apiKey !== 'string') {
      return res.status(400).json({ error: 'apiKey must be a string' });
    }

    db.prepare('INSERT OR REPLACE INTO system_settings (key, value) VALUES (?, ?)').run(
      'elevenlabs_api_key',
      apiKey.trim()
    );

    res.json({
      success: true,
      hasKey: Boolean(apiKey.trim()),
      message: apiKey.trim()
        ? 'ElevenLabs API key saved successfully'
        : 'ElevenLabs API key cleared',
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to save ElevenLabs API key' });
  }
});

// POST /api/voice/tts - synthesizes speech via ElevenLabs or Azure Neural with automatic fallback
router.post('/tts', async (req: Request, res: Response) => {
  try {
    const { text, engine, voiceId, rate, pitch, apiKey } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required for TTS synthesis' });
    }

    const { buffer, engineUsed, fallbackOccurred, fallbackReason } =
      await synthesizeUnifiedSpeech({
        text,
        engine: engine || 'neural',
        voiceId,
        rate,
        pitch,
        apiKey,
      });

    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': buffer.length,
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'public, max-age=3600',
      'X-FINOVA-Engine-Used': engineUsed,
      'X-FINOVA-Fallback': fallbackOccurred ? 'true' : 'false',
    });

    if (fallbackReason) {
      res.set('X-FINOVA-Fallback-Reason', encodeURIComponent(fallbackReason));
    }

    res.send(buffer);
  } catch (error: any) {
    console.error('Unified TTS synthesis error:', error);
    res.status(500).json({
      error: error.message || 'Failed to synthesize realistic voice audio',
      fallbackRecommended: true,
    });
  }
});

// GET /api/voice/tts - allows direct <audio src="..."> streaming
router.get('/tts', async (req: Request, res: Response) => {
  try {
    const text = req.query.text as string;
    const engine = (req.query.engine as any) || 'neural';
    const voiceId = req.query.voiceId as string;
    const rate = (req.query.rate as string) || '+0%';
    const pitch = (req.query.pitch as string) || '+0Hz';
    const apiKey = req.query.apiKey as string;

    if (!text) {
      return res.status(400).json({ error: 'Text query parameter is required' });
    }

    const { buffer, engineUsed, fallbackOccurred, fallbackReason } =
      await synthesizeUnifiedSpeech({
        text,
        engine,
        voiceId,
        rate,
        pitch,
        apiKey,
      });

    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': buffer.length,
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'public, max-age=3600',
      'X-FINOVA-Engine-Used': engineUsed,
      'X-FINOVA-Fallback': fallbackOccurred ? 'true' : 'false',
    });

    if (fallbackReason) {
      res.set('X-FINOVA-Fallback-Reason', encodeURIComponent(fallbackReason));
    }

    res.send(buffer);
  } catch (error: any) {
    console.error('Unified TTS GET error:', error);
    res.status(500).json({
      error: error.message || 'Failed to stream realistic voice audio',
      fallbackRecommended: true,
    });
  }
});

// POST /api/voice/normalize - pre-normalizes text for clear human speech
router.post('/normalize', (req: Request, res: Response) => {
  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'Text parameter is required' });
  }
  const normalized = normalizeFinancialText(text);
  res.json({ original: text, normalized });
});

// POST /api/voice/query - processed AI grounded voice assistant query (English & Bilingual Hindi)
router.post('/query', (req: Request, res: Response) => {
  try {
    const { query, language } = req.body;
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Query string is required' });
    }

    const response = handleVoiceQuery(query, language);
    const normalizedSpokenText = normalizeFinancialText(response.spokenText);

    res.json({
      ...response,
      normalizedSpokenText,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Voice assistant query failed' });
  }
});

export default router;
