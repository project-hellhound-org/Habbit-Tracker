import { db, AISettings } from '../db/schema';
import { getAIContext, generateBuiltinAnalyticalResponse } from '../engine/aiContextEngine';

export const DEFAULT_AI_SETTINGS: AISettings = {
  id: 'default',
  provider: 'builtin',
  model: 'gpt-4o-mini',
  apiKey: '',
  endpoint: '',
  temperature: 0.7,
  tone: 'analytical',
  behavioralFramework: 'Act as a precise, factual personal productivity copilot. Provide direct, evidence-based data interpretations.',
  privacy: {
    allowHabitData: true,
    allowTaskData: true,
    allowProjectData: true,
    allowGoalData: true,
    allowFocusData: true,
    allowJournalData: false,
    allowHistoricalData: true,
  },
  enableStreaming: true,
};

export function maskApiKey(key?: string): string {
  if (!key || key.length < 8) return '';
  const prefix = key.slice(0, 3);
  const suffix = key.slice(-4);
  return `${prefix}••••••••${suffix}`;
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

export async function testAIConnection(settings: AISettings): Promise<{ success: boolean; message: string }> {
  if (settings.provider === 'builtin') {
    return { success: true, message: 'Built-in Offline Analytics Engine active and operating cleanly.' };
  }

  if (!settings.apiKey && settings.provider !== 'custom') {
    return { success: false, message: 'API Key is missing. Please enter your API key.' };
  }

  try {
    if (settings.provider === 'nvidia') {
      const endpoint = settings.endpoint || 'https://integrate.api.nvidia.com/v1/chat/completions';
      const model = settings.model || 'meta/llama-3.1-70b-instruct';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${settings.apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: 'Ping' }],
          max_tokens: 16,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, message: `NVIDIA API Error (${response.status}): ${errorText.slice(0, 150)}` };
      }
      return { success: true, message: `NVIDIA NIM Connection Verified (${model})!` };
    }

    if (settings.provider === 'openai' || settings.provider === 'custom') {
      const endpoint = settings.endpoint || 'https://api.openai.com/v1/chat/completions';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${settings.apiKey}`,
        },
        body: JSON.stringify({
          model: settings.model || 'gpt-4o-mini',
          messages: [{ role: 'user', content: 'Ping' }],
          max_tokens: 16,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, message: `OpenAI Error (${response.status}): ${errorText.slice(0, 150)}` };
      }
      return { success: true, message: 'OpenAI Connection verified successfully!' };
    }

    if (settings.provider === 'anthropic') {
      const endpoint = settings.endpoint || 'https://api.anthropic.com/v1/messages';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': settings.apiKey || '',
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: settings.model || 'claude-3-5-sonnet-20241022',
          max_tokens: 16,
          messages: [{ role: 'user', content: 'Ping' }],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, message: `Anthropic Error (${response.status}): ${errorText.slice(0, 150)}` };
      }
      return { success: true, message: 'Anthropic Claude Connection verified successfully!' };
    }

    if (settings.provider === 'gemini') {
      const model = settings.model || 'gemini-1.5-flash';
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${settings.apiKey}`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Ping' }] }],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, message: `Gemini Error (${response.status}): ${errorText.slice(0, 150)}` };
      }
      return { success: true, message: 'Google Gemini Connection verified successfully!' };
    }

    return { success: true, message: 'Provider configuration verified.' };
  } catch (err: any) {
    return { success: false, message: `Network error connecting to provider: ${err.message || err}` };
  }
}

export async function queryAIAssistant(
  userQuery: string,
  entityContext?: { type: string; id: string },
  signal?: AbortSignal,
  onStreamChunk?: (chunk: string) => void
): Promise<{ text: string; actionCards?: any[]; suggestedPrompts?: string[]; metricsUsed?: string[] }> {
  const settings = await getAISettings();
  const contextData = await getAIContext(userQuery, settings.privacy, entityContext);

  if (settings.provider === 'builtin' || !settings.apiKey) {
    const res = await generateBuiltinAnalyticalResponse(userQuery, contextData, settings.tone, settings.behavioralFramework);
    if (onStreamChunk) {
      onStreamChunk(res.text);
    }
    return {
      text: res.text,
      actionCards: res.actionCards,
      suggestedPrompts: res.suggestedPrompts,
      metricsUsed: contextData.metricsUsed,
    };
  }

  const systemPrompt = `
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

  try {
    if (settings.provider === 'nvidia') {
      const endpoint = settings.endpoint || 'https://integrate.api.nvidia.com/v1/chat/completions';
      const model = settings.model || 'meta/llama-3.1-70b-instruct';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${settings.apiKey}`,
        },
        signal,
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userQuery },
          ],
          temperature: settings.temperature || 0.7,
          max_tokens: 1024,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`NVIDIA API Error (${response.status}): ${errText.slice(0, 200)}`);
      }

      const data = await response.json();
      const responseText = data.choices?.[0]?.message?.content || 'No response generated from NVIDIA NIM model.';

      if (onStreamChunk) onStreamChunk(responseText);

      return {
        text: responseText,
        metricsUsed: contextData.metricsUsed,
        suggestedPrompts: ['Analyze Today', 'Review My Habits', 'Explain Focus Efficiency'],
      };
    }

    if (settings.provider === 'anthropic') {
      const endpoint = settings.endpoint || 'https://api.anthropic.com/v1/messages';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': settings.apiKey || '',
          'anthropic-version': '2023-06-01',
        },
        signal,
        body: JSON.stringify({
          model: settings.model || 'claude-3-5-sonnet-20241022',
          max_tokens: 1024,
          system: systemPrompt,
          messages: [{ role: 'user', content: userQuery }],
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Anthropic API Error (${response.status}): ${errText.slice(0, 200)}`);
      }

      const data = await response.json();
      const text = data.content?.[0]?.text || 'No response generated from Anthropic.';
      if (onStreamChunk) onStreamChunk(text);

      return {
        text,
        metricsUsed: contextData.metricsUsed,
        suggestedPrompts: ['Analyze Today', 'Review My Habits', 'Explain Focus Efficiency'],
      };
    }

    if (settings.provider === 'gemini') {
      const model = settings.model || 'gemini-1.5-flash';
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${settings.apiKey}`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal,
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: `${systemPrompt}\n\nUser Question:\n${userQuery}` }],
            },
          ],
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Gemini API Error (${response.status}): ${errText.slice(0, 200)}`);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated from Gemini.';
      if (onStreamChunk) onStreamChunk(text);

      return {
        text,
        metricsUsed: contextData.metricsUsed,
        suggestedPrompts: ['Analyze Today', 'Review My Habits', 'Explain Focus Efficiency'],
      };
    }

    const endpoint = settings.endpoint || 'https://api.openai.com/v1/chat/completions';
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.apiKey}`,
      },
      signal,
      body: JSON.stringify({
        model: settings.model || 'gpt-4o-mini',
        temperature: settings.temperature || 0.7,
        max_tokens: 1024,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userQuery },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenAI/Custom Provider Error (${response.status}): ${errText.slice(0, 200)}`);
    }

    const data = await response.json();
    const responseText = data.choices?.[0]?.message?.content || 'No response generated from AI API.';
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
      text: `> [!WARNING]\n> **AI Provider Connection Error**: ${err.message}\n>\n> Please verify your API Key and Model Name in [Settings & AI Configuration].`,
      suggestedPrompts: ['Analyze Today', 'Review My Habits', 'Explain Focus Efficiency'],
      metricsUsed: contextData.metricsUsed,
    };
  }
}
