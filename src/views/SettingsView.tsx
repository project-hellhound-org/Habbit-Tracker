import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, AISettings } from '../db/schema';
import { resetAllDataToInitialState } from '../db/seed';
import { getAISettings, saveAISettings, testAIConnection, maskApiKey } from '../services/aiProviderService';
import { Download, Upload, Trash2, Sparkles, Lock, ShieldAlert, KeyRound } from 'lucide-react';

export const SettingsView: React.FC = () => {
  const settings = useLiveQuery(() => db.settings.get('default'));
  const aiSettingsLive = useLiveQuery(() => db.aiSettings.get('default'));

  const [userName, setUserName] = useState(settings?.userName || 'User');
  const [theme, setTheme] = useState<'dark' | 'light' | 'system'>(settings?.theme || 'dark');
  const [accentColor, setAccentColor] = useState<string>(settings?.accentColor || '#ffffff');

  // Master App Password State
  const [appPasswordInput, setAppPasswordInput] = useState(settings?.appPassword || '');
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [verifyPasswordPrompt, setVerifyPasswordPrompt] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [pendingAction, setPendingAction] = useState<'clear_db' | 'export_data' | null>(null);

  // AI Settings State
  const [aiProvider, setAiProvider] = useState<AISettings['provider']>('builtin');
  const [aiModel, setAiModel] = useState<string>('llama3.1');
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
      appPassword: appPasswordInput,
      weekStartDay: 1,
      productivityWeights: { habitWeight: 40, taskWeight: 30, focusWeight: 20, goalWeight: 10 },
      streakSkipRule: 'pause',
      streakFreezeEarned: settings?.streakFreezeEarned || 0,
      streakFreezeActiveUntil: settings?.streakFreezeActiveUntil || null,
      consecutiveDays100Pct: settings?.consecutiveDays100Pct || 0,
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
    alert('Settings & Password saved successfully.');
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

  const handleTriggerProtectedAction = (action: 'clear_db' | 'export_data') => {
    setPendingAction(action);
    setVerifyPasswordPrompt('');
    setPasswordError('');
    setIsPasswordModalOpen(true);
  };

  const handleVerifyPasswordAndExecute = async () => {
    const masterPassword = settings?.appPassword || appPasswordInput;

    if (masterPassword && verifyPasswordPrompt !== masterPassword) {
      setPasswordError('Invalid Master Password! Verification failed.');
      return;
    }

    setIsPasswordModalOpen(false);

    if (pendingAction === 'clear_db') {
      await resetAllDataToInitialState();
      alert('Database cleared successfully! All tables reset.');
      window.location.reload();
    } else if (pendingAction === 'export_data') {
      const habitsData = await db.habits.toArray();
      const tasksData = await db.tasks.toArray();
      const exportJson = JSON.stringify({ habits: habitsData, tasks: tasksData }, null, 2);
      const blob = new Blob([exportJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `HabitOS_Backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
    }
  };

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div>
        <h2>Settings & AI Personalization</h2>
        <p className="subtitle">Configure Ollama local AI, master password security, cloud LLM credentials, and database operations.</p>
      </div>

      {/* AI Provider Credentials Box */}
      <div className="glass-card">
        <h3><Sparkles size={16} /> AI Model Integration (Ollama & Cloud APIs)</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
          <div className="form-group">
            <label className="form-label">AI Provider Target</label>
            <select
              className="form-select"
              value={aiProvider}
              onChange={(e) => {
                const prov = e.target.value as any;
                setAiProvider(prov);
                if (prov === 'ollama') {
                  setCustomEndpoint('http://localhost:11434/v1/chat/completions');
                  setAiModel('llama3.1');
                } else if (prov === 'nvidia') {
                  setCustomEndpoint('https://integrate.api.nvidia.com/v1/chat/completions');
                  setAiModel('meta/llama-3.1-70b-instruct');
                }
              }}
            >
              <option value="builtin">Built-in Local Analytical Engine (100% Offline)</option>
              <option value="ollama">Ollama Local Base AI (http://localhost:11434)</option>
              <option value="nvidia">NVIDIA NIM (Open-Source Llama 3.1 & Mixtral)</option>
              <option value="openai">OpenAI (GPT-4o / GPT-4o-mini)</option>
              <option value="anthropic">Anthropic Claude (Claude 3.5 Sonnet)</option>
              <option value="gemini">Google Gemini (Gemini 1.5 Flash)</option>
              <option value="custom">Custom OpenAI-Compatible Endpoint</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Model Identifier</label>
            <input
              type="text"
              className="form-input"
              value={aiModel}
              onChange={(e) => setAiModel(e.target.value)}
              placeholder="e.g. llama3.1, mistral, gpt-4o-mini..."
            />
          </div>

          <div className="form-group">
            <label className="form-label">API Key {apiKeyInput && <span className="subtitle">({maskApiKey(apiKeyInput)})</span>}</label>
            <input
              type="password"
              className="form-input"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder="sk-... or nvapi-... (Not needed for Ollama)"
            />
          </div>

          <div className="form-group">
            <label className="form-label">API Endpoint URL</label>
            <input
              type="text"
              className="form-input"
              value={customEndpoint}
              onChange={(e) => setCustomEndpoint(e.target.value)}
              placeholder="http://localhost:11434/v1/chat/completions"
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', alignItems: 'center' }}>
          <button type="button" className="btn btn-secondary" onClick={handleTestAIConnection}>
            Test Model Connection
          </button>
          {testResult && (
            <span style={{ fontSize: '0.8rem', color: testResult.success ? 'var(--text-primary)' : 'var(--danger)' }}>
              {testResult.message}
            </span>
          )}
        </div>
      </div>

      {/* Password Security & Preferences */}
      <div className="glass-card">
        <h3><KeyRound size={16} /> Master App Password & Data Protection</h3>
        <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">User Profile Name</label>
              <input type="text" className="form-input" value={userName} onChange={(e) => setUserName(e.target.value)} />
            </div>

            <div className="form-group">
              <label className="form-label">Master Verification Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="Set master security password..."
                value={appPasswordInput}
                onChange={(e) => setAppPasswordInput(e.target.value)}
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
            Save Password & Settings
          </button>
        </form>
      </div>

      {/* Protected Database Administration */}
      <div className="glass-card" style={{ borderColor: 'rgba(239, 68, 68, 0.4)' }}>
        <h3 style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ShieldAlert size={18} /> Password-Protected Database Operations
        </h3>
        <p className="subtitle" style={{ marginTop: '0.25rem' }}>
          Database extraction and total deletion tasks are protected by master password verification.
        </p>

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
          <button className="btn btn-secondary" onClick={() => handleTriggerProtectedAction('export_data')}>
            <Download size={14} /> Extract Data Backup (JSON)
          </button>
          <button className="btn btn-danger" onClick={() => handleTriggerProtectedAction('clear_db')}>
            <Trash2 size={14} /> Clear Entire Database
          </button>
        </div>
      </div>

      {/* Password Verification Modal */}
      {isPasswordModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '420px', background: 'var(--bg-secondary)', display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', color: 'var(--danger)' }}>
              <Lock size={36} />
            </div>
            <h3>Master Password Verification Required</h3>
            <p className="subtitle">
              Enter your master security password to execute: <strong>{pendingAction === 'clear_db' ? 'Clear Entire Database' : 'Extract Data Backup'}</strong>.
            </p>

            <input
              type="password"
              className="form-input"
              placeholder="Enter master password..."
              value={verifyPasswordPrompt}
              onChange={(e) => setVerifyPasswordPrompt(e.target.value)}
            />

            {passwordError && <span style={{ color: 'var(--danger)', fontSize: '0.8rem' }}>{passwordError}</span>}

            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button className="btn btn-secondary" onClick={() => setIsPasswordModalOpen(false)}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={handleVerifyPasswordAndExecute}>
                Verify & Execute
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
