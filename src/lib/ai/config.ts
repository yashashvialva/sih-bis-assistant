import OpenAI from 'openai';

// ─── LLM Configuration ─────────────────────────────────────
export const AI_CONFIG = {
  groqApiKey: process.env.GROQ_API_KEY || '',
  llmModel: process.env.LLM_MODEL || 'qwen-2.5-32b',
  llmBaseUrl: process.env.LLM_BASE_URL || 'https://api.groq.com/openai/v1',
};

// ─── Embedding Configuration ───────────────────────────────
export const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || 'Xenova/bge-m3';

// ─── Centralized LLM Client (Singleton) ────────────────────
let _openaiClient: OpenAI | null = null;

/**
 * Returns a centralized OpenAI-compatible client.
 * Used by all API routes (chat, roadmap, document, ingestion).
 * Points to whatever OpenAI-compatible server is configured
 * (Groq, Ollama, vLLM, etc.)
 */
export function getLLMClient(): OpenAI {
  if (!_openaiClient) {
    _openaiClient = new OpenAI({
      apiKey: AI_CONFIG.groqApiKey,
      baseURL: AI_CONFIG.llmBaseUrl,
    });
  }
  return _openaiClient;
}

// ─── Ingestion Rate Limits ─────────────────────────────────
export const INGESTION_CONFIG = {
  requestDelayMs: parseInt(process.env.INGESTION_REQUEST_DELAY_MS || '2000', 10),
  maxRequestsPerMinute: parseInt(process.env.INGESTION_MAX_REQUESTS_PER_MINUTE || '20', 10),
  requestTimeoutMs: parseInt(process.env.INGESTION_REQUEST_TIMEOUT_MS || '30000', 10),
  maxDocumentSizeMb: parseInt(process.env.INGESTION_MAX_DOCUMENT_SIZE_MB || '50', 10),
  maxRetries: parseInt(process.env.INGESTION_MAX_RETRIES || '3', 10),
};
