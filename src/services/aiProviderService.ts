import { db, AISettings } from '../db/schema';
import { getAIContext, generateBuiltinAnalyticalResponse } from '../engine/aiContextEngine';

export const DEFAULT_AI_SETTINGS: AISettings = {
  id: 'default',
  mode: 'local',
  provider: 'ollama',
  model: 'llama3.1',
  apiKey: '',
  endpoint: 'http://localhost:11434/v1/chat/completions',
  temperature: 0.7,
  tone: 'analytical',
  behavioralFramework: 'Act as a precise, factual personal productivity copilot. Provide direct, evidence-based data interpretations.',
  privacy: {
    allowHabitData: true,
    allowTaskData: true,
    allowProjectData: true,
    allowGoalData: true,
    allowJournalData: false,
    allowHistoricalData: true,
  },
  enableStreaming: true,
};

export function maskApiKey(key?: string): string {
  if (!key || key.trim().length < 8) return '';
  const trimmed = key.trim();
  const prefix = trimmed.slice(0, 3);
  const suffix = trimmed.slice(-4);
  return `${prefix}••••••••${suffix}`;
}

/**
  Normalizes Base URL input into a full chat completions endpoint URL.
  e.g., "https://api.openai.com/v1" -> "https://api.openai.com/v1/chat/completions"
  "https://openrouter.ai/api/v1" -> "https://openrouter.ai/api/v1/chat/completions"
  "http://localhost:11434" -> "http://localhost:11434/v1/chat/completions"
 */
export function normalizeEndpointUrl(url?: string, isLocal: boolean = false): string {
  if (!url || !url.trim()) {
    return isLocal ? 'http://localhost:11434/v1/chat/completions' : 'https://api.openai.com/v1/chat/completions';
  }
  let cleaned = url.trim().replace(/\/+$/, '');

  // If already full endpoint, return as is
  if (cleaned.endsWith('/chat/completions')) {
    return cleaned;
  }

  // If base URL ends with /v1
  if (cleaned.endsWith('/v1')) {
    return `${cleaned}/chat/completions`;
  }

  // Otherwise append /v1/chat/completions or /chat/completions
  return `${cleaned}/v1/chat/completions`;
}

export async function getAISettings(): Promise<AISettings> {
  const settings = await db.aiSettings.get('default');
  if (!settings) {
    await db.aiSettings.add(DEFAULT_AI_SETTINGS);
    return DEFAULT_AI_SETTINGS;
  }
  return { ...DEFAULT_AI_SETTINGS, ...settings };
}

export async function saveAISettings(settings: Partial<AISettings>): Promise<void> {
  const current = await getAISettings();
  await db.aiSettings.put({ ...current, ...settings, id: 'default' });
}

/**
 * Validates Local (Ollama) or Cloud AI provider credentials against specified endpoint.
 * Optimized for low-latency verification.
 */
export async function testAIConnection(settings: AISettings): Promise<{ success: boolean; message: string }> {
  const isLocal = settings.mode === 'local' || settings.provider === 'ollama';

  if (isLocal) {
    const endpoint = normalizeEndpointUrl(settings.endpoint || 'http://localhost:11434/v1/chat/completions', true);
    const model = settings.model || 'llama3.1';

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: 'Ping' }],
          max_tokens: 5,
        }),
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          message: `Local Model Error (${response.status}): ${errorText.slice(0, 120)}. Ensure 'ollama serve' is running at ${endpoint}.`,
        };
      }
      return { success: true, message: `Local Model Connection Verified (${model})!` };
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        return { success: false, message: `Local server timeout at ${endpoint}. Please verify local service response time.` };
      }
      return { success: false, message: `Network error connecting to local model: ${err.message || err}` };
    }
  }

  // Generic Cloud Provider Validation
  if (!settings.apiKey || !settings.apiKey.trim()) {
    return { success: false, message: 'API Key is required for Cloud Model configuration.' };
  }

  const endpoint = normalizeEndpointUrl(settings.endpoint || 'https://api.openai.com/v1', false);
  const model = settings.model?.trim() || 'gpt-4o-mini';

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 7000);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.apiKey.trim()}`,
      },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: 'Ping' }],
        max_tokens: 5,
        temperature: 0.1,
      }),
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        message: `Cloud Provider Error (${response.status}): ${errorText.slice(0, 140)}. Check API Key, Base URL, and Model Name (${model}).`,
      };
    }

    return { success: true, message: `Cloud AI Provider Connection Verified (${model})!` };
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      return { success: false, message: `Connection timed out reaching ${endpoint}. Please verify network connectivity.` };
    }
    return { success: false, message: `Network error connecting to endpoint: ${err.message || err}` };
  }
}

/**
 * Standardized Vendor-Agnostic AI Assistant Query Engine.
 * Supports both Local Models (Ollama) and Generic Cloud Models with low-latency execution.
 */
export async function queryAIAssistant(
  userQuery: string,
  entityContext?: { type: string; id: string },
  signal?: AbortSignal,
  onStreamChunk?: (chunk: string) => void
): Promise<{ text: string; actionCards?: any[]; suggestedPrompts?: string[]; metricsUsed?: string[] }> {
  const settings = await getAISettings();
  const contextData = await getAIContext(userQuery, settings.privacy, entityContext);

  const isLocal = settings.mode === 'local' || settings.provider === 'ollama';

  // If no API Key and not local, fall back to offline analytical engine
  if (!isLocal && (!settings.apiKey || !settings.apiKey.trim())) {
    const res = await generateBuiltinAnalyticalResponse(userQuery, contextData, settings.tone, settings.behavioralFramework);
    if (onStreamChunk) onStreamChunk(res.text);
    return {
      text: res.text,
      actionCards: res.actionCards,
      suggestedPrompts: res.suggestedPrompts,
      metricsUsed: contextData.metricsUsed,
    };
  }

  // Compact System Prompt for Local Models to minimize KV cache prefill latency
  const systemPrompt = isLocal
    ? `You are Habit OS Productivity Assistant. Be concise (max 3 sentences). Context: ${contextData.summary.slice(0, 300)}`
    : `
You are Habit OS AI Assistant, a personal productivity copilot.

BEHAVIORAL FRAMEWORK & PERSONALIZATION DIRECTIVES:
${settings.behavioralFramework || 'Act as a factual personal productivity copilot.'}

TONE MODE: ${settings.tone || 'analytical'}

APPLICATION CONTEXT & METRICS:
${contextData.summary}

CRITICAL RULES:
1. Do NOT invent or fabricate statistics. Use ONLY the provided application context.
2. If the user asks a general question or greeting (like "hello", "hi"), give a friendly, helpful conversational answer explaining how you can help analyze their habits, focus, and tasks.
3. If data is unavailable, explicitly state that more data is required.
  `.trim();

  const endpoint = normalizeEndpointUrl(settings.endpoint, isLocal);
  const model = settings.model || (isLocal ? 'llama3.1' : 'gpt-4o-mini');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (!isLocal && settings.apiKey?.trim()) {
    headers['Authorization'] = `Bearer ${settings.apiKey.trim()}`;
  }

  // Disable deep thinking/reasoning and set low token limits for 3-10s local response times
  const requestBody: any = {
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userQuery },
    ],
    temperature: isLocal ? 0.3 : (settings.temperature || 0.7),
    max_tokens: isLocal ? 256 : 1024,
  };

  if (isLocal) {
    requestBody.options = {
      num_predict: 256,
      num_ctx: 2048,
      temperature: 0.3,
      thinking: false,
      reasoning: false,
    };
  }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      signal,
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`API Provider Error (${response.status}): ${errText.slice(0, 160)}`);
    }

    const data = await response.json();
    const responseText =
      data.choices?.[0]?.message?.content ||
      data.content?.[0]?.text ||
      data.response ||
      'No text response generated from model.';

    if (onStreamChunk) onStreamChunk(responseText);

    return {
      text: responseText,
      metricsUsed: contextData.metricsUsed,
      suggestedPrompts: ['Analyze Today', 'Review My Habits', 'Explain Focus Efficiency'],
    };
  } catch (err: any) {
    if (err.name === 'AbortError') {
      return { text: '_Request cancelled by user._' };
    }

    return {
      text: `> [!WARNING]\n> **AI Model Connection Error**: ${err.message}\n>\n> Please verify your configuration in [Settings & AI Personalization].`,
      suggestedPrompts: ['Analyze Today', 'Review My Habits', 'Explain Focus Efficiency'],
      metricsUsed: contextData.metricsUsed,
    };
  }
}
