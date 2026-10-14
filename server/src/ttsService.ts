import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';
import { db } from './db';

export interface VoicePersona {
  id: string;
  name: string;
  locale: string;
  gender: 'Female' | 'Male';
  role: string;
  accent: string;
  description: string;
  sampleText: string;
  isRecommended: boolean;
  provider: 'elevenlabs' | 'azure_edge';
}

export const ELEVENLABS_VOICES: VoicePersona[] = [
  {
    id: 'EXAVITQu4vr4xnSDxMaL',
    name: 'Sarah (ElevenLabs)',
    locale: 'en-US',
    gender: 'Female',
    role: 'Executive Financial Advisor',
    accent: 'American (Mature, Reassuring, Confident)',
    description: 'ElevenLabs top premade executive female voice. Calm, articulate, and hyper-realistic for financial briefings.',
    sampleText: 'Welcome to FINOVA. All metrics are grounded in verified cryptographic ledger transactions.',
    isRecommended: true,
    provider: 'elevenlabs',
  },
  {
    id: 'XrExE9yKIg1WjnnlVkGX',
    name: 'Matilda (ElevenLabs)',
    locale: 'en-US',
    gender: 'Female',
    role: 'Senior Portfolio Analyst',
    accent: 'American (Knowledgeable & Professional)',
    description: 'Sharp, engaging female voice crafted for executive cash flow reports and ledger risk explanations.',
    sampleText: 'Net cash flow is positive with strong operating liquidity across recorded transactions.',
    isRecommended: false,
    provider: 'elevenlabs',
  },
  {
    id: 'pNInz6obpgDQGcFmaJgB',
    name: 'Adam (ElevenLabs)',
    locale: 'en-US',
    gender: 'Male',
    role: 'Chief Compliance & Audit Officer',
    accent: 'American (Deep & Authoritative)',
    description: 'Deep, structured narration suited for forensic risk reviews, audit trails, and security alerts.',
    sampleText: 'Integrity check complete. The canonical SHA-256 hash matches the blockchain registry proof.',
    isRecommended: false,
    provider: 'elevenlabs',
  },
  {
    id: 'hpp4J3VqNfWAUOO0d1Us',
    name: 'Bella (ElevenLabs)',
    locale: 'en-US',
    gender: 'Female',
    role: 'Quantitative Lead Researcher',
    accent: 'American (Professional, Bright, Warm)',
    description: 'Dynamic, clear delivery ideal for explaining anomaly scores, variance rates, and duplicate detection.',
    sampleText: 'Anomaly flagged on transaction batch 4. Counterparty lacks standard institutional tax identifiers.',
    isRecommended: false,
    provider: 'elevenlabs',
  },
  {
    id: 'Xb7hH8MSUJpSbSDYk0k2',
    name: 'Alice (ElevenLabs)',
    locale: 'en-GB',
    gender: 'Female',
    role: 'Institutional Investment Analyst',
    accent: 'British (Clear & Engaging Educator)',
    description: 'Prestigious British cadence for multi-currency reconciliation, treasury liquidity, and consensus proofs.',
    sampleText: 'Ledger synchronization verified. All transaction hashes are immutable and tamper-evident.',
    isRecommended: false,
    provider: 'elevenlabs',
  },
  {
    id: 'onwK4e9ZLuTAKqWW03F9',
    name: 'Daniel (ElevenLabs)',
    locale: 'en-GB',
    gender: 'Male',
    role: 'Senior Broadcaster & FinTech Anchor',
    accent: 'British (Steady & Authoritative)',
    description: 'Steady, broadcast-quality male voice for institutional financial intelligence and blockchain summaries.',
    sampleText: 'Smart contract deployment verified on Sepolia testnet with EIP-712 structured data hashing.',
    isRecommended: false,
    provider: 'elevenlabs',
  },
  {
    id: 'JBFqnCBsd6RMkjVDRZzb',
    name: 'George (ElevenLabs)',
    locale: 'en-GB',
    gender: 'Male',
    role: 'International Treasury Auditor',
    accent: 'British (Warm & Captivating)',
    description: 'Distinguished British voice for global banking settlement and statutory compliance reporting.',
    sampleText: 'Statutory balance sheet review completed with zero unverified ledger variances.',
    isRecommended: false,
    provider: 'elevenlabs',
  },
  {
    id: 'nPczCjzI2devNBz1zQrb',
    name: 'Brian (ElevenLabs)',
    locale: 'en-US',
    gender: 'Male',
    role: 'Cryptographic Security Lead',
    accent: 'American (Deep, Resonant & Comforting)',
    description: 'Resonant and comforting timbre for explaining cryptographic verification and tamper evidence.',
    sampleText: 'Cryptographic integrity test passed. Zero discrepancies detected across hash state verification.',
    isRecommended: false,
    provider: 'elevenlabs',
  },
];

export const NEURAL_VOICE_PERSONAS: VoicePersona[] = [
  {
    id: 'en-IN-NeerjaExpressiveNeural',
    name: 'Neerja Expressive (Indian Local)',
    locale: 'en-IN',
    gender: 'Female',
    role: 'Conversational Financial Analyst',
    accent: 'Indian English (Expressive & Hyper-Realistic)',
    description: 'Ultra-realistic Indian conversational tone with natural pitch inflection, pauses, and native Indian rupee phrasing.',
    sampleText: 'Namaste! Net cash flow across your verified ledger is positive at 4 lakh 50 thousand rupees.',
    isRecommended: true,
    provider: 'azure_edge',
  },
  {
    id: 'en-IN-NeerjaNeural',
    name: 'Neerja Executive (Indian Local)',
    locale: 'en-IN',
    gender: 'Female',
    role: 'Senior Financial Anchor',
    accent: 'Indian English (Crisp & Articulate)',
    description: 'Articulate news-anchor cadence tailored for formal audits, statutory compliance, and balance sheets.',
    sampleText: 'FINOVA voice intelligence active. All transaction indicators are grounded in real-time cryptographic audit records.',
    isRecommended: true,
    provider: 'azure_edge',
  },
  {
    id: 'en-IN-PrabhatNeural',
    name: 'Prabhat (Indian Local)',
    locale: 'en-IN',
    gender: 'Male',
    role: 'Lead Quantitative Researcher',
    accent: 'Indian English (Natural Male)',
    description: 'Authoritative, calm Indian male voice optimized for forensic anomaly detection and numerical variance.',
    sampleText: 'Risk evaluation complete. The ledger shows three anomalous transfers exceeding threshold limits.',
    isRecommended: false,
    provider: 'azure_edge',
  },
  {
    id: 'hi-IN-SwaraNeural',
    name: 'Swara (Hindi / Indian Bilingual)',
    locale: 'hi-IN',
    gender: 'Female',
    role: 'Bilingual Financial Specialist',
    accent: 'Hindi / Indian English',
    description: 'Natural bilingual tone fluent in both Hindi phrasing and English financial terminology.',
    sampleText: 'Namaste! FINOVA ledger audit complete. All transaction records are cryptographically verified and secure.',
    isRecommended: false,
    provider: 'azure_edge',
  },
  {
    id: 'hi-IN-MadhurNeural',
    name: 'Madhur (Hindi / Indian Bilingual)',
    locale: 'hi-IN',
    gender: 'Male',
    role: 'Bilingual Risk Auditor',
    accent: 'Hindi / Indian English',
    description: 'Clear, authoritative male bilingual voice for Indian treasury and compliance reporting.',
    sampleText: 'FINOVA blockchain audit report ready. Ledger hash state is completely secure and verified.',
    isRecommended: false,
    provider: 'azure_edge',
  },
  {
    id: 'en-US-JennyNeural',
    name: 'Jenny (Edge/Azure)',
    locale: 'en-US',
    gender: 'Female',
    role: 'Chief Financial Officer',
    accent: 'US English (Warm & Executive)',
    description: 'Natural, highly engaging executive tone for institutional portfolio summaries and executive briefings.',
    sampleText: 'Welcome to FINOVA. Net cash flow is positive, and our cryptographic hash verification confirms zero tampering.',
    isRecommended: false,
    provider: 'azure_edge',
  },
  {
    id: 'en-US-GuyNeural',
    name: 'Guy (Edge/Azure)',
    locale: 'en-US',
    gender: 'Male',
    role: 'Senior Compliance & Risk Auditor',
    accent: 'US English (Deep & Authoritative)',
    description: 'Deep, structured timbre suited for compliance alerts, regulatory checks, and smart contract audit trails.',
    sampleText: 'Audit alert: Transaction batch verified against local SHA-256 state tree. All proofs intact.',
    isRecommended: false,
    provider: 'azure_edge',
  },
  {
    id: 'en-US-AriaNeural',
    name: 'Aria (Edge/Azure)',
    locale: 'en-US',
    gender: 'Female',
    role: 'AI Systems & Data Analyst',
    accent: 'US English (Crisp & Technical)',
    description: 'Clear, modern cadence ideal for rapid queries, educational explainers, and blockchain inspection.',
    sampleText: 'Displaying ledger integrity report. The current root hash matches on-chain state verification.',
    isRecommended: false,
    provider: 'azure_edge',
  },
  {
    id: 'en-GB-SoniaNeural',
    name: 'Sonia (Edge/Azure)',
    locale: 'en-GB',
    gender: 'Female',
    role: 'International Banking Specialist',
    accent: 'British English (Refined & Clear)',
    description: 'Prestigious global banking tone for international settlement flows and institutional balance sheets.',
    sampleText: 'International reconciliation finished. All cross-border settlement channels report normal variance.',
    isRecommended: false,
    provider: 'azure_edge',
  },
  {
    id: 'en-GB-RyanNeural',
    name: 'Ryan (Edge/Azure)',
    locale: 'en-GB',
    gender: 'Male',
    role: 'Blockchain Infrastructure Architect',
    accent: 'British English (Polished)',
    description: 'Precise technical voice for immutable consensus records and cryptographic payload verification.',
    sampleText: 'Consensus hash calculated using canonical JSON encoding and 256-bit secure cryptographic standards.',
    isRecommended: false,
    provider: 'azure_edge',
  },
];

export type NeuralVoicePersona = VoicePersona;

/**
 * Normalizes text so that financial symbols, abbreviations, Indian numbers,
 * currency, and markdown sound completely natural and realistic when spoken.
 */
export function normalizeFinancialText(rawText: string): string {
  if (!rawText) return '';

  let text = rawText;

  // Remove markdown bold, italic, code ticks
  text = text.replace(/[*_`#]/g, '');

  // Clean markdown links [text](url) -> text
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

  // Clean bullet list markers
  text = text.replace(/^\s*[-*•]\s+/gm, ' ');

  // Clean table pipes
  text = text.replace(/\|/g, ', ');

  // Convert Devanagari numerals to standard digits (०-९ -> 0-9)
  text = text.replace(/[\u0966-\u096F]/g, (d) => (d.charCodeAt(0) - 0x0966).toString());

  // Normalize Indian Rupee amounts: e.g. ₹1,24,500.00, Rs. 5000, रु 2,00,000, or INR 50,000
  text = text.replace(/(?:₹|Rs\.?|रु\.?|INR)\s*([0-9,]+(?:\.[0-9]+)?)/gi, (_match, numStr) => {
    const cleanNum = parseFloat(numStr.replace(/,/g, ''));
    if (isNaN(cleanNum)) return `${numStr} rupees`;

    if (cleanNum >= 10000000) {
      const cr = (cleanNum / 10000000).toFixed(2).replace(/\.?0+$/, '');
      return `${cr} crore rupees`;
    } else if (cleanNum >= 100000) {
      const lakh = (cleanNum / 100000).toFixed(2).replace(/\.?0+$/, '');
      return `${lakh} lakh rupees`;
    } else if (cleanNum >= 1000) {
      return `${cleanNum.toLocaleString('en-IN')} rupees`;
    } else {
      return `${cleanNum} rupees`;
    }
  });

  // Normalize Dollar amounts: e.g. $12,450.00
  text = text.replace(/\$\s*([0-9,]+(?:\.[0-9]+)?)/g, (_match, numStr) => {
    const cleanNum = parseFloat(numStr.replace(/,/g, ''));
    if (isNaN(cleanNum)) return `${numStr} dollars`;
    return `${cleanNum.toLocaleString('en-US')} dollars`;
  });

  // Expand transaction IDs: e.g. TXN-1002 -> Transaction 1 0 0 2
  text = text.replace(/TXN-([0-9]+)/gi, (_match, digits) => {
    return `Transaction ${digits.split('').join(' ')}`;
  });

  // Expand hex hashes e.g. 0x3a4f... -> hash starting zero x 3 a 4 f
  text = text.replace(/0x([a-fA-F0-9]{4})[a-fA-F0-9]{8,}/g, (_match, prefix) => {
    return `hash zero x ${prefix.split('').join(' ')} and continuing`;
  });

  // Technical acronyms to phonetic speech
  text = text.replace(/\bSHA-?256\b/gi, 'S H A two fifty-six');
  text = text.replace(/\bTxID\b/g, 'Transaction ID');
  text = text.replace(/\btxid\b/g, 'transaction ID');
  text = text.replace(/\bAML\b/g, 'anti money laundering');
  text = text.replace(/\bKYC\b/g, 'K Y C');
  text = text.replace(/\bDeFi\b/g, 'Decentralized Finance');
  text = text.replace(/\bP2P\b/g, 'peer to peer');
  text = text.replace(/\bAPR\b/g, 'annual percentage rate');
  text = text.replace(/\bROI\b/g, 'return on investment');
  text = text.replace(/\bvs\.?\b/gi, 'versus');
  text = text.replace(/\b&\b/g, ' and ');
  text = text.replace(/\bAPI\b/g, 'A P I');
  text = text.replace(/\bAI\b/g, 'A I');
  text = text.replace(/\bUI\b/g, 'user interface');
  text = text.replace(/%/g, ' percent');

  // Clean double spaces and linebreaks for smooth breathing rhythm
  text = text.replace(/\s+/g, ' ').trim();

  return text;
}

// In-memory cache for synthesized audio buffers (stores up to 100 recently used speech clips)
const audioBufferCache = new Map<string, { buffer: Buffer; timestamp: number }>();
const MAX_CACHE_SIZE = 100;

/**
 * Retrieves the ElevenLabs API Key from process environment or SQLite system_settings.
 */
export function getElevenLabsApiKey(): string | null {
  if (process.env.ELEVENLABS_API_KEY && process.env.ELEVENLABS_API_KEY.trim()) {
    return process.env.ELEVENLABS_API_KEY.trim();
  }
  try {
    const row = db
      .prepare("SELECT value FROM system_settings WHERE key = 'elevenlabs_api_key'")
      .get() as any;
    if (row && row.value && row.value.trim()) {
      return row.value.trim();
    }
  } catch {
    // Ignore db access errors
  }
  return null;
}

/**
 * Validates an ElevenLabs API key by contacting their subscription endpoint.
 */
export async function validateElevenLabsKey(apiKey?: string): Promise<{
  valid: boolean;
  tier?: string;
  characterCount?: number;
  characterLimit?: number;
  error?: string;
}> {
  const key = apiKey || getElevenLabsApiKey();
  if (!key) {
    return { valid: false, error: 'No ElevenLabs API key provided' };
  }

  try {
    const res = await fetch('https://api.elevenlabs.io/v1/user/subscription', {
      headers: { 'xi-api-key': key },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return {
        valid: false,
        error: err.detail?.message || err.message || `HTTP ${res.status}: Authentication failed`,
      };
    }

    const data = await res.json();
    return {
      valid: true,
      tier: data.tier || 'free',
      characterCount: data.character_count || 0,
      characterLimit: data.character_limit || 10000,
    };
  } catch (error: any) {
    return { valid: false, error: error.message || 'Network request failed' };
  }
}

/**
 * Synthesizes speech using ElevenLabs Free / Standard Realistic Voice API.
 */
export async function synthesizeElevenLabsSpeech(
  text: string,
  voiceId = 'EXAVITQu4vr4xnSDxMaL', // Sarah (Verified ElevenLabs Premade Voice)
  userApiKey?: string,
  modelId = 'eleven_flash_v2_5' // Fast, low-latency, free tier optimized model
): Promise<Buffer> {
  const normalized = normalizeFinancialText(text);
  if (!normalized) {
    throw new Error('No speech text provided for synthesis');
  }

  const key = userApiKey || getElevenLabsApiKey();
  if (!key) {
    throw new Error(
      'ELEVENLABS_KEY_MISSING: No ElevenLabs API key found. Enter your free key in Settings or enjoy Azure Neural Studio.'
    );
  }

  const cacheKey = `eleven_${voiceId}_${modelId}_${normalized}`;
  const cached = audioBufferCache.get(cacheKey);
  if (cached) {
    return cached.buffer;
  }

  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'xi-api-key': key,
      'Content-Type': 'application/json',
      Accept: 'audio/mpeg',
    },
    body: JSON.stringify({
      text: normalized,
      model_id: modelId,
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.0,
        use_speaker_boost: true,
      },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    let msg = `HTTP ${response.status}`;
    try {
      const parsed = JSON.parse(errText);
      msg = parsed.detail?.message || parsed.message || errText;
    } catch {
      msg = errText;
    }

    if (response.status === 401) {
      throw new Error(`ELEVENLABS_AUTH_FAILED: Invalid API key. ${msg}`);
    } else if (response.status === 429) {
      throw new Error(`ELEVENLABS_QUOTA_EXCEEDED: Free character quota reached. ${msg}`);
    }
    throw new Error(`ElevenLabs API error (${response.status}): ${msg}`);
  }

  const arrayBuf = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuf);

  if (audioBufferCache.size >= MAX_CACHE_SIZE) {
    const firstKey = audioBufferCache.keys().next().value;
    if (firstKey) audioBufferCache.delete(firstKey);
  }
  audioBufferCache.set(cacheKey, { buffer, timestamp: Date.now() });

  return buffer;
}

/**
 * Synthesizes realistic neural audio for the given text using Azure / Edge Neural TTS.
 * Returns a Buffer containing high-quality MP3 audio.
 */
export async function synthesizeNeuralSpeech(
  text: string,
  voiceId = 'en-IN-NeerjaNeural',
  rate = '+0%',
  pitch = '+0Hz'
): Promise<Buffer> {
  const normalized = normalizeFinancialText(text);
  if (!normalized) {
    throw new Error('No speech text provided for synthesis');
  }

  // Validate voiceId or fallback to Neerja
  const validPersona = NEURAL_VOICE_PERSONAS.find((p) => p.id === voiceId);
  const selectedVoice = validPersona ? validPersona.id : 'en-IN-NeerjaNeural';

  const cacheKey = `azure_${selectedVoice}_${rate}_${pitch}_${normalized}`;
  const cached = audioBufferCache.get(cacheKey);
  if (cached) {
    return cached.buffer;
  }

  const tts = new MsEdgeTTS();
  await tts.setMetadata(selectedVoice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);

  const { audioStream } = tts.toStream(normalized, {
    rate,
    pitch,
    volume: '+0%',
  });

  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];

    audioStream.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
    });

    audioStream.on('end', () => {
      const finalBuffer = Buffer.concat(chunks);
      if (audioBufferCache.size >= MAX_CACHE_SIZE) {
        const firstKey = audioBufferCache.keys().next().value;
        if (firstKey) audioBufferCache.delete(firstKey);
      }
      audioBufferCache.set(cacheKey, { buffer: finalBuffer, timestamp: Date.now() });
      resolve(finalBuffer);
    });

    audioStream.on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Unified synthesis function that routes to ElevenLabs, Azure Neural, or seamless fallback.
 */
export async function synthesizeUnifiedSpeech(options: {
  text: string;
  engine?: 'elevenlabs' | 'neural' | 'browser';
  voiceId?: string;
  rate?: string;
  pitch?: string;
  apiKey?: string;
}): Promise<{
  buffer: Buffer;
  engineUsed: 'elevenlabs' | 'neural';
  fallbackOccurred: boolean;
  fallbackReason?: string;
}> {
  const { text, engine = 'neural', voiceId, rate = '+0%', pitch = '+0Hz', apiKey } = options;

  if (engine === 'elevenlabs') {
    try {
      const elevenVoiceId =
        voiceId && ELEVENLABS_VOICES.some((v) => v.id === voiceId)
          ? voiceId
          : 'EXAVITQu4vr4xnSDxMaL'; // Sarah default
      const buffer = await synthesizeElevenLabsSpeech(text, elevenVoiceId, apiKey);
      return { buffer, engineUsed: 'elevenlabs', fallbackOccurred: false };
    } catch (err: any) {
      console.warn('ElevenLabs unavailable, activating Azure Neural fallback:', err.message);
      // Fallback seamlessly to Azure Neural (Jenny or Neerja)
      const fallbackVoice = 'en-US-JennyNeural';
      const buffer = await synthesizeNeuralSpeech(text, fallbackVoice, rate, pitch);
      return {
        buffer,
        engineUsed: 'neural',
        fallbackOccurred: true,
        fallbackReason: err.message,
      };
    }
  }

  // Azure Neural default
  const azureVoice =
    voiceId && NEURAL_VOICE_PERSONAS.some((v) => v.id === voiceId)
      ? voiceId
      : 'en-IN-NeerjaNeural';
  const buffer = await synthesizeNeuralSpeech(text, azureVoice, rate, pitch);
  return { buffer, engineUsed: 'neural', fallbackOccurred: false };
}
