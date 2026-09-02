import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, AISettings } from '../db/schema';
import { resetAllDataToInitialState } from '../db/seed';
import { getAISettings, saveAISettings, testAIConnection, maskApiKey } from '../services/aiProviderService';
import { Download, Upload, Trash2, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';

export const SettingsView: React.FC = () => {
  const settings = useLiveQuery(() => db.settings.get('default'));
  const aiSettingsLive = useLiveQuery(() => db.aiSettings.get('default'));

  const [userName, setUserName] = useState(settings?.userName || 'User');
  const [theme, setTheme] = useState<'dark' | 'light' | 'system'>(settings?.theme || 'dark');
  const [accentColor, setAccentColor] = useState<string>(settings?.accentColor || '#ffffff');

  const [aiProvider, setAiProvider] = useState<AISettings['provider']>('builtin');
  const [aiModel, setAiModel] = useState<string>('gpt-4o-mini');
  const [apiKeyInput, setApiKeyInput] = useState<string>('');
  const [customEndpoint, setCustomEndpoint] = useState<string>('');
  const [temperature, setTemperature] = useState<number>(0.7);

  const [aiTone, setAiTone] = useState<AISettings['tone']>('analytical');
  const [behavioralFramework, setBehavioralFramework] = useState<string>(
    'Act as a precise, factual personal productivity copilot. Provide direct, evidence-based data interpretations.'
  );

  const [testResult, setTestResult] = useState<{ success?: boolean; message?: string } | null>(null);

  useEffect(() => {
    getAISettings().then((res) => {
      setAiProvider(res.provider);
      setAiModel(res.model);
      setApiKeyInput(res.apiKey || '');
      setCustomEndpoint(res.endpoint || '');
      setTemperature(res.temperature);
      setAiTone(res.tone || 'analytical');
      setBehavioralFramework(res.behavioralFramework || '');
    });
  }, [aiSettingsLive?.provider]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await db.settings.put({
      id: 'default',
      userName,
      theme,
      accentColor,
      weekStartDay: 1,
      productivityWeights: { habitWeight: 40, taskWeight: 30, focusWeight: 20, goalWeight: 10 },
      streakSkipRule: 'pause',
      verificationSettings: { defaultIntervalMinutes: 30, gracePeriodMinutes: 2, verificationRequired: true, excludeUnverifiedFromProductivity: true },
    });

    await saveAISettings({
      provider: aiProvider,
      model: aiModel,
      apiKey: apiKeyInput,
      endpoint: customEndpoint,
      temperature,
      tone: aiTone,
      behavioralFramework,
    });

    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.style.setProperty('--accent-primary', accentColor);
    alert('Settings saved successfully.');
  };

  const handleTestAIConnection = async () => {
    setTestResult(null);
    const res = await testAIConnection({
      id: 'default',
      provider: aiProvider,
      model: aiModel,
      apiKey: apiKeyInput,
      endpoint: customEndpoint,
      temperature,
      tone: aiTone,
      behavioralFramework,
      privacy: { allowHabitData: true, allowTaskData: true, allowProjectData: true, allowGoalData: true, allowFocusData: true, allowJournalData: false, allowHistoricalData: true },
      enableStreaming: true,
    });
    setTestResult(res);
  };

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div>
        <h2>Settings & AI Personalization</h2>
        <p className="subtitle">Configure AI provider credentials, persona tones, and application theme.</p>
      </div>

      <div className="glass-card">
        <h3><Sparkles size={16} /> AI Provider Credentials</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
          <div className="form-group">
            <label className="form-label">AI Provider</label>
            <select className="form-select" value={aiProvider} onChange={(e) => setAiProvider(e.target.value as any)}>
              <option value="builtin">Built-in Local Analytical Engine (100% Offline)</option>
              <option value="nvidia">NVIDIA NIM (Open-Source Llama 3.1 & Mixtral)</option>
              <option value="openai">OpenAI (GPT-4o / GPT-4o-mini)</option>
              <option value="anthropic">Anthropic Claude (Claude 3.5 Sonnet)</option>
              <option value="gemini">Google Gemini (Gemini 1.5 Flash)</option>
              <option value="custom">Custom OpenAI-Compatible API Endpoint</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Model Identifier</label>
            <input type="text" className="form-input" value={aiModel} onChange={(e) => setAiModel(e.target.value)} placeholder="e.g. gpt-4o-mini or meta/llama-3.1-70b-instruct" />
          </div>

          <div className="form-group">
            <label className="form-label">API Key {apiKeyInput && <span className="subtitle">({maskApiKey(apiKeyInput)})</span>}</label>
            <input type="password" className="form-input" value={apiKeyInput} onChange={(e) => setApiKeyInput(e.target.value)} placeholder="sk-... or nvapi-..." />
          </div>

          <div className="form-group">
            <label className="form-label">API Endpoint URL</label>
            <input type="text" className="form-input" value={customEndpoint} onChange={(e) => setCustomEndpoint(e.target.value)} placeholder="https://integrate.api.nvidia.com/v1/chat/completions" />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', alignItems: 'center' }}>
          <button type="button" className="btn btn-secondary" onClick={handleTestAIConnection}>
            Test Connection
          </button>
          {testResult && (
            <span style={{ fontSize: '0.8rem', color: testResult.success ? 'var(--text-primary)' : 'var(--danger)' }}>
              {testResult.message}
            </span>
          )}
        </div>
      </div>

      <div className="glass-card">
        <h3>General Preferences & Theme</h3>
        <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
          <div className="form-group">
            <label className="form-label">User Name</label>
            <input type="text" className="form-input" value={userName} onChange={(e) => setUserName(e.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label">Theme Mode</label>
            <select className="form-select" value={theme} onChange={(e) => setTheme(e.target.value as any)}>
              <option value="dark">Dark Mode (Near-Black #080a0f Canvas)</option>
              <option value="light">Light Mode (Pure White #ffffff Canvas)</option>
            </select>
          </div>

          <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
            Save Preferences
          </button>
        </form>
      </div>
    </div>
  );
};
